import { GeistSans } from "geist/font/sans";
import Head from "next/head";
import { type Session } from "next-auth";
// import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { NavBar } from "~/components/NavBar"
import { Footer } from "~/components/Footer"
import Script from 'next/script'
import { api } from "~/utils/api";
import { env } from "~/env"
import {ShopifyProvider} from '@shopify/hydrogen-react';
import {CartProvider, useCart} from '@shopify/hydrogen-react';
import { type CountryCode, type LanguageCode } from "@shopify/hydrogen-react/storefront-api-types";

import "~/styles/globals.css";

const MyApp: AppType<{ _: Session | null }> = ({
  Component,
  pageProps: { _, ...pageProps },
}) => {
  return (
    <>
      {/* <ShopifyProvider
        storeDomain={env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN}
        storefrontToken={env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_ACCESS_TOKEN}
        storefrontApiVersion={env.NEXT_PUBLIC_SHOPIFY_APP_API_VERSION}
        countryIsoCode={env.NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_ISO_CODE as CountryCode}
        languageIsoCode={env.NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_LANGUAGE_ISO_CODE as LanguageCode}
      >
        <CartProvider
          
        > */}
          <Head>
            <title>Lundhe Audio</title>
            <meta name="description" content="Lundhe Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio." />
            <link rel="icon" href="/favicon.ico" />
          </Head>
          <Script src={`https://www.google.com/recaptcha/api.js?render=${env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}`} async/>
          
          <NavBar />
          <div className={`${GeistSans.className} flex flex-col h-full`}>
            <Component {...pageProps} />
          </div>
          <Footer />
        {/* </CartProvider>
      </ShopifyProvider> */}
    </>
  );
};

export default api.withTRPC(MyApp);
