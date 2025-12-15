import "server-only"

import Stripe from "stripe"
import { env } from "~/env"

export const stripe = new Stripe(env.NODE_ENV === 'development' ? env.STRIPE_SANDBOX_SECRET_KEY ?? env.STRIPE_SECRET_KEY : env.STRIPE_SECRET_KEY as string)
