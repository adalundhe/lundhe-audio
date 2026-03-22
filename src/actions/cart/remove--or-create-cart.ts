"use server"

import { AppliedDiscount, CartItem } from "~/lib/stores/shopping-cart"
import { persistCartSnapshot } from "~/actions/cart/create-or-update-cart"


export const removeOrCreateCart = async (data: {
    cartId?: string,
    userId: string
    items: CartItem[],
    subtotal: number
    discount: number
    appliedDiscounts: AppliedDiscount[]
    total: number
}) => {
    await persistCartSnapshot(data).catch(() => null)
}
