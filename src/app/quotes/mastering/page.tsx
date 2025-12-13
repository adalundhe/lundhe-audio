import { MasteringCalculator } from "~/components/quotes/mastering-calculator"
import { api } from "~/lib/server-client"
import { MasteringQuoteProvider } from "~/components/quotes/mastering-calculator/mastering-quote-provider"

export default async function Home() {

  const client = await api()
  const pricingData = await client.mixQuotes.getAllMasteringPricingData()

  return (
    <MasteringQuoteProvider pricingData={pricingData}>
      <MasteringCalculator />
    </MasteringQuoteProvider>
  )
}
