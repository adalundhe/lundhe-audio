import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { productOptions, products } from "~/server/db/schema";

const productTypeValues = [
  "mixing",
  "mastering",
  "mixing-and-mastering",
] as const;

const optionCategoryValues = [
  "addon",
  "delivery",
  "track_fee",
  "length_fee",
] as const;

const optionPriceTypeValues = [
  "flat",
  "per_ten_tracks",
  "multiplier",
  "per_hour",
] as const;

const productInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  price: z.number().min(0),
  productType: z.enum(productTypeValues),
});

const optionInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1),
  description: z.string().trim().nullable(),
  price: z.number().min(0),
  category: z.enum(optionCategoryValues),
  priceType: z.enum(optionPriceTypeValues),
  productType: z.enum(productTypeValues),
  perCount: z.number().int().min(0),
  minThreshold: z.number().int().nullable(),
  maxThreshold: z.number().int().nullable(),
});

export const adminProductsRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const [productRows, optionRows] = await Promise.all([
      ctx.db.select().from(products).orderBy(asc(products.name)),
      ctx.db
        .select()
        .from(productOptions)
        .orderBy(asc(productOptions.category), asc(productOptions.name)),
    ]);
    return { products: productRows, options: optionRows };
  }),

  upsertProduct: adminProcedure
    .input(productInputSchema)
    .mutation(async ({ ctx, input }) => {
      const id = input.id ?? crypto.randomUUID();
      const now = new Date().toString();

      const result = await ctx.db
        .insert(products)
        .values({
          id,
          name: input.name,
          description: input.description ?? null,
          price: input.price,
          productType: input.productType,
          created_timestamp: now,
        })
        .onConflictDoUpdate({
          target: products.id,
          set: {
            name: input.name,
            description: input.description ?? null,
            price: input.price,
            productType: input.productType,
            updated_timestamp: now,
          },
        })
        .returning()
        .get();

      return result;
    }),

  deleteProduct: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(products)
        .where(eq(products.id, input.id))
        .returning()
        .get();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Product not found.",
        });
      }
      return { id: deleted.id };
    }),

  upsertOption: adminProcedure
    .input(optionInputSchema)
    .mutation(async ({ ctx, input }) => {
      const id = input.id ?? crypto.randomUUID();
      const now = new Date().toString();

      const values = {
        id,
        name: input.name,
        description: input.description ?? null,
        price: input.price,
        category: input.category,
        priceType: input.priceType,
        productType: input.productType,
        perCount: input.perCount,
        minThreshold: input.minThreshold,
        maxThreshold: input.maxThreshold,
        created_timestamp: now,
      };

      const result = await ctx.db
        .insert(productOptions)
        .values(values)
        .onConflictDoUpdate({
          target: productOptions.id,
          set: {
            name: input.name,
            description: input.description ?? null,
            price: input.price,
            category: input.category,
            priceType: input.priceType,
            productType: input.productType,
            perCount: input.perCount,
            minThreshold: input.minThreshold,
            maxThreshold: input.maxThreshold,
            updated_timestamp: now,
          },
        })
        .returning()
        .get();

      return result;
    }),

  deleteOption: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(productOptions)
        .where(eq(productOptions.id, input.id))
        .returning()
        .get();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Option not found.",
        });
      }
      return { id: deleted.id };
    }),
});
