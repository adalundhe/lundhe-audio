"use client"

import { useState, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Separator } from "~/components/ui/separator"
import { ShoppingCart, ArrowLeft, WalletCards, Tag } from "lucide-react"

import Link from "next/link"
import {
  useCartSubtotal,
  useCartDiscount,
  useCartTotal,
  useCart,
} from "~/hooks/use-shopping-cart"
import { isQuoteItem, isProductItem, type CartItem } from "~/lib/stores/shopping-cart"
import { createCheckoutSession } from "~/actions/cart/checkout"
import { useShallow } from "zustand/react/shallow"


function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}


interface CheckoutClientProps {
  userName: string
  userEmail: string
  userId: string
}

function getItemPrice(item: CartItem): number {
  if (isQuoteItem(item)) {
    return item.quote.costs.total
  }
  return item.price * item.quantity
}

export function CheckoutClient({ userName, userEmail }: CheckoutClientProps) {
  const subtotal = useCartSubtotal()
  const discount = useCartDiscount()
  const total = useCartTotal()

  const {
    items,
    cartId,
    appliedDiscounts,
  } = useCart(useShallow(state => state))

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const discounts = appliedDiscounts.reduce((prev, discount) => prev + discount.amount, 0)

  const startCheckout = useCallback(async () => {
    if (items.length === 0) return

    setIsLoading(true)
    setError(null)

    try {
      const lineItems = items.map((item) => ({
        name: item.name,
        type: item.type,
        priceInCents: Math.round(getItemPrice(item) * 100),
        quantity: isProductItem(item) ? item.quantity : 1,
      }))

      await createCheckoutSession({
        cartId: cartId,
        items,
        discounts: appliedDiscounts,
      })
    } catch (err) {
      setError("Failed to initialize checkout. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }, [items, discount])
  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <ShoppingCart className="!w-[16px] !h-[16px] mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">Add some items to your cart before checking out.</p>
          <div className="flex gap-4 justify-center">
            <Button asChild variant="outline">
              <Link href="/">Mixing</Link>
            </Button>
            <Button asChild>
              <Link href="/mastering">Mastering</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="w-full">
      {/* Order Summary - Left Side */}
      <div className="lg:col-span-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 align-bottom px-4">
              <ShoppingCart className="!w-[16px] !h-[16px]" />
              Order Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Customer Info */}
            <div className="text-sm px-4">
              <p className="font-medium">{userName}</p>
              <p className="text-muted-foreground">{userEmail}</p>
            </div>

            <Separator />

            {/* Line Items */}
            <div className="space-y-3 px-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {isProductItem(item) && item.quantity > 1 && (
                      <p className="text-muted-foreground">Qty: {item.quantity}</p>
                    )}
                  </div>
                  <p className="font-medium">${getItemPrice(item).toFixed(2)}</p>
                </div>
              ))}
            </div>
            {appliedDiscounts.length > 0 && (
            <div className="px-4 py-3 bg-green-50 dark:bg-green-950/30 border-b border-border">
                <div className="flex items-center gap-2 mb-2">
                <Tag className="!w-[16px] !h-[16px] text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Discounts Applied</span>
                </div>
                <div className="space-y-1">
                {appliedDiscounts.map((discount) => (
                    <div key={discount.id} className="flex flex-col gap-1 text-sm">
                    <span className="flex justify-between">
                        <span className="flex lg:flex-row flex-col lg:items-center text-green-600 dark:text-green-400 lg:gap-1 gap-[0.5px]">
                            <span className="py-[1px] align-middle">{discount.name}</span>
                            {discount.count > 0 && (
                                <span>
                                    <span>({discount.percentage}%)</span>
                                    <span className="ml-1.5 px-[5px] py-[1px] text-xs bg-green-200 dark:bg-green-800 rounded-full align-middle">
                                        x{discount.count}
                                    </span>
                                </span>
                            )}
                        </span>
                        <span className="text-green-600 dark:text-green-400 font-medium py-[1px] align-middle">
                        -{formatCurrency(discount.amount)}
                        </span>
                    </span>
                    <span className="text-green-600/50 dark:text-green-400/50 text-xs w-[75%]">{discount.description}</span>
                    </div>
                ))}
                </div>
            </div>
            )}

            {/* Totals */}
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
            </div>

            {discounts > 0 && (
                <div className="flex justify-between text-sm">
                <span className="text-green-600">Discounts ({discounts}%)</span>
                <span className="text-green-600">-{formatCurrency(discount)}</span>
                </div>
            )}

              {appliedDiscounts.map((d) => (
                <div key={d.id} className="flex justify-between text-green-600">
                  <span>
                    {d.name}
                    {d.count > 1 && ` (x${d.count})`}
                  </span>
                  <span>-${d.amount.toFixed(2)}</span>
                </div>
              ))}

              <Separator />

              <div className="flex justify-between font-bold text-base">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            {error && <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-4">{error}</div>}

            <div className="text-center py-2 flex flex-col border-t items-center justify-center">

                <CardHeader>
                    <CardTitle>Payment</CardTitle>
                </CardHeader>
                <p className="text-muted-foreground mb-6 w-3/4">
                    Click below to proceed to secure payment. We accept credit cards, PayPal, Apple Pay, Google Pay, Link,
                    and Klarna.
                </p>
                <div className="flex flex-col items-center gap-4">
                    <Button onClick={startCheckout} disabled={isLoading} size="lg" className="align-middle flex gap-1 border border-black dark:border-white hover:border-green-500 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30">
                    {
                    isLoading ? "Loading..."
                    : 
                    <>
                        <WalletCards  className="!w-[16px] !h-[16px]"/>
                        <span>Proceed to Payment</span>
                    </>
                    }
                    </Button>

                    <Button size="lg" variant="ghost" asChild className="flex gap-1 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black">
                        <Link href="/">
                            <ArrowLeft className="!w-[16px] !h-[16px]" />
                            Continue Shopping
                        </Link>
                    </Button>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
