import { createTRPCRouter, publicProcedure } from "../trpc"
import { db } from "~/server/db/client"
import { products, productOptions, discounts } from "~/server/db/schema"
import { eq } from "drizzle-orm"

export const mixQuotesRouter = createTRPCRouter({
  // Product queries

  // Get all pricing data in a single call for initial load
  getAllMixingPricingData: publicProcedure.query(async () => {
    const [productsData, optionsData, discountsData] = await Promise.all([
      db.select().from(products).where(eq(products.productType, "mixing")),
      db.select().from(productOptions).where(eq(productOptions.productType, "mixing")),
      db.select().from(discounts).where(eq(discounts.productType, "mixing")),
    ])

    return {
      products: productsData,
      options: optionsData,
      discounts: discountsData,
    }
  }),
  getAllMasteringPricingData: publicProcedure.query(async () => {
    const [productsData, optionsData, discountsData] = await Promise.all([
      db.select().from(products).where(eq(products.productType, "mastering")),
      db.select().from(productOptions).where(eq(productOptions.productType, "mastering")),
      db.select().from(discounts).where(eq(discounts.productType, "mastering")),
    ])

    return {
      products: productsData,
      options: optionsData,
      discounts: discountsData,
    }
  }),
})
