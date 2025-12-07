// import { SessionProvider } from "next-auth/react";
import { Courier_Prime } from 'next/font/google';
import Script from 'next/script';
import { Footer } from "~/components/Footer";
import { NavBar } from "~/components/NavBar";
import { env } from "~/env";
import { TRPCReactProvider } from "~/trpc/react";

import {ScrollToTop} from '~/components/ui/scroll-to-top'
import { ThemeProvider } from 'next-themes'
// import {ShopifyProvider} from '@shopify/hydrogen-react';
// import {CartProvider, useCart} from '@shopify/hydrogen-react';
// import { type CountryCode, type LanguageCode } from "@shopify/hydrogen-react/storefront-api-types";

import "~/styles/globals.css";

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})


export default async function RootLayout ({
	children,
}: Readonly<{ children: React.ReactNode }>) {

  return (
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
                <TRPCReactProvider>          
                    <NavBar />
                    <div className={`flex flex-col h-full`}>
                            {children}
                    </div>
                    <Footer />
                    <ScrollToTop minHeight={100} scrollTo={0}/>
                </TRPCReactProvider>
            </ThemeProvider>
        </body>
        {/* </CartProvider>
      </ShopifyProvider> */}
    </html>
  );
};