import { TRPCError } from "@trpc/server";
import { asc, eq } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { discounts } from "~/server/db/schema";

const productTypeValues = [
  "mixing",
  "mastering",
  "mixing-and-mastering",
] as const;

export const discountCategoryValues = [
  "volume",
  "option_volume",
  "production",
  "bundle",
  "delivery_bundle",
  "cart_bundle",
] as const;

const discountInputSchema = z
  .object({
    id: z.string().optional(),
    name: z.string().trim().min(1),
    description: z.string().trim().nullable(),
    discountPercentage: z
      .number()
      .min(0, "Discount must be non-negative")
      .max(100, "Discount cannot exceed 100%"),
    category: z.enum(discountCategoryValues),
    productType: z.enum(productTypeValues),
    minThreshold: z.number().int().nullable(),
    maxThreshold: z.number().int().nullable(),
  })
  .superRefine((value, ctx) => {
    if (
      value.minThreshold !== null &&
      value.maxThreshold !== null &&
      value.minThreshold > value.maxThreshold
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["maxThreshold"],
        message: "Max threshold must be greater than or equal to min threshold.",
      });
    }
  });

export const adminDiscountsRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    return ctx.db
      .select()
      .from(discounts)
      .orderBy(asc(discounts.category), asc(discounts.name));
  }),

  upsert: adminProcedure
    .input(discountInputSchema)
    .mutation(async ({ ctx, input }) => {
      const id = input.id ?? crypto.randomUUID();
      const now = new Date().toString();

      const values = {
        id,
        name: input.name,
        description: input.description ?? null,
        discountPercentage: input.discountPercentage,
        category: input.category,
        productType: input.productType,
        minThreshold: input.minThreshold,
        maxThreshold: input.maxThreshold,
        created_timestamp: now,
      };

      const result = await ctx.db
        .insert(discounts)
        .values(values)
        .onConflictDoUpdate({
          target: discounts.id,
          set: {
            name: input.name,
            description: input.description ?? null,
            discountPercentage: input.discountPercentage,
            category: input.category,
            productType: input.productType,
            minThreshold: input.minThreshold,
            maxThreshold: input.maxThreshold,
            updated_timestamp: now,
          },
        })
        .returning()
        .get();

      return result;
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(discounts)
        .where(eq(discounts.id, input.id))
        .returning()
        .get();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Discount not found.",
        });
      }
      return { id: deleted.id };
    }),
});
