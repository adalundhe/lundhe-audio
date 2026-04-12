import { TRPCError } from "@trpc/server";
import { asc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env.js";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { equipmentItem } from "~/server/db/schema";

const normalizeCurrency = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(2));
};

const normalizeQuantity = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Math.trunc(parsed);
};

const normalizeGearRecord = <
  T extends { price: unknown; quantity: unknown },
>(
  record: T,
): Omit<T, "price" | "quantity"> & { price: number; quantity: number } => ({
  ...record,
  price: normalizeCurrency(record.price),
  quantity: normalizeQuantity(record.quantity),
});

const reverbPriceGuideResponseSchema = z.object({
  price_guides: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      model: z.string().optional().nullable(),
      year: z.string().optional().nullable(),
      categories: z
        .array(
          z.object({
            full_name: z.string(),
          }),
        )
        .default([]),
      estimated_value: z
        .object({
          price_high: z
            .object({
              amount: z.string(),
            })
            .optional()
            .nullable(),
        })
        .optional()
        .nullable(),
    }),
  ),
});

const reverbListingsResponseSchema = z.object({
  listings: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      model: z.string().optional().nullable(),
      year: z.string().optional().nullable(),
      condition: z
        .object({
          display_name: z.string(),
        })
        .optional()
        .nullable(),
      categories: z
        .array(
          z.object({
            full_name: z.string(),
          }),
        )
        .default([]),
      price: z
        .object({
          amount: z.string(),
        })
        .optional()
        .nullable(),
    }),
  ),
});

const normalizePriceGuideMatch = (
  guide: z.infer<typeof reverbPriceGuideResponseSchema>["price_guides"][number],
) => ({
  id: `price-guide:${guide.id}`,
  title: guide.title.trim(),
  model: guide.model?.trim() || "—",
  year: guide.year?.trim() || "—",
  condition: "—",
  categories:
    guide.categories
      .map((category) => category.full_name.trim())
      .filter(Boolean)
      .join(", ") || "—",
  source: "Price Guide" as const,
  priceValue: guide.estimated_value?.price_high?.amount
    ? normalizeCurrency(guide.estimated_value.price_high.amount)
    : null,
});

const normalizeListingMatch = (
  listing: z.infer<typeof reverbListingsResponseSchema>["listings"][number],
) => ({
  id: `listing:${listing.id}`,
  title: listing.title.trim(),
  model: listing.model?.trim() || "—",
  year: listing.year?.trim() || "—",
  condition: listing.condition?.display_name?.trim() || "—",
  categories:
    listing.categories
      .map((category) => category.full_name.trim())
      .filter(Boolean)
      .join(", ") || "—",
  source: "Listing" as const,
  priceValue: listing.price?.amount ? normalizeCurrency(listing.price.amount) : null,
});

const gearInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  type: z.string().trim().min(1, "Type is required"),
  group: z.string().trim().min(1, "Group is required"),
  price: z.number().min(0, "Price must be 0 or greater"),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  manufacturer: z.string().trim().min(1, "Manufacturer is required"),
});

const renameGearFacetSchema = z.object({
  field: z.enum(["type", "group"]),
  currentValue: z.string().trim().min(1, "Current value is required"),
  nextValue: z.string().trim().min(1, "New value is required"),
});

export const adminGearRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    const gear = await ctx.db
      .select()
      .from(equipmentItem)
      .orderBy(asc(equipmentItem.name));

    return gear.map(normalizeGearRecord);
  }),

  searchPriceGuide: adminProcedure
    .input(
      z.object({
        query: z.string().trim().min(1, "Search query is required."),
      }),
    )
    .mutation(async ({ input }) => {
      const url = new URL("https://api.reverb.com/api/priceguide");
      url.searchParams.set("query", input.query);
      url.searchParams.set("per_page", "24");
      const listingsUrl = new URL("https://api.reverb.com/api/listings");
      listingsUrl.searchParams.set("query", input.query);
      listingsUrl.searchParams.set("per_page", "24");

      const headers = {
        "Accept-Version": "3.0",
        Authorization: `Bearer ${env.REVERB_API_TOKEN}`,
      };

      const [priceGuideResponse, listingsResponse] = await Promise.all([
        fetch(url.toString(), {
          headers,
          cache: "no-store",
        }),
        fetch(listingsUrl.toString(), {
          headers,
          cache: "no-store",
        }),
      ]);

      if (!priceGuideResponse.ok || !listingsResponse.ok) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unable to fetch Reverb price data right now.",
        });
      }

      const [priceGuidePayload, listingsPayload] = await Promise.all([
        priceGuideResponse.json(),
        listingsResponse.json(),
      ]);

      const guides = reverbPriceGuideResponseSchema.parse(priceGuidePayload);
      const listings = reverbListingsResponseSchema.parse(listingsPayload);

      return [
        ...guides.price_guides.map(normalizePriceGuideMatch),
        ...listings.listings.map(normalizeListingMatch),
      ];
    }),

  upsert: adminProcedure
    .input(gearInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();
      const id = input.id ?? crypto.randomUUID();
      const price = normalizeCurrency(input.price);
      const quantity = normalizeQuantity(input.quantity);

      const values = {
        id,
        name: input.name,
        description: input.description,
        type: input.type,
        group: input.group,
        price,
        quantity,
        manufacturer: input.manufacturer,
        created_timestamp: now,
      };

      // Mirrors src/scripts/update-equipment.ts: insert, falling back to an
      // update if the id already exists. updated_timestamp is always refreshed.
      const result = await ctx.db
        .insert(equipmentItem)
        .values(values)
        .onConflictDoUpdate({
          target: equipmentItem.id,
          set: {
            name: input.name,
            description: input.description,
            type: input.type,
            group: input.group,
            price,
            quantity,
            manufacturer: input.manufacturer,
            updated_timestamp: now,
          },
        })
        .returning()
        .get();

      return normalizeGearRecord(result);
    }),

  delete: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const deleted = await ctx.db
        .delete(equipmentItem)
        .where(eq(equipmentItem.id, input.id))
        .returning()
        .get();

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gear item not found.",
        });
      }

      return { id: deleted.id };
    }),

  renameFacet: adminProcedure
    .input(renameGearFacetSchema)
    .mutation(async ({ ctx, input }) => {
      const nextValue = input.nextValue.trim();
      const normalizedCurrentValue = input.currentValue.trim().toLocaleLowerCase();
      const column =
        input.field === "type" ? equipmentItem.type : equipmentItem.group;
      const now = new Date().toString();

      const renamed = await ctx.db
        .update(equipmentItem)
        .set({
          [input.field]: nextValue,
          updated_timestamp: now,
        })
        .where(
          sql`lower(trim(${column})) = ${normalizedCurrentValue}`,
        )
        .returning();

      return {
        field: input.field,
        currentValue: input.currentValue.trim(),
        nextValue,
        updatedCount: renamed.length,
      };
    }),
});
