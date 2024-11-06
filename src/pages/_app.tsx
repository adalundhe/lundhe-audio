import { GeistSans } from "geist/font/sans";
import Head from "next/head";
import { type Session } from "next-auth";
import { SessionProvider } from "next-auth/react";
import { type AppType } from "next/app";
import { NavBar } from "~/components/NavBar"
import { Footer } from "~/components/Footer"
import Script from 'next/script'
import { api } from "~/utils/api";
import { env } from "~/env"

import "~/styles/globals.css";

const MyApp: AppType<{ session: Session | null }> = ({
  Component,
  pageProps: { session, ...pageProps },
}) => {
  return (
    <SessionProvider session={session}>
      <Head>
        <title>Lundhe Audio</title>
        <meta name="description" content="Lundhe Audio, an Austin based post-tracking mixing, mastering, sound design, and commercial audio." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <Script src={`https://www.google.com/recaptcha/api.js?render=${env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY}`} async/>
      <NavBar />
      <div className={`${GeistSans.className} flex flex-col flex-1`}>
        <Component {...pageProps} />
      </div>
      <Footer />
    </SessionProvider>
  );
};

export default api.withTRPC(MyApp);
