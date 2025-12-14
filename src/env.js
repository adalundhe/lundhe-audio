import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";


export const env = createEnv({
  /**
   * Specify your server-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars.
   */
  server: {
    NODE_ENV: z
      .enum(["development", "test", "production"])
      .default("development"),
    POSTMARK_TOKEN: z.string(),
    LUNDHE_AUDIO_EMAIL: z.string(),
    GOOGLE_RECAPTCHA_SECRET_KEY: z.string(),
    TWILIO_CAMPAIGN_ID: z.string(),
    TWILIO_AUTH_TOKEN: z.string(),
    TWILIO_PHONE_NUMBER: z.string(),
    TURSO_SQLITE_DB_DATABASE_URL: z.string(),
    TURSO_SQLITE_DB_TOKEN: z.string(),
    CLERK_SECRET_KEY: z.string(),
    // NEXTAUTH_SECRET:
    //   process.env.NODE_ENV === "production"
    //     ? z.string()
    //     : z.string().optional(),
    // NEXTAUTH_URL: z.preprocess(
    //   // This makes Vercel deployments not fail if you don't set NEXTAUTH_URL
    //   // Since NextAuth.js automatically uses the VERCEL_URL if present.
    //   (str) => process.env.VERCEL_URL ?? str,
    //   // VERCEL_URL doesn't include `https` so it cant be validated as a URL
    //   process.env.VERCEL ? z.string() : z.string().url()
    // ),
  },

  /**
   * Specify your client-side environment variables schema here. This way you can ensure the app
   * isn't built with invalid env vars. To expose them to the client, prefix them with
   * `NEXT_PUBLIC_`.
   */
  client: {
    NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY: z.string(),
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string(),
    // NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: z.string(),
    // NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_ACCESS_TOKEN: z.string(),
    // NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_ISO_CODE: z.string(),
    // NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_LANGUAGE_ISO_CODE: z.string(),
    // NEXT_PUBLIC_SHOPIFY_APP_API_VERSION: z.string(),
  },

  /**
   * You can't destruct `process.env` as a regular object in the Next.js edge runtimes (e.g.
   * middlewares) or client-side so we need to destruct manually.
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    POSTMARK_TOKEN: process.env.POSTMARK_TOKEN,
    LUNDHE_AUDIO_EMAIL: process.env.LUNDHE_AUDIO_EMAIL,
    NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY: process.env.NEXT_PUBLIC_GOOGLE_RECAPTCHA_SITE_KEY,
    GOOGLE_RECAPTCHA_SECRET_KEY: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
    TWILIO_CAMPAIGN_ID: process.env.TWILIO_CAMPAIGN_ID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    TURSO_SQLITE_DB_TOKEN: process.env.TURSO_SQLITE_DB_TOKEN,
    TURSO_SQLITE_DB_DATABASE_URL: process.env.TURSO_SQLITE_DB_DATABASE_URL,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    // NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN: process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN,
    // NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_ACCESS_TOKEN: process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_API_ACCESS_TOKEN,
    // NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_ISO_CODE: process.env.NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_ISO_CODE,
    // NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_LANGUAGE_ISO_CODE: process.env.NEXT_PUBLIC_SHOPIFY_APP_COUNTRY_LANGUAGE_ISO_CODE,
    // NEXT_PUBLIC_SHOPIFY_APP_API_VERSION: process.env.NEXT_PUBLIC_SHOPIFY_APP_API_VERSION,
    // NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    // NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  /**
   * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially
   * useful for Docker builds.
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
  /**
   * Makes it so that empty strings are treated as undefined. `SOME_VAR: z.string()` and
   * `SOME_VAR=''` will throw an error.
   */
  emptyStringAsUndefined: true,
});
