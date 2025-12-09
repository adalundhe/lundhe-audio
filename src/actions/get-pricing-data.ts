"use server"

import { getAllPricingData } from "@/lib/db"
import type { PricingData } from "@/lib/pricing-types"

export async function getPricingData(): Promise<PricingData> {
  return getAllPricingData()
}
