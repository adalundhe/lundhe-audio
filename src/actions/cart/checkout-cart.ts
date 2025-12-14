"use server"

import { env } from "~/env"
import Stripe from 'stripe'
import { CartItem, isQuoteItem } from "~/lib/stores/shopping-cart"
import { UserResource } from "@clerk/types"
import { redirect } from "next/navigation"


export const checkout = async ({
    cartId,
    items,
    user,
}: {
    cartId: string,
    user: Pick<UserResource, "id" >,
    items: CartItem[]
}) => {
    const stripe = new Stripe(env.NODE_ENV === 'development' ? env.STRIPE_SANDBOX_SECRET_KEY ?? env.STRIPE_SECRET_KEY : env.STRIPE_SECRET_KEY as string, { apiVersion: '2025-11-17.clover'})

    try {
      const origin = env.LUNDHE_AUDIO_DOMAIN

      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'link'],
        line_items: items.map(item => ({
            price_data: {   
                product_data: {
                    name: item.name,
                    metadata: {
                        cartItemId: item.id,
                        cartId: cartId,
                    },
                },
                unit_amount: item.price,
                currency: 'usd'
            },
            quantity: isQuoteItem(item) ? 1 : item.quantity,
        })),
        success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
    })

    // TODO: Add subscriptions if and when they become relevant.
    // const session = await stripe.checkout.sessions.create({
    //     mode: 'subscription',
    //     payment_method_types: ['card', 'link'],
    //     line_items: [
    //       {
    //         price: process.env.STRIPE_PRICE_ID as string,
    //         quantity: 1 // Nr of subscriptions/“seats”
    //       }
    //     ],
    //     success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
    //     cancel_url: `${origin}/cancel`
    //   })

      session.url ? await redirect(session.url) : await redirect("/checkout/error")

      
    } catch (err) {
        return err as Error
    }

}