"use server"

import { AppliedDiscount, CartItem, isQuoteItem, isProductItem } from "~/lib/stores/shopping-cart"
import { db } from "~/server/db/client"
import { cart, cartItems, cartDiscounts, CartItem as CartTableItem } from "~/server/db/schema"


export const createOrUpdateCart = async (data: {
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

    const insertItems = data.items.map(item => db.insert(cartItems).values({
            id: item.id,
            name: item.name,
            type: item.type,
            data: isQuoteItem(item) ? JSON.stringify(item.quote) : undefined,
            price: item.price,
            quantity: isProductItem(item) ? item.quantity : undefined,
            cartId: cartId,
        })
    )

    const insertDiscounts = data.appliedDiscounts.map(discount => db.insert(cartDiscounts).values({
        id: discount.id,
        name: discount.name,
        percentage: discount.percentage,
        amount: discount.amount,
        count: discount.count,
        description: discount.description,
        cartId: cartId,
    }))


    await Promise.all([
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
        }),
        ...insertItems,
        ...insertDiscounts,
        
    ]).catch(() => null)
    
}