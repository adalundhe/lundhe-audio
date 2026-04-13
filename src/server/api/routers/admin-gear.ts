import { TRPCError } from "@trpc/server";
import { asc, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";

import { env } from "~/env.js";
import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import {
  gearMediaBucketName,
  inferGearMediaAssetType,
  prepareGearMediaMultipartUpload,
} from "~/server/gear-media-storage";
import {
  equipmentItem,
  equipmentItemMediaAsset,
  equipmentServiceLog,
  wishlistGearItem,
} from "~/server/db/schema";
import {
  abortMultipartUpload,
  completeMultipartUpload,
  deleteStoredObjectByUri,
  getStoredObjectUri,
} from "~/server/storage/s3";

const gearStatusSchema = z.enum(["active", "inactive", "out-of-order"]);
const wishlistStatusSchema = z.enum([
  "researching",
  "watching",
  "ready-to-buy",
]);
const gearMediaAssetTypeSchema = z.enum(["photo", "document"]);
type GearStatus = z.infer<typeof gearStatusSchema>;
type WishlistStatus = z.infer<typeof wishlistStatusSchema>;

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

const normalizeText = (value: unknown): string =>
  typeof value === "string" ? value.trim() : "";

const normalizeGearStatus = (value: unknown): GearStatus => {
  const parsed = gearStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "active";
};

const normalizeWishlistStatus = (value: unknown): WishlistStatus => {
  const parsed = wishlistStatusSchema.safeParse(value);
  return parsed.success ? parsed.data : "watching";
};

const normalizeGearMediaAssetType = (value: unknown) => {
  const parsed = gearMediaAssetTypeSchema.safeParse(value);
  return parsed.success ? parsed.data : "document";
};

const isMissingTableError = (error: unknown, tableName: string) =>
  error instanceof Error &&
  error.message.toLocaleLowerCase().includes(`no such table: ${tableName}`);

const isMissingEquipmentDetailSchemaError = (error: unknown) =>
  error instanceof Error &&
  /(no such table: equipment_service_log|no such table: equipment_item_media_asset|no such column: .*status|no such column: .*location|no such column: .*serial_number|no such column: .*acquired_from|no such column: .*purchase_date|no such column: .*purchase_source|no such column: .*reference_number|no such column: .*room|no such column: .*rack|no such column: .*shelf|no such column: .*slot|no such column: .*storage_case|no such column: .*notes)/i.test(
    error.message,
  );

const rethrowEquipmentDetailSchemaError = (error: unknown): never => {
  if (isMissingEquipmentDetailSchemaError(error)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "The gear detail/media schema has not been added to the database yet. Run `pnpm run db:add:gear-media`.",
    });
  }

  throw error;
};

const isMissingWishlistSchemaError = (error: unknown) =>
  error instanceof Error &&
  /(no such table: wishlist_gear_item|no such column: .*target_price|no such column: .*wishlist_gear_item.*status|no such column: .*wishlist_gear_item.*notes)/i.test(
    error.message,
  );

const rethrowWishlistSchemaError = (error: unknown): never => {
  if (isMissingWishlistSchemaError(error)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "The wishlist gear schema has not been added to the database yet. Run `pnpm run db:add:wishlist-gear`.",
    });
  }

  throw error;
};

const normalizeGearMediaAssetRecord = <
  T extends {
    id: unknown;
    equipmentItemId?: unknown;
    assetType: unknown;
    fileName: unknown;
    contentType: unknown;
    byteSize: unknown;
    storageUri: unknown;
    createdTimestamp?: unknown;
    updatedTimestamp?: unknown;
  },
>(
  record: T,
) => ({
  ...record,
  id: normalizeText(record.id),
  equipmentItemId: normalizeText(record.equipmentItemId),
  assetType: normalizeGearMediaAssetType(record.assetType),
  fileName: normalizeText(record.fileName),
  contentType: normalizeText(record.contentType),
  byteSize: normalizeQuantity(record.byteSize),
  storageUri: normalizeText(record.storageUri),
  createdTimestamp: normalizeText(record.createdTimestamp),
  updatedTimestamp: normalizeText(record.updatedTimestamp),
});

