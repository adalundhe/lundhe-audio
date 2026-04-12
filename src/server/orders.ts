import "server-only";

import { asc, desc, eq, inArray } from "drizzle-orm";
import type Stripe from "stripe";

import { syncOrderSongSpecsFromCart } from "~/server/order-detail";
import { db } from "~/server/db/client";
import { orderItems, orders } from "~/server/db/schema";
import type {
  OrderCheckoutStatus,
  OrderListItem,
} from "~/types/orders";

type CheckoutLineItem = {
  name: string;
  quantity: number | null;
  amountTotal: number | null;
};

export interface CheckoutOrderRecordInput {
  userId: string;
  cartId: string | null;
  checkoutSessionId: string;
  paymentIntentId: string | null;
  customerEmail: string | null;
  status: Stripe.Checkout.Session.Status | null;
  paymentStatus: Stripe.Checkout.Session.PaymentStatus | null;
  currency: string | null;
  amountSubtotal: number | null;
  amountDiscount: number | null;
  amountTotal: number | null;
  orderedAt: string;
  lineItems: CheckoutLineItem[];
}

export interface OrdersQueryResult {
  orders: OrderListItem[];
  isAvailable: boolean;
}

const toDollars = (amountInCents: number | null | undefined) => {
  return (amountInCents ?? 0) / 100;
};

const getCheckoutStatus = (
  sessionStatus: Stripe.Checkout.Session.Status | null,
  paymentStatus: Stripe.Checkout.Session.PaymentStatus | null,
): OrderCheckoutStatus => {
  if (paymentStatus === "paid") return "paid";
  if (paymentStatus === "no_payment_required") return "no-payment-required";
  if (sessionStatus === "expired") return "expired";
  if (sessionStatus === "open" || sessionStatus === "complete")
    return "processing";
  return "unpaid";
};

const isMissingOrdersSchemaError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("no such table: orders") ||
    error.message.includes("no such table: order_items") ||
    error.message.includes("no such column: orders.workflow_status")
  );
};

export const upsertCheckoutOrder = async (input: CheckoutOrderRecordInput) => {
  try {
    const createdTimestamp = new Date().toISOString();
    const subtotal = toDollars(input.amountSubtotal);
    const discount = toDollars(input.amountDiscount);
    const total = toDollars(input.amountTotal);
    const normalizedLineItems = input.lineItems.map((item) => {
      const quantity = item.quantity ?? 1;
      const totalPrice = toDollars(item.amountTotal);

      return {
        id: crypto.randomUUID(),
        name: item.name,
        quantity,
        totalPrice,
        unitPrice: quantity > 0 ? totalPrice / quantity : totalPrice,
        created_timestamp: createdTimestamp,
        updated_timestamp: createdTimestamp,
      };
    });

    const itemCount = normalizedLineItems.reduce(
      (count, item) => count + item.quantity,
      0,
    );

    const orderRecord = await db
      .insert(orders)
      .values({
        id: crypto.randomUUID(),
        userId: input.userId,
        checkoutSessionId: input.checkoutSessionId,
        paymentIntentId: input.paymentIntentId,
        customerEmail: input.customerEmail,
        status: getCheckoutStatus(input.status, input.paymentStatus),
        workflowStatus: "awaiting-files",
        paymentStatus: input.paymentStatus ?? "unpaid",
        currency: input.currency ?? "usd",
        subtotal,
        discount,
        total,
        itemCount,
        ordered_timestamp: input.orderedAt,
        created_timestamp: createdTimestamp,
        updated_timestamp: createdTimestamp,
      })
      .onConflictDoUpdate({
        target: orders.checkoutSessionId,
        set: {
          paymentIntentId: input.paymentIntentId,
          customerEmail: input.customerEmail,
          status: getCheckoutStatus(input.status, input.paymentStatus),
          paymentStatus: input.paymentStatus ?? "unpaid",
          currency: input.currency ?? "usd",
          subtotal,
          discount,
          total,
          itemCount,
          ordered_timestamp: input.orderedAt,
          updated_timestamp: createdTimestamp,
        },
      })
      .returning()
      .get();

    await db.delete(orderItems).where(eq(orderItems.orderId, orderRecord.id));

    if (normalizedLineItems.length > 0) {
      await db.insert(orderItems).values(
        normalizedLineItems.map((item) => ({
          ...item,
          orderId: orderRecord.id,
        })),
      );
    }

    if (input.cartId) {
      await syncOrderSongSpecsFromCart({
        orderId: orderRecord.id,
        cartId: input.cartId,
      });
    }

    return orderRecord;
  } catch (error) {
    if (isMissingOrdersSchemaError(error)) {
      console.warn(
        "Order persistence is unavailable because the orders migration has not been applied yet.",
      );
      return null;
    }

    throw error;
  }
};

