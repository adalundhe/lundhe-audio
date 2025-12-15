import { auth, currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { CheckoutClient } from "~/components/checkout/checkout-client"

export default async function CheckoutPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  const user = await currentUser()

  return (
    <main className="min-h-screen bg-background py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Checkout</h1>
        <CheckoutClient
          userName={user?.firstName || user?.username || "Customer"}
          userEmail={user?.emailAddresses[0]?.emailAddress || ""}
          userId={userId}
        />
      </div>
    </main>
  )
}
