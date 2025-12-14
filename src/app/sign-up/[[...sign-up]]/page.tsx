"use client"

import * as React from "react"
import { useSignUp } from "@clerk/nextjs"
import type { OAuthStrategy } from "@clerk/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card"
import { Button } from "~/components/ui/button"
import { Layout } from "~/components/Layout";
import { ScaleLoader } from "~/components/ui/scale-loader"
import Link from "next/link"

export default function SignUpPage() {
  const { signUp, isLoaded } = useSignUp()
  const [isLoading, setIsLoading] = React.useState<OAuthStrategy | null>(null)

  const signUpWith = async (strategy: OAuthStrategy) => {
    if (!signUp) return

    setIsLoading(strategy)
    try {
      await signUp.authenticateWithRedirect({
        strategy,
        redirectUrl: "/sign-up/sso-callback",
        redirectUrlComplete: "/",
      })
    } catch (err) {
      console.error("OAuth error:", err)
      setIsLoading(null)
    }
  }

  const providers: { strategy: OAuthStrategy; name: string; icon: React.ReactNode }[] = [
    {
      strategy: "oauth_google",
      name: "Google",
      icon: (
        <svg className="!h-[16px] !w-[16px]" viewBox="0 0 24 24">
          <path
            fill="currentColor"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="currentColor"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="currentColor"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
          />
          <path
            fill="currentColor"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
          />
        </svg>
      ),
    },
    {
      strategy: "oauth_facebook",
      name: "Facebook",
      icon: (
        <svg className="!h-[16px] !w-[16px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      strategy: "oauth_discord",
      name: "Discord",
      icon: (
        <svg className="!h-[16px] !w-[16px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      ),
    },
    {
      strategy: "oauth_apple",
      name: "Apple",
      icon: (
        <svg className="!w-[16px] !h-[16px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.559-1.701" />
        </svg>
      ),
    },
    {
      strategy: "oauth_twitch",
      name: "Twitch",
      icon: (
        <svg className="!w-[16px] !h-[16px]" viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z" />
        </svg>
      ),
    },
  ]

  return (
    <Layout>
      <Card className="w-full md:w-3/4 h-full rounded-none border-none shadow-none flex flex-col items-center justify-center">
        {
          isLoaded
          ?
        <div className="flex flex-col items-center justify-center border rounded-sm mt-8 mb-4 h-[500px]">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Create an Account</CardTitle>
            <CardDescription>Sign up to access Lündhé Audio</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {providers.map((provider) => (
                <Button
                  key={provider.strategy}
                  className="w-full h-11 gap-3 bg-transparent border rounded-sm border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                  onClick={() => signUpWith(provider.strategy)}
                  disabled={isLoading !== null}
                >
                  {isLoading === provider.strategy ? (
                    <div className="!w-[16px] !h-[16px] animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    provider.icon
                  )}
                  <span>Continue with {provider.name}</span>
                </Button>
              ))}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link href="/sign-in" className="text-primary hover:underline">
                Sign in
              </Link>
            </p>
            <p className="text-center text-sm text-muted-foreground">
                By continuing, you agree to our 
                <Link className="text-white hover:text-cyan-500 hover:underline mx-2" href={"/legal/terms-of-service"}>Terms of Service</Link> 
                and
                <Link className="text-white hover:text-cyan-500 hover:underline ml-2" href={"/legal/privacy"}>Privacy Policy</Link>.
            </p>
          </CardContent>
        </div>
        :
        <div className="flex flex-col w-full h-[500px] items-center justify-center mt-8 mb-4">
          <ScaleLoader/>
        </div>
      }
      {/* Clerk's CAPTCHA widget */}
    <div id="clerk-captcha" />
    </Card>
  </Layout>
  )
}