export interface AdminOrderListItem extends OrderListItem {
  userId: string;
}

export interface AdminOrdersQueryResult {
  orders: AdminOrderListItem[];
  isAvailable: boolean;
}

/**
 * Admin-only: list every order in the system, regardless of which user it
 * belongs to. Caller is responsible for the role check (use `adminProcedure`
 * in tRPC, or `getCurrentUserRole` in a server component).
 */
export const getAllOrdersForAdmin =
  async (): Promise<AdminOrdersQueryResult> => {
    try {
      const allOrders = await db
        .select()
        .from(orders)
        .orderBy(desc(orders.ordered_timestamp));

      if (allOrders.length === 0) {
        return {
          orders: [],
          isAvailable: true,
        };
      }

      const items = await db
        .select()
        .from(orderItems)
        .where(
          inArray(
            orderItems.orderId,
            allOrders.map((order) => order.id),
          ),
        )
        .orderBy(asc(orderItems.created_timestamp));

      const itemsByOrderId = items.reduce<
        Record<string, OrderListItem["items"]>
      >((grouped, item) => {
        grouped[item.orderId] ??= [];
        grouped[item.orderId]?.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: item.totalPrice,
        });
        return grouped;
      }, {});

      return {
        orders: allOrders.map((order) => ({
          id: order.id,
          userId: order.userId,
          checkoutSessionId: order.checkoutSessionId,
          paymentIntentId: order.paymentIntentId,
          customerEmail: order.customerEmail,
          checkoutStatus: order.status,
          workflowStatus: order.workflowStatus,
          paymentStatus: order.paymentStatus,
          currency: order.currency,
          subtotal: order.subtotal,
          discount: order.discount,
          total: order.total,
          itemCount: order.itemCount,
          orderedAt: order.ordered_timestamp,
          items: itemsByOrderId[order.id] ?? [],
        })),
        isAvailable: true,
      };
    } catch (error) {
      if (isMissingOrdersSchemaError(error)) {
        return {
          orders: [],
          isAvailable: false,
        };
      }

      throw error;
    }
  };

export const getOrdersForUser = async (
  userId: string,
): Promise<OrdersQueryResult> => {
  try {
    const userOrders = await db
      .select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.ordered_timestamp));

    if (userOrders.length === 0) {
      return {
        orders: [],
        isAvailable: true,
      };
    }

    const items = await db
      .select()
      .from(orderItems)
      .where(
        inArray(
          orderItems.orderId,
          userOrders.map((order) => order.id),
        ),
      )
      .orderBy(asc(orderItems.created_timestamp));

    const itemsByOrderId = items.reduce<Record<string, OrderListItem["items"]>>(
      (grouped, item) => {
        grouped[item.orderId] ??= [];
        grouped[item.orderId]?.push({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          total: item.totalPrice,
        });
        return grouped;
      },
      {},
    );

    return {
      orders: userOrders.map((order) => ({
        id: order.id,
        checkoutSessionId: order.checkoutSessionId,
        paymentIntentId: order.paymentIntentId,
        customerEmail: order.customerEmail,
        checkoutStatus: order.status,
        workflowStatus: order.workflowStatus,
        paymentStatus: order.paymentStatus,
        currency: order.currency,
        subtotal: order.subtotal,
        discount: order.discount,
        total: order.total,
        itemCount: order.itemCount,
        orderedAt: order.ordered_timestamp,
        items: itemsByOrderId[order.id] ?? [],
      })),
      isAvailable: true,
    };
  } catch (error) {
    if (isMissingOrdersSchemaError(error)) {
      return {
        orders: [],
        isAvailable: false,
      };
    }

    throw error;
  }
};
