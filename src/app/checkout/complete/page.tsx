import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { getCheckoutSession } from "~/actions/cart/checkout"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { CheckCircle } from "lucide-react"
import Link from "next/link"
import { ClearCartOnSuccess } from "~/components/checkout/clear-cart-on-success"

interface CompletePageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function CompletePage({ searchParams }: CompletePageProps) {
  const { userId } = await auth()
  const params = await searchParams

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()
  const sessionId = params.session_id

  if (!sessionId) {
    redirect("/checkout/error")
  }

  let session
  try {
    session = await getCheckoutSession(sessionId)
  } catch (error) {
    console.error("Failed to retrieve session:", error)
    redirect("/checkout/error")
  }

  if (session.status !== "complete" || session.paymentStatus !== "paid") {
    redirect("/checkout/error")
  }

  const userName = user?.firstName
    ? `${user.firstName}${user.lastName ? ` ${user.lastName}` : ""}`
    : user?.username || "Customer"
  const userEmail = user?.emailAddresses[0]?.emailAddress || session.customerEmail || ""

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        {/* Clear cart on successful payment */}
        <ClearCartOnSuccess />

        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 !w-[24px] !h-[24px] rounded-full flex items-center justify-center">
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
              <h3 className="font-semibold mb-3">Order Items</h3>
              <div className="space-y-3">
                {session.lineItems?.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      {item.quantity && item.quantity > 1 && (
                        <p className="text-muted-foreground">Qty: {item.quantity}</p>
                      )}
                    </div>
                    <p className="font-medium">${((item.amountTotal || 0) / 100).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between font-bold text-lg">
              <span>Total Paid</span>
              <span>${((session.amountTotal || 0) / 100).toFixed(2)}</span>
            </div>

            <div className="pt-4 flex gap-4">
              <Button asChild className="flex-1 border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">
                <Link href="/">Back to Home</Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">
                <Link href="/account">View Account</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
