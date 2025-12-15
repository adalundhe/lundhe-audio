import { AuthenticateWithRedirectCallback } from "@clerk/nextjs"

export default function SSOCallbackPage() {
  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center p-4">
      <AuthenticateWithRedirectCallback continueSignUpUrl="/sign-in/continue" />
    </div>
  )
}
