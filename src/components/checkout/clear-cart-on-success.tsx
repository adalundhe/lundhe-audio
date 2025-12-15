"use client"

import { useEffect } from "react"
import { useCart, useCartActions } from "~/hooks/use-shopping-cart"
import { removeOrCreateCart } from "~/actions/cart/remove--or-create-cart"
import { useShallow } from "zustand/react/shallow"
import { useUser } from "@clerk/nextjs"

export function ClearCartOnSuccess() {
  const { clearCart, items, ...cart } = useCart(useShallow(state => state))
  const {user, isSignedIn} = useUser()

  useEffect(() => {
    clearCart(async (_, totals)  => {
        if (user?.id && isSignedIn) {
            removeOrCreateCart({
                ...cart,
                userId: user.id,
                items,
                ...totals,
            })
        }
    })
  }, [clearCart])

  return null
}
