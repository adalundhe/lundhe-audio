import { createTRPCRouter, publicProcedure } from "../trpc"
import { db } from "~/server/db/client"
import { products, productOptions, discounts } from "~/server/db/schema"
import { eq, or } from "drizzle-orm"

export const mixQuotesRouter = createTRPCRouter({
  // Product queries

  // Get all pricing data in a single call for initial load
  getAllMixingPricingData: publicProcedure.query(async () => {
    const [productsData, optionsData, discountsData] = await Promise.all([
      db.select().from(products).where(
        or(
          eq(products.productType, "mixing"),
          eq(products.productType, "mixing-and-mastering"),
        ),
      ),
      db.select().from(productOptions).where(
        or(
          eq(productOptions.productType, "mixing"),
          eq(productOptions.productType, "mixing-and-mastering"),
        ),
      ),
      db.select().from(discounts).where(
        or(
          eq(discounts.productType, "mixing"),
          eq(discounts.productType, "mixing-and-mastering"),
        ),
      ),
    ])

    return {
      products: productsData,
      options: optionsData,
      discounts: discountsData,
    }
  }),
  getAllMasteringPricingData: publicProcedure.query(async () => {
    const [productsData, optionsData, discountsData] = await Promise.all([
      db.select().from(products).where(
        or(
          eq(products.productType, "mastering"),
          eq(products.productType, "mixing-and-mastering"),
        ),
      ),
      db.select().from(productOptions).where(
        or(
          eq(productOptions.productType, "mastering"),
          eq(productOptions.productType, "mixing-and-mastering"),
        ),
      ),
      db.select().from(discounts).where(
        or(
          eq(discounts.productType, "mastering"),
          eq(discounts.productType, "mixing-and-mastering"),
        ),
      ),
    ])

    return {
      products: productsData,
      options: optionsData,
      discounts: discountsData,
    }
  }),
})
