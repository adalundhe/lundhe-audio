"use server"

import { AppliedDiscount, CartItem, isQuoteItem, isProductItem } from "~/lib/stores/shopping-cart"
import { db } from "~/server/db/client"
import { cart, cartItems, cartDiscounts } from "~/server/db/schema"
import { eq } from "drizzle-orm"

type CartSnapshotInput = {
    cartId?: string,
    userId: string
    items: CartItem[],
    subtotal: number
    discount: number
    appliedDiscounts: AppliedDiscount[]
    total: number
}

const writeCartSnapshot = async (data: CartSnapshotInput) => {
    const existingCart = (await db.select().from(cart).where(eq(cart.userId, data.userId)).limit(1)).at(0)
    const persistedCartId = existingCart?.id ?? data.cartId ?? crypto.randomUUID()
    const now = new Date().toString()

    await db.insert(cart).values({
        id: persistedCartId,
        userId: data.userId,
        subtotal: data.subtotal,
        discount: data.discount,
        total: data.total,
        created_timestamp: existingCart?.created_timestamp ?? now,
        updated_timestamp: now,
    }).onConflictDoUpdate({
        target: cart.userId,
        set: {
            subtotal: data.subtotal,
            discount: data.discount,
            total: data.total,
            updated_timestamp: now,
        }
    })

    await db.delete(cartItems).where(eq(cartItems.cartId, persistedCartId))
    await db.delete(cartDiscounts).where(eq(cartDiscounts.cartId, persistedCartId))

    if (data.items.length > 0) {
        await Promise.all(
            data.items.map(item => db.insert(cartItems).values({
                id: item.id,
                name: item.name,
                type: item.type,
                data: isQuoteItem(item) ? JSON.stringify(item.quote) : undefined,
                price: item.price,
                quantity: isProductItem(item) ? item.quantity : undefined,
                cartId: persistedCartId,
                created_timestamp: new Date(item.addedAt).toString(),
                updated_timestamp: now,
            }))
        )
    }

    if (data.appliedDiscounts.length > 0) {
        await Promise.all(
            data.appliedDiscounts.map(discount => db.insert(cartDiscounts).values({
                id: discount.id,
                name: discount.name,
                percentage: discount.percentage,
                amount: discount.amount,
                count: discount.count,
                description: discount.description,
                items: JSON.stringify(discount.items),
                cartId: persistedCartId,
                created_timestamp: new Date(discount.addedAt).toString(),
                updated_timestamp: now,
            }))
        )
    }

    return { cartId: persistedCartId }
}

export const createOrUpdateCart = async (data: CartSnapshotInput) => {
    await writeCartSnapshot(data).catch(() => null)
}

export const persistCartSnapshot = writeCartSnapshot