const normalizeGearRecord = <
  T extends {
    price: unknown;
    quantity: unknown;
    status?: unknown;
    location?: unknown;
    serialNumber?: unknown;
    acquiredFrom?: unknown;
    purchaseDate?: unknown;
    purchaseSource?: unknown;
    referenceNumber?: unknown;
    room?: unknown;
    rack?: unknown;
    shelf?: unknown;
    slot?: unknown;
    storageCase?: unknown;
    notes?: unknown;
    serviceLogs?: unknown;
    mediaAssets?: unknown;
  },
>(
  record: T,
): Omit<T, "price" | "quantity"> & {
  price: number;
  quantity: number;
  status: GearStatus;
  location: string;
  serialNumber: string;
  acquiredFrom: string;
  purchaseDate: string;
  purchaseSource: string;
  referenceNumber: string;
  room: string;
  rack: string;
  shelf: string;
  slot: string;
  storageCase: string;
  notes: string;
  serviceLogs: ReturnType<typeof normalizeServiceLogRecord>[];
  mediaAssets: ReturnType<typeof normalizeGearMediaAssetRecord>[];
} => ({
  ...record,
  price: normalizeCurrency(record.price),
  quantity: normalizeQuantity(record.quantity),
  status: normalizeGearStatus(record.status),
  location: normalizeText(record.location),
  serialNumber: normalizeText(record.serialNumber),
  acquiredFrom: normalizeText(record.acquiredFrom),
  purchaseDate: normalizeText(record.purchaseDate),
  purchaseSource: normalizeText(record.purchaseSource),
  referenceNumber: normalizeText(record.referenceNumber),
  room: normalizeText(record.room),
  rack: normalizeText(record.rack),
  shelf: normalizeText(record.shelf),
  slot: normalizeText(record.slot),
  storageCase: normalizeText(record.storageCase),
  notes: normalizeText(record.notes),
  serviceLogs: Array.isArray(record.serviceLogs)
    ? record.serviceLogs.map(normalizeServiceLogRecord)
    : [],
  mediaAssets: Array.isArray(record.mediaAssets)
    ? record.mediaAssets.map(normalizeGearMediaAssetRecord)
    : [],
});

const normalizeWishlistRecord = (
  record: typeof wishlistGearItem.$inferSelect,
) => ({
  ...record,
  targetPrice: normalizeCurrency(record.targetPrice),
  quantity: normalizeQuantity(record.quantity),
  status: normalizeWishlistStatus(record.status),
  notes: normalizeText(record.notes),
});

const normalizeServiceLogRecord = <
  T extends {
    id: unknown;
    equipmentItemId?: unknown;
    serviceType: unknown;
    serviceDate: unknown;
    warrantyUntil?: unknown;
    notes?: unknown;
    createdTimestamp?: unknown;
    updatedTimestamp?: unknown;
  },
>(
  record: T,
) => ({
  ...record,
  id: normalizeText(record.id),
  equipmentItemId: normalizeText(record.equipmentItemId),
  serviceType: normalizeText(record.serviceType),
  serviceDate: normalizeText(record.serviceDate),
  warrantyUntil: normalizeText(record.warrantyUntil),
  notes: normalizeText(record.notes),
  createdTimestamp: normalizeText(record.createdTimestamp),
  updatedTimestamp: normalizeText(record.updatedTimestamp),
});

