"use server";

import { stripe } from "~/lib/checkout/stripe";
import { auth } from "@clerk/nextjs/server";
import { env } from "~/env";
import {
  AppliedDiscount,
  CartItem,
  isQuoteItem,
} from "~/lib/stores/shopping-cart";
import { redirect } from "next/navigation";

export async function createCheckoutSession({
  cartId,
  items,
  discounts,
}: {
  cartId?: string;
  items: CartItem[];
  discounts: AppliedDiscount[];
}) {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("User must be authenticated to checkout");
  }

  if (!cartId) {
    throw new Error("Missing or invalid cart id");
  }

  const origin = env.LUNDHE_AUDIO_DOMAIN;

  const pricedItems = items.map((item) => {
    item.price =
      item.price *
      (1 -
        discounts
          .filter((discount) => discount.items.find((id) => id === item.id))
          .reduce((prev, cur) => prev + cur.percentage, 0) /
          100);

    return item;
  });

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    client_reference_id: userId,
    metadata: {
      userId,
      cartId,
    },
    payment_method_types: ["card", "link"],
    line_items: pricedItems.map((item) => ({
      price_data: {
        product_data: {
          name: item.name,
          metadata: {
            cartItemId: item.id,
            cartId: cartId,
          },
        },
        unit_amount: Math.trunc(item.price * 100),
        currency: "usd",
      },
      quantity: isQuoteItem(item) ? 1 : item.quantity,
    })),
    success_url: `${origin}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
    payment_intent_data: {
      setup_future_usage: "off_session",
    },
  });

  session.url ? redirect(session.url) : redirect("/checkout/error");
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  });

  return {
    id: session.id,
    cartId: session.metadata?.cartId ?? null,
    clientReferenceId: session.client_reference_id,
    paymentIntentId:
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : (session.payment_intent?.id ?? null),
    status: session.status,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_details?.email,
    currency: session.currency,
    amountSubtotal: session.amount_subtotal,
    amountDiscount: session.total_details?.amount_discount ?? 0,
    amountTotal: session.amount_total,
    createdAt: new Date(session.created * 1000).toISOString(),
    lineItems: session.line_items?.data.map((item) => ({
      name: item.description,
      quantity: item.quantity,
      amountTotal: item.amount_total,
    })),
    redirect:
      session.status === "complete"
        ? session.success_url
        : session.status === "expired"
          ? session.cancel_url
          : session.return_url,
  };
}
