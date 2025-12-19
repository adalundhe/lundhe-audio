"use client"

import { useEffect } from "react"
import { useCart } from "~/hooks/use-shopping-cart"
import { removeOrCreateCart } from "~/actions/cart/remove--or-create-cart"
import { useShallow } from "zustand/react/shallow"
import { useUser } from "@clerk/nextjs"
import Stripe from 'stripe'


export function ClearCartOnSuccess({
  status
}: {
  status: Stripe.Checkout.Session.Status
}) {

  if (status !== 'complete'){
    return null
  }

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
