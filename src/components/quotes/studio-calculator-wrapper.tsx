"use server"
import { StudioCalculator } from "~/components/quotes/studio-calculator"
import { api } from "~/lib/server-client"

export async function StudioCalculatorWrapper() {
  const client = await api()
  const pricingData = await client.mixQuotes.getAllPricingData()

  return <StudioCalculator pricingData={pricingData} />
}