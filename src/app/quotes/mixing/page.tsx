import { MixingQuoteProvider } from "~/components/quotes/calculator/mixing-quote-provider"
import { StudioCalculator } from "~/components/quotes/studio-calculator"
import { api } from "~/lib/server-client"

export default async function Home() {

  const client = await api()
  const pricingData = await client.mixQuotes.getAllMixingPricingData()

  return (
    <MixingQuoteProvider pricingData={pricingData} >
      <StudioCalculator />
    </MixingQuoteProvider>
  )
}
