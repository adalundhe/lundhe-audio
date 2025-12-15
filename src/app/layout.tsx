// import { SessionProvider } from "next-auth/react";
import { Courier_Prime } from 'next/font/google';
import Script from 'next/script';
import { Footer } from "~/components/Footer";
import { NavBar } from "~/components/NavBar";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";
import { CartStoreProvider } from "~/components/cart/cart-provider"
import { ClerkProvider } from "@clerk/nextjs"

import {ScrollToTop} from '~/components/ui/scroll-to-top'
import { ThemeProvider } from 'next-themes'
import { auth, currentUser, type User } from '@clerk/nextjs/server'
import { db } from '~/server/db/client';
import { products, productOptions, discounts, cart, cartItems, cartDiscounts } from "~/server/db/schema"
import { eq, or } from "drizzle-orm"
import { AppliedDiscount, CartInitData, CartItem } from '~/lib/stores/shopping-cart';
import { TooltipProvider } from '~/components/ui/tooltip';
// import {ShopifyProvider} from '@shopify/hydrogen-react';
// import {CartProvider, useCart} from '@shopify/hydrogen-react';
// import { type CountryCode, type LanguageCode } from "@shopify/hydrogen-react/storefront-api-types";

import "~/styles/globals.css";
import { SessionAuthWithRedirect } from 'node_modules/@clerk/nextjs/dist/types/app-router/server/auth';
import { QuoteData } from '~/lib/mixing/pricing-types';
import { MasteringQuoteData } from '~/lib/mastering/pricing-types';

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})


const fetchCart = async (user: User | null, authorized?: SessionAuthWithRedirect) => {
  if (!authorized || user === null || authorized.userId !== user.id || authorized.sessionId === null) return

  try {
    const cartData = (await db.select().from(cart).where(eq(cart.userId, user.id)).limit(1)).at(0)

    if (!cartData) {

      const createdCart = await await db.insert(cart).values({
        id: crypto.randomUUID(),
        userId: user.id,
        subtotal: 0,
        discount: 0,
        total: 0,
      }).returning().get()
      
      return {
        items: [],
        appliedDiscounts: [],
        total: createdCart.total,
        subtotal: createdCart.subtotal,
        userId: createdCart.userId,
        cartId: createdCart.id,
        discount: createdCart.discount,
      } as CartInitData
    }

    const [cartItemsData, cartDiscountsData] = await Promise.all([
      db.select().from(cartItems).where(eq(cartItems.id, cartData.id)),
      db.select().from(cartDiscounts).where(eq(cartDiscounts.id, cartData.id))
    ])


    const items: CartItem[] = cartItemsData.map(item => (
      item.type === "mixing" || item.type === "mastering"
    ) ? ({
      quote: (
        item.data ? JSON.parse(item.data) : undefined
      ) as QuoteData | MasteringQuoteData,
      price: item.price,
      name: item.name,
      id: item.id,
      type: item.type,
      quantity: item.quantity,
      addedAt: new Date(item.created_timestamp).getTime(),
    }) : ({
      price: item.price,
      name: item.name,
      id: item.id,
      type: item.type,
      quantity: item.quantity,
      addedAt: new Date(item.created_timestamp).getTime(),
    })).filter(item => (item.type === "mixing" || item.type === "mastering") ? item.quote !== undefined : true)



    return {
      items,
      appliedDiscounts: cartDiscountsData.map(discount => ({
        id: discount.id,
        name: discount.name,
        percentage: discount.percentage,
        amount: discount.amount,
        count: discount.count,
        description: discount.description,
        addedAt: new Date(discount.created_timestamp).getTime(),
      })) as AppliedDiscount[],
      total: cartData.total,
      subtotal: cartData.subtotal,
      userId: cartData.userId,
      cartId: cartData.id,
      discount: cartData.discount,
    } satisfies CartInitData

  } catch (error) {
    return
  }

}


export default async function RootLayout ({
	children,
}: Readonly<{ children: React.ReactNode }>) {


  const authorized = await auth()
  const user = await currentUser()

  const [productsData, optionsData, discountsData, cartData] = await Promise.all([
    db.select().from(products).where(
      or(
        eq(products.productType, "mixing"),
        eq(products.productType, "mixing-and-mastering"),
      ),
    ),
    db.select().from(productOptions).where(
      or(
        eq(productOptions.productType, "mixing"),
        eq(productOptions.productType, "mixing-and-mastering"),
      ),
    ),
    db.select().from(discounts).where(
      or(
        eq(discounts.productType, "mixing"),
        eq(discounts.productType, "mixing-and-mastering"),
      ),
    ),
    fetchCart(user, authorized),
    
  ])


  return (
    <ClerkProvider>
      <html className={`${courierPrime.className}`} lang="en" suppressHydrationWarning>

          {/* <ShopifyProvider
              storeDomain={env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}
              storefrontToken={env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_ACCESS_TOKEN}
              storefrontApiVersion={env.NEXT_PUBLIC_SHOPIFY_APP_API_VERSION}
              countryIsoCode={env.NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_ISO_CODE as CountryCode}
              languageIsoCode={env.NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_LANGUAGE_ISO_CODE as LanguageCode}
          >
              <CartProvider
              
              > */}
          <Script src={`https://www.google.com/recaptcha/api.js?render=${env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}`} async/>
          <body>
                <ThemeProvider attribute="class">
                    <TooltipProvider>
                      <TRPCReactProvider>
                        <CartStoreProvider pricingData={{
                          products: productsData,
                          options: optionsData,
                          discounts: discountsData,
                        }} initData={cartData}>
                          <NavBar />
                          <div className={`flex flex-col h-full`}>
                                  {children}
                          </div>
                          <Footer />
                          <ScrollToTop minHeight={100} scrollTo={0}/>               
                        </CartStoreProvider>          
                      </TRPCReactProvider>
                    </TooltipProvider>
                </ThemeProvider>
              <div id="clerk-captcha" />
          </body>
          {/* </CartProvider>
        </ShopifyProvider> */}
      </html>
    </ClerkProvider>
  );
};