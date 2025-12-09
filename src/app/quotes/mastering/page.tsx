import { MasteringCalculator } from "~/components/quotes/mastering-calculator"
import { api } from "~/lib/server-client"

export default async function Home() {

  const client = await api()
  const pricingData = await client.mixQuotes.getAllMasteringPricingData()

  return (
    <MasteringCalculator pricingData={pricingData} />
  )
}
