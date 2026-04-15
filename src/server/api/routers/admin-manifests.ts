import { TRPCError } from "@trpc/server";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";

import { adminProcedure, createTRPCRouter } from "~/server/api/trpc";
import { buildGearManifestQrParts } from "~/lib/gear-manifests/qr";
import {
  equipmentItem,
  gearManifest,
  gearManifestEntry,
} from "~/server/db/schema";

const normalizeText = (value: unknown) =>
  typeof value === "string" ? value.trim() : "";

const normalizeQuantity = (value: unknown) => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.trunc(parsed);
};

const isMissingManifestSchemaError = (error: unknown) =>
  error instanceof Error &&
  /(no such table: gear_manifest|no such table: gear_manifest_entry|no such column: .*gear_manifest|no such column: .*gear_manifest_entry)/i.test(
    error.message,
  );

const rethrowManifestSchemaError = (error: unknown): never => {
  if (isMissingManifestSchemaError(error)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message:
        "The gear manifest schema has not been added to the database yet. Run `pnpm run db:add:gear-manifests`.",
    });
  }

  throw error;
};

const normalizeManifestEntryRecord = (
  record: typeof gearManifestEntry.$inferSelect,
) => ({
  ...record,
  id: normalizeText(record.id),
  manifestId: normalizeText(record.manifestId),
  equipmentItemId: normalizeText(record.equipmentItemId),
  itemName: normalizeText(record.itemName),
  manufacturer: normalizeText(record.manufacturer),
  type: normalizeText(record.type),
  group: normalizeText(record.group),
  quantity: normalizeQuantity(record.quantity),
  itemOrder: normalizeQuantity(record.itemOrder),
  createdTimestamp: normalizeText(record.createdTimestamp),
  updatedTimestamp: normalizeText(record.updatedTimestamp),
});

const normalizeManifestRecord = (
  record: typeof gearManifest.$inferSelect,
  entries: typeof gearManifestEntry.$inferSelect[],
) => ({
  ...record,
  id: normalizeText(record.id),
  name: normalizeText(record.name),
  notes: normalizeText(record.notes),
  partCount: normalizeQuantity(record.partCount),
  created_timestamp: normalizeText(record.created_timestamp),
  updated_timestamp: normalizeText(record.updated_timestamp),
  entries: entries
    .map(normalizeManifestEntryRecord)
    .sort((left, right) => left.itemOrder - right.itemOrder),
});

const createManifestInputSchema = z.object({
  name: z.string().trim().min(1, "Manifest name is required."),
  notes: z.string().optional(),
  equipmentItemIds: z
    .array(z.string().trim().min(1))
    .min(1, "Select at least one gear item."),
});

export const adminManifestsRouter = createTRPCRouter({
  list: adminProcedure.query(async ({ ctx }) => {
    let manifests: typeof gearManifest.$inferSelect[] = [];
    let entries: typeof gearManifestEntry.$inferSelect[] = [];

    try {
      [manifests, entries] = await Promise.all([
        ctx.db.select().from(gearManifest).orderBy(desc(gearManifest.created_timestamp)),
        ctx.db
          .select()
          .from(gearManifestEntry)
          .orderBy(asc(gearManifestEntry.manifestId), asc(gearManifestEntry.itemOrder)),
      ]);
    } catch (error) {
      rethrowManifestSchemaError(error);
    }

    const entriesByManifestId = entries.reduce(
      (grouped, entry) => {
        grouped[entry.manifestId] ??= [];
        grouped[entry.manifestId]!.push(entry);
        return grouped;
      },
      {} as Record<string, typeof gearManifestEntry.$inferSelect[]>,
    );

    return manifests.map((manifest) =>
      normalizeManifestRecord(manifest, entriesByManifestId[manifest.id] ?? []),
    );
  }),

  create: adminProcedure
    .input(createManifestInputSchema)
    .mutation(async ({ ctx, input }) => {
      const orderedItemIds = [...new Map(
        input.equipmentItemIds.map((itemId) => [itemId.trim(), itemId.trim()]),
      ).values()].filter(Boolean);

      const gearItems = await ctx.db
        .select({
          id: equipmentItem.id,
          name: equipmentItem.name,
          manufacturer: equipmentItem.manufacturer,
          type: equipmentItem.type,
          group: equipmentItem.group,
          quantity: equipmentItem.quantity,
        })
        .from(equipmentItem)
        .where(inArray(equipmentItem.id, orderedItemIds));

      const gearById = new Map(gearItems.map((item) => [item.id, item]));
      const orderedGearItems = orderedItemIds
        .map((itemId) => gearById.get(itemId))
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (orderedGearItems.length !== orderedItemIds.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more selected gear items could not be found.",
        });
      }

      const manifestId = crypto.randomUUID();
      const manifestEntries = orderedGearItems.map((item, index) => ({
        id: crypto.randomUUID(),
        manifestId,
        equipmentItemId: item.id,
        itemOrder: index,
        itemName: item.name.trim(),
        manufacturer: item.manufacturer.trim(),
        type: item.type.trim(),
        group: item.group.trim(),
        quantity: normalizeQuantity(item.quantity),
        createdTimestamp: new Date().toISOString(),
        updatedTimestamp: null,
      }));

      const partCount = buildGearManifestQrParts({
        manifestId,
        manifestName: input.name.trim(),
        entries: manifestEntries.map((entry) => ({
          i: entry.equipmentItemId,
          n: entry.itemName,
          m: entry.manufacturer,
          t: entry.type,
          g: entry.group,
          q: entry.quantity,
        })),
      }).length;

      const now = new Date().toString();
      let createdManifest: typeof gearManifest.$inferSelect | undefined;

      try {
        const result = await ctx.db.transaction(async (tx) => {
          const insertedManifest = await tx
            .insert(gearManifest)
            .values({
              id: manifestId,
              name: input.name.trim(),
              notes: normalizeText(input.notes),
              partCount: Math.max(partCount, 1),
              created_timestamp: now,
              updated_timestamp: now,
            })
            .returning()
            .get();

          if (!insertedManifest) {
            throw new TRPCError({
              code: "INTERNAL_SERVER_ERROR",
              message: "Unable to create the manifest.",
            });
          }

          if (manifestEntries.length > 0) {
            await tx.insert(gearManifestEntry).values(manifestEntries);
          }

          return insertedManifest;
        });

        createdManifest = result;
      } catch (error) {
        rethrowManifestSchemaError(error);
      }

      if (!createdManifest) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Unable to create the manifest.",
        });
      }

      return normalizeManifestRecord(createdManifest, manifestEntries);
    }),

  delete: adminProcedure
    .input(
      z.object({
        id: z.string().trim().min(1, "Manifest id is required."),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      let deletedManifest;

      try {
        deletedManifest = await ctx.db
          .delete(gearManifest)
          .where(eq(gearManifest.id, input.id))
          .returning()
          .get();
      } catch (error) {
        rethrowManifestSchemaError(error);
      }

      if (!deletedManifest) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Manifest not found.",
        });
      }

      return { id: deletedManifest.id };
    }),
});
