"use server"

import { stripe } from "~/lib/checkout/stripe"
import { auth } from "@clerk/nextjs/server"
import { env } from "~/env"
import Stripe from 'stripe'
import { AppliedDiscount, CartItem, isQuoteItem } from "~/lib/stores/shopping-cart"
import { UserResource } from "@clerk/types"
import { redirect } from "next/navigation"



export async function createCheckoutSession({
    cartId,
    items,
    discounts,
}: {
    cartId?: string,
    items: CartItem[],
    discounts: AppliedDiscount[]
}) {
   const { userId } = await auth()

    if (!userId) {
       throw new Error("User must be authenticated to checkout")
   }

    if (!cartId) {
      throw new Error("Missing or invalid cart id")
    }

    const origin = env.LUNDHE_AUDIO_DOMAIN

    const pricedItems = items.map(item => {

      item.price = item.price * (1 - discounts.filter(
        discount => discount.items.find(
          (id) => id === item.id)
        ).reduce((prev, cur) => prev + cur.percentage, 0)/100
      )

      return item

    })
    

    const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        payment_method_types: ['card', 'link'],
        line_items: pricedItems.map(item => ({
            price_data: {   
                product_data: {
                    name: item.name,
                    metadata: {
                        cartItemId: item.id,
                        cartId: cartId,
                    },
                },
                unit_amount: Math.trunc(item.price * 100),
                currency: 'usd'
            },
            quantity: isQuoteItem(item) ? 1 : item.quantity,
        })),
        success_url: `${origin}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/checkout/cancel`,
        payment_intent_data: {
            setup_future_usage: 'off_session'
        },
    })
 
 

  session.url ? redirect(session.url) : redirect("/checkout/error")
}

export async function getCheckoutSession(sessionId: string) {
  const session = await stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["line_items"],
  })

  return {
    id: session.id,
    status: session.status,
    paymentStatus: session.payment_status,
    customerEmail: session.customer_details?.email,
    amountTotal: session.amount_total,
    lineItems: session.line_items?.data.map((item) => ({
      name: item.description,
      quantity: item.quantity,
      amountTotal: item.amount_total,
    })),
    redirect: session.status === 'complete' ?  session.success_url : session.status === 'expired' ? session.cancel_url : session.return_url
  }
}
