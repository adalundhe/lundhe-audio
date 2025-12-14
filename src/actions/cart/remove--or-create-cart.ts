"use server"

import { AppliedDiscount, CartItem, isQuoteItem, isProductItem } from "~/lib/stores/shopping-cart"
import { db } from "~/server/db/client"
import { cart, cartItems, cartDiscounts, CartItem as CartTableItem } from "~/server/db/schema"
import { eq } from "drizzle-orm"


export const removeOrCreateCart = async (data: {
    cartId?: string,
    userId: string
    items: CartItem[],
    subtotal: number
    discount: number
    appliedDiscounts: AppliedDiscount[]
    total: number
}) => {
    const cartId = data.cartId ?? crypto.randomUUID()
    const created = new Date().toString()

    const deletedItems = data.items.map(item => db.delete(cartItems).where(eq(cartItems.id, item.id)))

    const deletedDiscounts = data.appliedDiscounts.map(discount => db.delete(cartDiscounts).where(eq(cartDiscounts.id, discount.id)))
    await Promise.all([
        ...deletedDiscounts,
        ...deletedItems,
        
    ]).catch(() => null)

    db.insert(cart).values({
        id: cartId,
        userId: data.userId,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        created_timestamp: created,
        updated_timestamp: created,
    }).onConflictDoUpdate({
        target: cart.userId,
        set: {
            subtotal: data.subtotal,
            discount: data.discount,
            total: data.total,
        }
    })

    
}