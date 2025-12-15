import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { XCircle, ShoppingCart, Clock } from "lucide-react"
import Link from "next/link"

export default function CancelledPage() {
  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-2xl mx-auto px-4">
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto mb-4 !w-[24px] !h-[24px] rounded-full flex items-center justify-center">
              <XCircle className="text-amber-600" />
            </div>
            <CardTitle className="text-2xl">Order Cancelled</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center text-muted-foreground">
              <p>Your checkout has been cancelled. You have not been charged.</p>
            </div>

            <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-3">
              <div className="flex flex-col gap-1">
                <p className="font-medium flex gap-1">
                  <Clock className="!w-[16px] !h-[16px] text-muted-foreground mt-0.5" />
                  <span>Your cart is saved</span>
                </p>
                <p className="text-sm text-muted-foreground">
                  Your items will be saved in your cart for the next 24 hours. You can return at any time to complete
                  your purchase.
                </p>
              </div>
            </div>

            <div className="pt-4 flex gap-4">
              <Button asChild className="flex-1 border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">
                <Link href="/checkout">
                  <ShoppingCart className="!w-[16px] !h-[16px] mr-2" />
                  Return to Checkout
                </Link>
              </Button>
              <Button asChild variant="outline" className="flex-1 border dark:border-white hover:bg-black dark:hover:bg-white dark:hover:text-black">
                <Link href="/">Continue Shopping</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
