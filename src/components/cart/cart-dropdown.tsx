"use client"

import { useState, useEffect } from "react"
import { ShoppingCart, X, Trash2, Plus, Minus, Tag } from "lucide-react"
import { Button } from "~/components/ui/button"
import {
  isQuoteItem,
  isProductItem,
  type CartItem,
} from "~/lib/stores/shopping-cart"
import {
  useCartItems,
  useCartSubtotal,
  useCartDiscount,
  useCartDiscountPercentage,
  useCartTotal,
  useCartItemCount,
  useCartActions,
  useCartAppliedDiscounts,
} from '~/hooks/use-shopping-cart'

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

function CartItemRow({ item }: { item: CartItem }) {
  const { removeItem, updateQuantity } = useCartActions()

  const itemTotal = isQuoteItem(item) ? item.quote.costs.total : item.price * item.quantity

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border last:border-b-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground capitalize">{item.type}</span>
          <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
        </div>

        {isProductItem(item) && (
          <div className="flex items-center gap-2 mt-2">
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 bg-transparent"
              onClick={() => updateQuantity(item.id, item.quantity - 1)}
            >
              <Minus className="!w-[16px] !h-[16px]" />
            </Button>
            <span className="text-sm w-6 text-center">{item.quantity}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-6 w-6 bg-transparent"
              onClick={() => updateQuantity(item.id, item.quantity + 1)}
            >
              <Plus className="!w-[16px] !h-[16px]" />
            </Button>
            <span className="text-xs text-muted-foreground">@ {formatCurrency(item.price)} each</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-medium">{formatCurrency(itemTotal)}</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          onClick={() => removeItem(item.id)}
        >
          <Trash2 className="!w-[16px] !h-[16px]" />
        </Button>
      </div>
    </div>
  )
}

function CartContent({ onClose }: { onClose: () => void }) {
  const items = useCartItems()
  const subtotal = useCartSubtotal()
  const discount = useCartDiscount()
  const discountPercentage = useCartDiscountPercentage()
  const appliedDiscounts = useCartAppliedDiscounts()
  const total = useCartTotal()
  const { clearCart } = useCartActions()

  if (items.length === 0) {
    return (
      <div className="p-6 text-center relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="!w-[16px] mixing!h-[16px]" />
        </Button>
        <ShoppingCart className="!w-[16px] !h-[16px] mx-auto text-muted-foreground/50 mb-3 dark:text-white" />
        <p className="text-sm text-muted-foreground dark:text-white">Your cart is empty</p>
        <p className="text-xs text-muted-foreground/70 mt-1 dark:text-white">Add a mixing or mastering quote to get started</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h2 className="font-semibold">Shopping Cart</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="!w-[16px] !h-[16px]" />
        </Button>
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto p-4 border-b border-border">
        {items.map((item) => (
          <CartItemRow key={item.id} item={item} />
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
              <div key={discount.id} className="flex justify-between text-sm">
                <span className="text-green-600 dark:text-green-400">
                  {discount.name} ({discount.percentage}%)
                </span>
                <span className="text-green-600 dark:text-green-400 font-medium">
                  -{formatCurrency(discount.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Totals */}
      <div className="p-4 space-y-2 bg-muted/30">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>

        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600">Bundle Discount ({discountPercentage}%)</span>
            <span className="text-green-600">-{formatCurrency(discount)}</span>
          </div>
        )}

        <div className="flex justify-between font-semibold pt-2 border-t border-border">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>

        <div className="flex gap-2 pt-2">
          <Button size="sm" className="flex-1 text-red-600 hover:bg-red-600/30 border border-red-600" onClick={clearCart}>
            Clear Cart
          </Button>
          <Button size="sm" className="flex-1 border border-black dark:border-white dark:hover:bg-white dark:hover:text-black">
            Checkout
          </Button>
        </div>
      </div>
    </div>
  )
}

export function CartDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const itemCount = useCartItemCount()

  // Dropdown uses responsive Tailwind classes instead of isMobile state
  return (
    <div className="relative">
      {/* Cart Button */}
      <Button
        variant="ghost"
        size="icon"
        className="relative rounded-sm hover:text-white hover:bg-black dark:hover:text-black dark:hover:bg-white data-[state=open]:bg-black data-[state=open]:dark:bg-white data-[state=open]:text-white data-[state=open]:dark:text-black transition-colors"
        data-state={isOpen ? "open" : "closed"}
        onClick={() => setIsOpen(!isOpen)}
      >
        <ShoppingCart className="!w-[16px] !h-[16px]" />
        {itemCount > 0 && (
          <span className="absolute -top-[4px] -right-[4px] !w-[16px] !h-[16px] rounded-full bg-primary border border-white dark:border-black text-[10px] font-medium text-primary-foreground flex items-center justify-center">
            {itemCount > 9 ? "9+" : itemCount}
          </span>
        )}
      </Button>

      {/* Backdrop */}
      {isOpen && <div className="fixed inset-0 z-40 bg-black/50 lg:bg-transparent" onClick={() => setIsOpen(false)} />}

      {/* Dropdown */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-background flex flex-col lg:absolute lg:inset-auto lg:right-0 lg:top-full lg:mt-2 lg:w-96 lg:border lg:border-border lg:rounded-lg lg:shadow-lg lg:overflow-hidden lg:max-h-[80vh] dark:border-white">
          <CartContent onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}