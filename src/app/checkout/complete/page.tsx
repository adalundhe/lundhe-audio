import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getCheckoutSession } from "~/actions/cart/checkout";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { ClearCartOnSuccess } from "~/components/checkout/clear-cart-on-success";
import { upsertCheckoutOrder } from "~/server/orders";

interface CompletePageProps {
  searchParams: Promise<{ session_id?: string }>;
}

export default async function CompletePage({
  searchParams,
}: CompletePageProps) {
  const { userId } = await auth();
  const params = await searchParams;

  if (!userId) {
    redirect("/sign-in");
  }

  const user = await currentUser();
  const sessionId = params.session_id;

  if (!sessionId) {
    redirect("/checkout/error");
  }

  let session;
  try {
    session = await getCheckoutSession(sessionId);
  } catch (error) {
    console.error("Failed to retrieve session:", error);
    redirect("/checkout/error");
  }

  if (session.status !== "complete" || session.paymentStatus !== "paid") {
    redirect("/checkout/error");
  }

  if (session.clientReferenceId && session.clientReferenceId !== userId) {
    redirect("/checkout/error");
  }

  const userName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.username || "Customer";
  const userEmail =
    user?.emailAddresses[0]?.emailAddress || session.customerEmail || "";

  await upsertCheckoutOrder({
    userId,
    cartId: session.cartId,
    checkoutSessionId: session.id,
    paymentIntentId: session.paymentIntentId,
    customerEmail: userEmail,
    status: session.status,
    paymentStatus: session.paymentStatus,
    currency: session.currency,
    amountSubtotal: session.amountSubtotal,
    amountDiscount: session.amountDiscount,
    amountTotal: session.amountTotal,
    orderedAt: session.createdAt,
    lineItems:
      session.lineItems?.map((item) => ({
        name: item.name ?? "Order item",
        quantity: item.quantity,
        amountTotal: item.amountTotal,
      })) ?? [],
  });

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container mx-auto max-w-2xl px-4">
        {/* Clear cart on successful payment */}
        <ClearCartOnSuccess status={session.status} />

        <Card>
          <CardHeader className="pb-2 text-center">
            <div className="mx-auto mb-4 flex !h-[24px] !w-[24px] items-center justify-center rounded-full">
              <CheckCircle className="text-green-600" />
            </div>
            <CardTitle className="text-2xl">Order Successful!</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              <p>Thank you for your purchase. Your order has been confirmed.</p>
            </div>

            <Separator />

            {/* Order Details */}
            <div className="space-y-4">
              <div className="flex flex-col gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Order ID</p>
                  <p className="font-mono font-medium">{session.id}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{userName}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{userEmail}</p>
                </div>
              </div>
            </div>

            <Separator />

            {/* Line Items */}
            <div>
              <h3 className="mb-3 font-semibold">Order Items</h3>
              <div className="space-y-3">
                {session.lineItems?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-muted-foreground">
                          Qty: {item.quantity}
                        </p>
                      )}
                    </div>
                    <p className="font-medium">
                      ${((item.amountTotal || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between text-lg font-bold">
              <span>Total Paid</span>
              <span>${((session.amountTotal || 0) / 100).toFixed(2)}</span>
            </div>

            <div className="flex gap-4 pt-4">
              <Button
                asChild
                className="flex-1 border hover:bg-black dark:border-white dark:hover:bg-white dark:hover:text-black"
              >
                <Link href="/">Back to Home</Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex-1 border hover:bg-black dark:border-white dark:hover:bg-white dark:hover:text-black"
              >
                <Link href="/account">View Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
