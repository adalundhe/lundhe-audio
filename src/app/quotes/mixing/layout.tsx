import QuotesLoader from "./loading"
import { ReactNode, Suspense } from "react"


export default async function QuotesLayout({
    children
}: {
    children: ReactNode
}) {

    return (
        <main className="min-h-screen py-12 px-4">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-center mb-2">Mixing</h1>
            <p className="text-muted-foreground text-center mb-8">Calculate the cost of mixing your project</p>
            <Suspense fallback={<QuotesLoader />}>
              {children}
            </Suspense>
          </div>
        </main>

    )
}