const reverbPriceGuideResponseSchema = z.object({
  price_guides: z.array(
    z.object({
      id: z.number(),
      title: z.string(),
      make: z.string().optional().nullable(),
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
          release_date: z.string().optional().nullable(),
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
  _links: z
    .object({
      next: z
        .object({
          href: z.string(),
        })
        .optional(),
    })
    .optional(),
});

const reverbListingsResponseSchema = z.object({
  listings: z.array(
    z.object({
      id: z.number(),
      make: z.string().optional().nullable(),
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
      created_at: z.string().optional().nullable(),
    }),
  ),
  _links: z
    .object({
      next: z
        .object({
          href: z.string(),
        })
        .optional(),
    })
    .optional(),
});

const normalizePriceGuideMatch = (
  guide: z.infer<typeof reverbPriceGuideResponseSchema>["price_guides"][number],
) => ({
  id: `price-guide:${guide.id}`,
  title: guide.title.trim(),
  manufacturer: guide.make?.trim() || "—",
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
  manufacturer: listing.make?.trim() || "—",
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

const normalizeTimestamp = (value: string | null | undefined): number | null => {
  if (!value?.trim()) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const normalizePriceGuideHistoryPoint = (
  guide: z.infer<typeof reverbPriceGuideResponseSchema>["price_guides"][number],
  requestedTitle: string,
) => {
  const releaseDate = guide.estimated_value?.release_date?.trim() || null;
  const year = guide.year?.trim() || "—";
  const categories = guide.categories
    .map((category) => category.full_name.trim())
    .filter(Boolean);
  const occurredAtMs =
    normalizeTimestamp(releaseDate) ??
    (year !== "—" ? normalizeTimestamp(`${year}-01-01`) : null);

  return {
    id: `price-guide:${guide.id}`,
    source: "Price Guide" as const,
    requestedTitle,
    title: guide.title.trim() || requestedTitle,
    manufacturer: guide.make?.trim() || "—",
    model: guide.model?.trim() || "—",
    year,
    condition: "—",
    categories,
    priceValue: guide.estimated_value?.price_high?.amount
      ? normalizeCurrency(guide.estimated_value.price_high.amount)
      : null,
    occurredAtMs,
  };
};

const normalizeListingHistoryPoint = (
  listing: z.infer<typeof reverbListingsResponseSchema>["listings"][number],
  requestedTitle: string,
) => ({
  id: `listing:${listing.id}`,
  source: "Listing" as const,
  requestedTitle,
  title: listing.title.trim() || requestedTitle,
  manufacturer: listing.make?.trim() || "—",
  model: listing.model?.trim() || "—",
  year: listing.year?.trim() || "—",
  condition: listing.condition?.display_name?.trim() || "—",
  categories: listing.categories
    .map((category) => category.full_name.trim())
    .filter(Boolean),
  priceValue: listing.price?.amount ? normalizeCurrency(listing.price.amount) : null,
  occurredAtMs: normalizeTimestamp(listing.created_at),
});

const REVERB_MODEL_HISTORY_PAGE_LIMIT = 5;
const REVERB_MODEL_HISTORY_PER_PAGE = 50;

const fetchPaginatedReverbResults = async <
  TPayload extends { _links?: { next?: { href: string } } },
  TItem,
>(
  initialUrl: URL,
  headers: Record<string, string>,
  parse: (payload: unknown) => TPayload,
  extractItems: (payload: TPayload) => TItem[],
) => {
  const items: TItem[] = [];
  let nextUrl: string | null = initialUrl.toString();
  let pagesFetched = 0;

  while (nextUrl && pagesFetched < REVERB_MODEL_HISTORY_PAGE_LIMIT) {
    const response = await fetch(nextUrl, {
      headers,
      cache: "no-store",
    });

    if (!response.ok) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Unable to fetch Reverb model history right now.",
      });
    }

    const payload = parse(await response.json());
    items.push(...extractItems(payload));

    nextUrl = payload._links?.next?.href ?? null;
    pagesFetched += 1;
  }

  return items;
};

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

const wishlistGearInputSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().min(1, "Description is required"),
  type: z.string().trim().min(1, "Type is required"),
  group: z.string().trim().min(1, "Group is required"),
  targetPrice: z.number().min(0, "Target price must be 0 or greater"),
  quantity: z.number().int().min(0, "Quantity must be 0 or greater"),
  manufacturer: z.string().trim().min(1, "Manufacturer is required"),
});

const gearDetailsInputSchema = z.object({
  id: z.string().trim().min(1, "Gear item id is required"),
  status: gearStatusSchema.default("active"),
  location: z.string().optional(),
  serialNumber: z.string().optional(),
  acquiredFrom: z.string().optional(),
  purchaseDate: z.string().optional(),
  purchaseSource: z.string().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

const wishlistGearDetailsInputSchema = z.object({
  id: z.string().trim().min(1, "Wishlist item id is required"),
  status: wishlistStatusSchema.default("watching"),
  notes: z.string().optional(),
});

const wishlistStatusInputSchema = z.object({
  id: z.string().trim().min(1, "Wishlist item id is required"),
  status: wishlistStatusSchema.default("watching"),
});

const gearStatusInputSchema = z.object({
  id: z.string().trim().min(1, "Gear item id is required"),
  status: gearStatusSchema.default("active"),
});

const gearMediaUploadInputSchema = z.object({
  equipmentItemId: z.string().trim().min(1, "Gear item id is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  byteSize: z.number().int().positive("File size must be greater than 0"),
  contentType: z.string().optional(),
});

const gearMediaUploadCompleteInputSchema = z.object({
  equipmentItemId: z.string().trim().min(1, "Gear item id is required"),
  mediaId: z.string().trim().min(1, "Media id is required"),
  fileName: z.string().trim().min(1, "File name is required"),
  byteSize: z.number().int().positive("File size must be greater than 0"),
  contentType: z.string().optional(),
  objectKey: z.string().trim().min(1, "Object key is required"),
  uploadId: z.string().trim().min(1, "Upload id is required"),
  completedParts: z
    .array(
      z.object({
        partNumber: z.number().int().min(1),
        eTag: z.string().trim().min(1),
      }),
    )
    .min(1, "At least one uploaded part is required"),
});

const abortGearMediaUploadInputSchema = z.object({
  objectKey: z.string().trim().min(1, "Object key is required"),
  uploadId: z.string().trim().min(1, "Upload id is required"),
});

const deleteGearMediaAssetInputSchema = z.object({
  id: z.string().trim().min(1, "Media asset id is required"),
});

const gearServiceLogInputSchema = z.object({
  equipmentItemId: z.string().trim().min(1, "Gear item id is required"),
  serviceType: z.string().trim().min(1, "Service type is required"),
  serviceDate: z.string().trim().min(1, "Service date is required"),
  warrantyUntil: z.string().optional(),
  notes: z.string().optional(),
});

const gearServiceLogUpdateInputSchema = z.object({
  id: z.string().trim().min(1, "Service log id is required"),
  serviceType: z.string().trim().min(1, "Service type is required"),
  serviceDate: z.string().trim().min(1, "Service date is required"),
  warrantyUntil: z.string().optional(),
  notes: z.string().optional(),
});

const renameGearFacetSchema = z.object({
  field: z.enum(["type", "group", "manufacturer", "location"]),
  currentValue: z.string().trim().min(1, "Current value is required"),
  nextValue: z.string().trim().min(1, "New value is required"),
});

const promoteWishlistGearInputSchema = z.object({
  id: z.string().trim().min(1, "Wishlist item id is required"),
});

export const adminGearRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    let gear: typeof equipmentItem.$inferSelect[] = [];
    try {
      gear = await ctx.db
        .select()
        .from(equipmentItem)
        .orderBy(asc(equipmentItem.name));
    } catch (error) {
      rethrowEquipmentDetailSchemaError(error);
    }

    let serviceLogs: typeof equipmentServiceLog.$inferSelect[] = [];
    try {
      serviceLogs = await ctx.db
        .select()
        .from(equipmentServiceLog)
        .orderBy(
          desc(equipmentServiceLog.serviceDate),
          desc(equipmentServiceLog.createdTimestamp),
        );
    } catch (error) {
      if (!isMissingTableError(error, "equipment_service_log")) {
        rethrowEquipmentDetailSchemaError(error);
      }
    }

    let mediaAssets: typeof equipmentItemMediaAsset.$inferSelect[] = [];
    try {
      mediaAssets = await ctx.db
        .select()
        .from(equipmentItemMediaAsset)
        .orderBy(
          asc(equipmentItemMediaAsset.assetType),
          asc(equipmentItemMediaAsset.fileName),
        );
    } catch (error) {
      if (!isMissingTableError(error, "equipment_item_media_asset")) {
        rethrowEquipmentDetailSchemaError(error);
      }
    }

    const logsByItemId = serviceLogs.reduce(
      (grouped, log) => {
        grouped[log.equipmentItemId] ??= [];
        grouped[log.equipmentItemId]!.push(normalizeServiceLogRecord(log));
        return grouped;
      },
      {} as Record<string, ReturnType<typeof normalizeServiceLogRecord>[]>,
    );
    const mediaAssetsByItemId = mediaAssets.reduce(
      (grouped, asset) => {
        grouped[asset.equipmentItemId] ??= [];
        grouped[asset.equipmentItemId]!.push(normalizeGearMediaAssetRecord(asset));
        return grouped;
      },
      {} as Record<string, ReturnType<typeof normalizeGearMediaAssetRecord>[]>,
    );

    return gear.map((item) =>
      normalizeGearRecord({
        ...item,
        serviceLogs: logsByItemId[item.id] ?? [],
        mediaAssets: mediaAssetsByItemId[item.id] ?? [],
      }),
    );
  }),

  listWishlist: adminProcedure.query(async ({ ctx }) => {
    let wishlist: typeof wishlistGearItem.$inferSelect[] = [];
    try {
      wishlist = await ctx.db
        .select()
        .from(wishlistGearItem)
        .orderBy(asc(wishlistGearItem.name));
    } catch (error) {
      rethrowWishlistSchemaError(error);
    }

    return wishlist.map((item) => normalizeWishlistRecord(item));
  }),

  listMediaAssets: adminProcedure
    .input(
      z.object({
        equipmentItemId: z.string().trim().min(1, "Gear item id is required."),
      }),
    )
    .query(async ({ ctx, input }) => {
      try {
        const mediaAssets = await ctx.db
          .select()
          .from(equipmentItemMediaAsset)
          .where(eq(equipmentItemMediaAsset.equipmentItemId, input.equipmentItemId))
          .orderBy(
            asc(equipmentItemMediaAsset.assetType),
            asc(equipmentItemMediaAsset.fileName),
          );

        return mediaAssets.map(normalizeGearMediaAssetRecord);
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }
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

  searchModelHistory: adminProcedure
    .input(
      z.object({
        title: z.string().trim().min(1, "Title is required."),
      }),
    )
    .mutation(async ({ input }) => {
      const title = input.title.trim();
      const headers = {
        "Accept-Version": "3.0",
        Authorization: `Bearer ${env.REVERB_API_TOKEN}`,
      };

      const priceGuideUrl = new URL("https://api.reverb.com/api/priceguide");
      priceGuideUrl.searchParams.set("query", title);
      priceGuideUrl.searchParams.set(
        "per_page",
        String(REVERB_MODEL_HISTORY_PER_PAGE),
      );

      const listingsUrl = new URL("https://api.reverb.com/api/listings");
      listingsUrl.searchParams.set("query", title);
      listingsUrl.searchParams.set(
        "per_page",
        String(REVERB_MODEL_HISTORY_PER_PAGE),
      );

      const [priceGuideMatches, listingMatches] = await Promise.all([
        fetchPaginatedReverbResults(
          priceGuideUrl,
          headers,
          (payload) => reverbPriceGuideResponseSchema.parse(payload),
          (payload) =>
            payload.price_guides.map((guide) =>
              normalizePriceGuideHistoryPoint(guide, title),
            ),
        ),
        fetchPaginatedReverbResults(
          listingsUrl,
          headers,
          (payload) => reverbListingsResponseSchema.parse(payload),
          (payload) =>
            payload.listings.map((listing) =>
              normalizeListingHistoryPoint(listing, title),
            ),
        ),
      ]);

      const matches = [...priceGuideMatches, ...listingMatches].sort(
        (left, right) => (left.occurredAtMs ?? 0) - (right.occurredAtMs ?? 0),
      );

      return {
        title,
        matches,
      };
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

  upsertWishlist: adminProcedure
    .input(wishlistGearInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();
      const id = input.id ?? crypto.randomUUID();
      const targetPrice = normalizeCurrency(input.targetPrice);
      const quantity = normalizeQuantity(input.quantity);

      let result;
      try {
        result = await ctx.db
          .insert(wishlistGearItem)
          .values({
            id,
            name: input.name,
            description: input.description,
            type: input.type,
            group: input.group,
            targetPrice,
            quantity,
            manufacturer: input.manufacturer,
            created_timestamp: now,
          })
          .onConflictDoUpdate({
            target: wishlistGearItem.id,
            set: {
              name: input.name,
              description: input.description,
              type: input.type,
              group: input.group,
              targetPrice,
              quantity,
              manufacturer: input.manufacturer,
              updated_timestamp: now,
            },
          })
          .returning()
          .get();
      } catch (error) {
        rethrowWishlistSchemaError(error);
      }

      if (!result) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to save wishlist item.",
        });
      }

      return normalizeWishlistRecord(result);
    }),

  updateDetails: adminProcedure
    .input(gearDetailsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();
      let updated;
      try {
        updated = await ctx.db
          .update(equipmentItem)
          .set({
            status: input.status,
            location: normalizeText(input.location),
            serialNumber: normalizeText(input.serialNumber),
            acquiredFrom: normalizeText(input.acquiredFrom),
            purchaseDate: normalizeText(input.purchaseDate),
            purchaseSource: normalizeText(input.purchaseSource),
            referenceNumber: normalizeText(input.referenceNumber),
            notes: normalizeText(input.notes),
            updated_timestamp: now,
          })
          .where(eq(equipmentItem.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gear item not found.",
        });
      }

      return normalizeGearRecord(updated);
    }),

  updateWishlistDetails: adminProcedure
    .input(wishlistGearDetailsInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();
      let updated;
      try {
        updated = await ctx.db
          .update(wishlistGearItem)
          .set({
            status: input.status,
            notes: normalizeText(input.notes),
            updated_timestamp: now,
          })
          .where(eq(wishlistGearItem.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowWishlistSchemaError(error);
      }

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wishlist item not found.",
        });
      }

      return normalizeWishlistRecord(updated);
    }),

  updateWishlistStatus: adminProcedure
    .input(wishlistStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();
      let updated;
      try {
        updated = await ctx.db
          .update(wishlistGearItem)
          .set({
            status: input.status,
            updated_timestamp: now,
          })
          .where(eq(wishlistGearItem.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowWishlistSchemaError(error);
      }

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wishlist item not found.",
        });
      }

      return normalizeWishlistRecord(updated);
    }),

  updateStatus: adminProcedure
    .input(gearStatusInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();
      let updated;
      try {
        updated = await ctx.db
          .update(equipmentItem)
          .set({
            status: input.status,
            updated_timestamp: now,
          })
          .where(eq(equipmentItem.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!updated) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gear item not found.",
        });
      }

      return normalizeGearRecord(updated);
    }),

  prepareMediaUpload: adminProcedure
    .input(gearMediaUploadInputSchema)
    .mutation(async ({ ctx, input }) => {
      const gearItem = await ctx.db
        .select({
          id: equipmentItem.id,
          name: equipmentItem.name,
          manufacturer: equipmentItem.manufacturer,
        })
        .from(equipmentItem)
        .where(eq(equipmentItem.id, input.equipmentItemId))
        .get();

      if (!gearItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gear item not found.",
        });
      }

      const mediaId = crypto.randomUUID();
      const contentType = normalizeText(input.contentType) || "application/octet-stream";
      const upload = await prepareGearMediaMultipartUpload({
        byteSize: input.byteSize,
        contentType,
        equipmentItemId: gearItem.id,
        fileName: input.fileName,
        manufacturer: gearItem.manufacturer,
        mediaId,
        name: gearItem.name,
      });

      return {
        assetType: inferGearMediaAssetType({
          contentType,
          fileName: input.fileName,
        }),
        bucket: gearMediaBucketName,
        byteSize: input.byteSize,
        contentType,
        fileName: input.fileName.trim(),
        mediaId,
        objectKey: upload.objectKey,
        partSizeBytes: upload.partSizeBytes,
        parts: upload.parts,
        uploadId: upload.uploadId,
      };
    }),

  completeMediaUpload: adminProcedure
    .input(gearMediaUploadCompleteInputSchema)
    .mutation(async ({ ctx, input }) => {
      const gearItem = await ctx.db
        .select({ id: equipmentItem.id })
        .from(equipmentItem)
        .where(eq(equipmentItem.id, input.equipmentItemId))
        .get();

      if (!gearItem) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gear item not found.",
        });
      }

      const contentType = normalizeText(input.contentType) || "application/octet-stream";
      await completeMultipartUpload({
        bucket: gearMediaBucketName,
        completedParts: input.completedParts.map((part) => ({
          ETag: part.eTag,
          PartNumber: part.partNumber,
        })),
        key: input.objectKey,
        uploadId: input.uploadId,
      });

      let createdAsset;
      try {
        createdAsset = await ctx.db
          .insert(equipmentItemMediaAsset)
          .values({
            id: input.mediaId,
            equipmentItemId: input.equipmentItemId,
            assetType: inferGearMediaAssetType({
              contentType,
              fileName: input.fileName,
            }),
            fileName: input.fileName.trim(),
            contentType,
            byteSize: input.byteSize,
            storageUri: getStoredObjectUri({
              bucket: gearMediaBucketName,
              key: input.objectKey,
            }),
            createdTimestamp: new Date().toISOString(),
          })
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!createdAsset) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to save uploaded gear media.",
        });
      }

      return normalizeGearMediaAssetRecord(createdAsset);
    }),

  abortMediaUpload: adminProcedure
    .input(abortGearMediaUploadInputSchema)
    .mutation(async ({ input }) => {
      await abortMultipartUpload({
        bucket: gearMediaBucketName,
        key: input.objectKey,
        uploadId: input.uploadId,
      });

      return { success: true };
    }),

  deleteMediaAsset: adminProcedure
    .input(deleteGearMediaAssetInputSchema)
    .mutation(async ({ ctx, input }) => {
      let deletedAsset;
      try {
        deletedAsset = await ctx.db
          .delete(equipmentItemMediaAsset)
          .where(eq(equipmentItemMediaAsset.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!deletedAsset) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Media asset not found.",
        });
      }

      await deleteStoredObjectByUri(deletedAsset.storageUri);

      return {
        equipmentItemId: deletedAsset.equipmentItemId,
        id: deletedAsset.id,
      };
    }),

  addServiceLog: adminProcedure
    .input(gearServiceLogInputSchema)
    .mutation(async ({ ctx, input }) => {
      const equipment = await ctx.db
        .select({ id: equipmentItem.id })
        .from(equipmentItem)
        .where(eq(equipmentItem.id, input.equipmentItemId))
        .get();

      if (!equipment) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Gear item not found.",
        });
      }

      const now = new Date().toISOString();
      let serviceLog;
      try {
        serviceLog = await ctx.db
          .insert(equipmentServiceLog)
          .values({
            equipmentItemId: input.equipmentItemId,
            serviceType: input.serviceType.trim(),
            serviceDate: input.serviceDate.trim(),
            warrantyUntil: normalizeText(input.warrantyUntil),
            notes: normalizeText(input.notes),
            createdTimestamp: now,
          })
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!serviceLog) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create service log entry.",
        });
      }

      return normalizeServiceLogRecord(serviceLog);
    }),

  updateServiceLog: adminProcedure
    .input(gearServiceLogUpdateInputSchema)
    .mutation(async ({ ctx, input }) => {
      let serviceLog;
      try {
        serviceLog = await ctx.db
          .update(equipmentServiceLog)
          .set({
            serviceType: input.serviceType.trim(),
            serviceDate: input.serviceDate.trim(),
            warrantyUntil: normalizeText(input.warrantyUntil),
            notes: normalizeText(input.notes),
          })
          .where(eq(equipmentServiceLog.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!serviceLog) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service log not found.",
        });
      }

      return normalizeServiceLogRecord(serviceLog);
    }),

  deleteServiceLog: adminProcedure
    .input(z.object({ id: z.string().trim().min(1, "Service log id is required") }))
    .mutation(async ({ ctx, input }) => {
      let deleted;
      try {
        deleted = await ctx.db
          .delete(equipmentServiceLog)
          .where(eq(equipmentServiceLog.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowEquipmentDetailSchemaError(error);
      }

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Service log not found.",
        });
      }

      return { id: deleted.id, equipmentItemId: deleted.equipmentItemId };
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

  deleteWishlist: adminProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      let deleted;
      try {
        deleted = await ctx.db
          .delete(wishlistGearItem)
          .where(eq(wishlistGearItem.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowWishlistSchemaError(error);
      }

      if (!deleted) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Wishlist item not found.",
        });
      }

      return { id: deleted.id };
    }),

  promoteWishlist: adminProcedure
    .input(promoteWishlistGearInputSchema)
    .mutation(async ({ ctx, input }) => {
      const now = new Date().toString();

      const result = await ctx.db.transaction(async (tx) => {
        let wishlistItem;
        try {
          wishlistItem = await tx
            .select()
            .from(wishlistGearItem)
            .where(eq(wishlistGearItem.id, input.id))
            .get();
        } catch (error) {
          rethrowWishlistSchemaError(error);
        }

        if (!wishlistItem) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Wishlist item not found.",
          });
        }

        const existingGear = await tx
          .select({ id: equipmentItem.id })
          .from(equipmentItem)
          .where(eq(equipmentItem.name, wishlistItem.name))
          .get();

        if (existingGear) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message:
              "A gear item with this name already exists in inventory. Rename the wishlist item before promoting it.",
          });
        }

        const createdGear = await tx
          .insert(equipmentItem)
          .values({
            id: crypto.randomUUID(),
            name: wishlistItem.name,
            description: wishlistItem.description,
            type: wishlistItem.type,
            group: wishlistItem.group,
            status: "active",
            price: normalizeCurrency(wishlistItem.targetPrice),
            quantity: normalizeQuantity(wishlistItem.quantity),
            manufacturer: wishlistItem.manufacturer,
            location: "",
            notes: normalizeText(wishlistItem.notes),
            created_timestamp: now,
            updated_timestamp: now,
          })
          .returning()
          .get();

        await tx
          .delete(wishlistGearItem)
          .where(eq(wishlistGearItem.id, wishlistItem.id));

        return {
          wishlistId: wishlistItem.id,
          gear: createdGear,
        };
      });

      return {
        wishlistId: result.wishlistId,
        gear: normalizeGearRecord(result.gear),
      };
    }),

  renameFacet: adminProcedure
    .input(renameGearFacetSchema)
    .mutation(async ({ ctx, input }) => {
      const nextValue = input.nextValue.trim();
      const normalizedCurrentValue = input.currentValue.trim().toLocaleLowerCase();
      const column =
        input.field === "type"
          ? equipmentItem.type
          : input.field === "group"
            ? equipmentItem.group
            : input.field === "manufacturer"
              ? equipmentItem.manufacturer
              : equipmentItem.location;
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
