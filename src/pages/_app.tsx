import { type Session } from "next-auth";
import Head from "next/head";
// import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { Courier_Prime } from 'next/font/google';
import Script from 'next/script';
import { Footer } from "~/components/Footer";
import { NavBar } from "~/components/NavBar";
import { SettingsProvider } from "~/components/ui/settings-provider";
import { env } from "~/env";
import { api } from "~/utils/api";
import { type Mode } from '~/components/ui/settings-provider';

import {ScrollToTop} from '~/components/ui/scroll-to-top'
// import {ShopifyProvider} from '@shopify/hydrogen-react';
// import {CartProvider, useCart} from '@shopify/hydrogen-react';
// import { type CountryCode, type LanguageCode } from "@shopify/hydrogen-react/storefront-api-types";

import "~/styles/globals.css";
import { useSettings } from "~/hooks/use-settings";
import { useEffect } from "react";

const courierPrime = Courier_Prime({
  weight: "400",
  subsets: ['latin']
})

function initTheme() {

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");


    let mode = localStorage.getItem('ui-mode') ?? 'system'
    if (mode === 'system') {
        mode = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light"
    }


    return mode as Mode
}

const MyApp: AppType<{ _: Session | null }> = ({
  Component,
  pageProps: { _, ...pageProps },
}) => {


  const {mode, updateMode} = useSettings()
  
  useEffect(() => {

      if (mode === 'system') {
          updateMode(initTheme())
      }

  }, [mode, updateMode])

  return (
    <>

      <SettingsProvider />
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
            <title>Lündhé Audio</title>
            <meta name="description" content="Lündhé Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio studio." />
            <link rel="icon" href="/favicon.ico" />
            <script src="/theme.js" async/>
          </Head>
          <Script src={`https://www.google.com/recaptcha/api.js?render=${env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}`} async/>
          
          <NavBar />
          <div className={`${courierPrime.className} flex flex-col h-full`}>
            <Component {...pageProps} />
          </div>
          <Footer />
          <ScrollToTop minHeight={100} scrollTo={0}/>
        {/* </CartProvider>
      </ShopifyProvider> */}
    </>
  );
};

export default api.withTRPC(MyApp);
