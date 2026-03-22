import "server-only";

import { and, asc, eq } from "drizzle-orm";

import type { MasteringQuoteData } from "~/lib/mastering/pricing-types";
import type { QuoteData } from "~/lib/mixing/pricing-types";
import { db } from "~/server/db/client";
import {
  cartItems,
  orderItems,
  orders,
  orderSongAssets,
  orderSongSpecs,
} from "~/server/db/schema";
import type {
  OrderDetail,
  OrderListItemEntry,
  OrderServiceType,
  OrderSongAsset,
  OrderSongSpec,
  OrderSongSourceType,
  OrderWorkflowStatus,
} from "~/types/orders";

const DEFAULT_ALLOWED_SAMPLE_RATES = [44100, 48000];
const HI_RES_SAMPLE_RATES = [96000];
const DEFAULT_ALLOWED_BIT_DEPTHS = [24, 32, 64];
const DEFAULT_DURATION_TOLERANCE_SECONDS = 2;
const SOURCE_EXTENSIONS = [".wav", ".wave"];
const sessionSongCountPattern = /\((\d+)\s+song(?:s)?\)\s*$/i;

const toJsonArray = <T>(value: T[]) => JSON.stringify(value);

const parseJsonArray = <T>(value: string | null | undefined, fallback: T[]) => {
  if (!value) {
    return fallback;
  }

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? (parsed as T[]) : fallback;
  } catch {
    return fallback;
  }
};

const stripServiceMetadata = (name: string) =>
  name.replace(sessionSongCountPattern, "").trim();

const getSongCountFromItemName = (name: string) => {
  const match = name.match(sessionSongCountPattern);
  return match?.[1] ? Number(match[1]) : 0;
};

const getOrderServiceTypeFromNames = (names: string[]): OrderServiceType => {
  const normalizedNames = names.map((name) => name.toLowerCase());
  const hasMixing = normalizedNames.some((name) => /\bmix(ing)?\b/.test(name));
  const hasMastering = normalizedNames.some((name) =>
    /\bmaster(ing)?\b/.test(name),
  );

  if (hasMixing && hasMastering) {
    return "mixing-and-mastering";
  }

  if (hasMixing) {
    return "mixing";
  }

  if (hasMastering) {
    return "mastering";
  }

  return "studio-service";
};

const isMissingOrderDetailSchemaError = (error: unknown) => {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("no such table: order_song_specs") ||
    error.message.includes("no such table: order_song_assets")
  );
};

const getUploadsLocked = (workflowStatus: OrderWorkflowStatus) =>
  [
    "in-progress",
    "awaiting-feedback",
    "revision-in-progress",
    "completed",
    "cancelled",
  ].includes(workflowStatus);

const usesCappedSourceCount = (songSpec: {
  sourceType: OrderSongSourceType;
}) =>
  songSpec.sourceType === "mixing-tracks" ||
  songSpec.sourceType === "mastering-stems";

const getMinimumRequiredSourceCount = (songSpec: {
  sourceType: OrderSongSourceType;
  expectedSourceCount: number | null;
}) =>
  usesCappedSourceCount(songSpec) ? 1 : (songSpec.expectedSourceCount ?? 1);

const buildMixingRequirements = (song: QuoteData["songs"][number]) => {
  const requirements = [
    `Up to ${song.tracks} track${song.tracks === 1 ? "" : "s"} accepted`,
    `Target duration ${Math.round(song.lengthMinutes * 60)} sec`,
    song.delivery.highResMixdown ? "96 kHz source requirement" : "44.1 / 48 kHz source requirement",
  ];

  if (song.addOns.vocalProduction) {
    requirements.push("Vocal production add-on");
  }

  if (song.addOns.drumReplacement) {
    requirements.push("Drum replacement add-on");
  }

  if (song.addOns.guitarReamp) {
    requirements.push("Guitar re-amp add-on");
  }

  if (song.delivery.mixedStems) {
    requirements.push("Mixed stems deliverable included");
  }

  if (song.delivery.filmMixdown) {
    requirements.push("Film mixdown deliverable included");
  }

  if (song.delivery.highResMixdown) {
    requirements.push("Hi-res mixdown deliverable included");
  }

  if (song.delivery.extendedArchival) {
    requirements.push("Extended archival included");
  }

  if (song.delivery.rushDelivery) {
    requirements.push("Rush delivery included");
  }

  return requirements;
};

const buildMasteringRequirements = (
  song: MasteringQuoteData["songs"][number],
) => {
  const requirements = [
    song.addOns.stemMastering
      ? `Up to ${song.addOns.stemCount} stem${song.addOns.stemCount === 1 ? "" : "s"} accepted`
      : "Single stereo source expected",
    `Target duration ${Math.round(song.lengthMinutes * 60)} sec`,
    song.delivery.highResMaster ? "96 kHz source requirement" : "44.1 / 48 kHz source requirement",
  ];

  if (song.addOns.vinylMastering) {
    requirements.push("Vinyl mastering add-on");
  }

  if (song.addOns.streamingMastering) {
    requirements.push("Streaming mastering add-on");
  }

  if (song.addOns.redbookMastering) {
    requirements.push("Red Book mastering add-on");
  }

  if (song.addOns.stemMastering) {
    requirements.push("Stem mastering add-on");
  }

  if (song.addOns.restorationRemastering) {
    requirements.push("Restoration / remastering add-on");
  }

  if (song.delivery.highResMaster) {
    requirements.push("Hi-res master deliverable included");
  }

  if (song.delivery.ddpImage) {
    requirements.push("DDP image deliverable included");
  }

  if (song.delivery.isrcEncoding) {
    requirements.push("ISRC encoding included");
  }

  if (song.delivery.rushDelivery) {
    requirements.push("Rush delivery included");
  }

  return requirements;
};

const buildMixingSongSpecs = ({
  orderId,
  sessionName,
  serviceType,
  quote,
  cartItemId,
  startIndex,
}: {
  orderId: string;
  sessionName: string;
  serviceType: OrderServiceType;
  quote: QuoteData;
  cartItemId: string;
  startIndex: number;
}) =>
  quote.songs.map((song, index) => ({
    id: `${orderId}:${cartItemId}:${song.songId}`,
    orderId,
    sessionName,
    songIndex: startIndex + index,
    title: song.title,
    serviceType,
    sourceType: "mixing-tracks" as OrderSongSourceType,
    expectedDurationSeconds: Math.round(song.lengthMinutes * 60),
    durationToleranceSeconds: DEFAULT_DURATION_TOLERANCE_SECONDS,
    expectedSourceCount: song.tracks,
    expectedTrackCount: song.tracks,
    expectedStemCount: null,
    allowedSampleRates: toJsonArray(
      song.delivery.highResMixdown
        ? HI_RES_SAMPLE_RATES
        : DEFAULT_ALLOWED_SAMPLE_RATES,
    ),
    allowedBitDepths: toJsonArray(DEFAULT_ALLOWED_BIT_DEPTHS),
    requirements: toJsonArray(buildMixingRequirements(song)),
    created_timestamp: new Date().toISOString(),
    updated_timestamp: new Date().toISOString(),
  }));

const buildMasteringSongSpecs = ({
  orderId,
  sessionName,
  quote,
  cartItemId,
  startIndex,
}: {
  orderId: string;
  sessionName: string;
  quote: MasteringQuoteData;
  cartItemId: string;
  startIndex: number;
}) =>
  quote.songs.map((song, index) => ({
    id: `${orderId}:${cartItemId}:${song.songId}`,
    orderId,
    sessionName,
    songIndex: startIndex + index,
    title: song.title,
    serviceType: "mastering" as OrderServiceType,
    sourceType: song.addOns.stemMastering
      ? ("mastering-stems" as OrderSongSourceType)
      : ("mastering-file" as OrderSongSourceType),
    expectedDurationSeconds: Math.round(song.lengthMinutes * 60),
    durationToleranceSeconds: DEFAULT_DURATION_TOLERANCE_SECONDS,
    expectedSourceCount: song.addOns.stemMastering
      ? Math.max(song.addOns.stemCount, 1)
      : 1,
    expectedTrackCount: null,
    expectedStemCount: song.addOns.stemMastering
      ? Math.max(song.addOns.stemCount, 1)
      : null,
    allowedSampleRates: toJsonArray(
      song.delivery.highResMaster
        ? HI_RES_SAMPLE_RATES
        : DEFAULT_ALLOWED_SAMPLE_RATES,
    ),
    allowedBitDepths: toJsonArray(DEFAULT_ALLOWED_BIT_DEPTHS),
    requirements: toJsonArray(buildMasteringRequirements(song)),
    created_timestamp: new Date().toISOString(),
    updated_timestamp: new Date().toISOString(),
  }));

const buildFallbackSongSpecs = ({
  orderId,
  items,
}: {
  orderId: string;
  items: OrderListItemEntry[];
}) => {
  const sourceServiceType = getOrderServiceTypeFromNames(items.map((item) => item.name));
  const effectiveSourceServiceType =
    sourceServiceType === "mixing-and-mastering" ? "mixing" : sourceServiceType;
  const sourceType: OrderSongSourceType =
    effectiveSourceServiceType === "mixing"
      ? "mixing-tracks"
      : "mastering-file";
  const sessionNames = [...new Set(items.map((item) => stripServiceMetadata(item.name)))];
  const sessionName = sessionNames.join(" / ") || "Studio Session";
  const songCount = items.reduce((total, item) => {
    const parsedCount = getSongCountFromItemName(item.name);
    return total + (parsedCount > 0 ? parsedCount * item.quantity : item.quantity);
  }, 0);

  return Array.from({ length: Math.max(songCount, 1) }, (_, index) => ({
    id: `${orderId}:legacy:${index + 1}`,
    orderId,
    sessionName,
    songIndex: index,
    title: `Song ${index + 1}`,
    serviceType:
      sourceServiceType === "mixing-and-mastering"
        ? ("mixing-and-mastering" as const)
        : effectiveSourceServiceType,
    sourceType,
    expectedDurationSeconds: null,
    durationToleranceSeconds: DEFAULT_DURATION_TOLERANCE_SECONDS,
    expectedSourceCount: 1,
    expectedTrackCount: effectiveSourceServiceType === "mixing" ? null : null,
    expectedStemCount: null,
    allowedSampleRates: toJsonArray(DEFAULT_ALLOWED_SAMPLE_RATES),
    allowedBitDepths: toJsonArray(DEFAULT_ALLOWED_BIT_DEPTHS),
    requirements: toJsonArray([
      "Legacy order: detailed source requirements were not captured at checkout",
      effectiveSourceServiceType === "mixing"
        ? "Upload the full song folder or the final track set for each song"
        : "Upload one stereo master file for each song",
    ]),
    created_timestamp: new Date().toISOString(),
    updated_timestamp: new Date().toISOString(),
  }));
};

const ensureSongSpecsForOrder = async ({
  orderId,
  items,
}: {
  orderId: string;
  items: OrderListItemEntry[];
}) => {
  const existingSpecs = await db
    .select()
    .from(orderSongSpecs)
    .where(eq(orderSongSpecs.orderId, orderId))
    .orderBy(asc(orderSongSpecs.songIndex));

  if (existingSpecs.length > 0) {
    return existingSpecs;
  }

  const fallbackSpecs = buildFallbackSongSpecs({ orderId, items });

  if (fallbackSpecs.length > 0) {
    await db.insert(orderSongSpecs).values(fallbackSpecs).onConflictDoNothing();
  }

  return await db
    .select()
    .from(orderSongSpecs)
    .where(eq(orderSongSpecs.orderId, orderId))
    .orderBy(asc(orderSongSpecs.songIndex));
};

const toOrderSongAsset = (
  asset: typeof orderSongAssets.$inferSelect,
): OrderSongAsset => ({
  id: asset.id,
  orderId: asset.orderId,
  songSpecId: asset.songSpecId,
  assetKind: asset.assetKind,
  validationStatus: asset.validationStatus,
  fileName: asset.fileName,
  originalRelativePath: asset.originalRelativePath,
  publicPath: asset.publicPath,
  mimeType: asset.mimeType,
  byteSize: asset.byteSize,
  durationSeconds: asset.durationSeconds,
  sampleRateHz: asset.sampleRateHz,
  bitDepth: asset.bitDepth,
  channelCount: asset.channelCount,
  validationMessages: parseJsonArray<string>(asset.validationMessages, []),
  uploadedAt: asset.uploaded_timestamp,
});

export const syncOrderSongSpecsFromCart = async ({
  orderId,
  cartId,
}: {
  orderId: string;
  cartId: string;
}) => {
  try {
    const existingSpecs = await db
      .select({ id: orderSongSpecs.id })
      .from(orderSongSpecs)
      .where(eq(orderSongSpecs.orderId, orderId))
      .limit(1);

    if (existingSpecs.length > 0) {
      return;
    }

    const persistedQuoteItems = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cartId))
      .orderBy(asc(cartItems.created_timestamp));

    const mixingQuoteItems = persistedQuoteItems.filter(
      (item) => item.type === "mixing" && item.data,
    );
    const masteringQuoteItems = persistedQuoteItems.filter(
      (item) => item.type === "mastering" && item.data,
    );

    const nextSpecs =
      mixingQuoteItems.length > 0
        ? mixingQuoteItems.flatMap((item, itemIndex) =>
            buildMixingSongSpecs({
              orderId,
              sessionName: stripServiceMetadata(item.name),
              serviceType:
                masteringQuoteItems.length > 0
                  ? "mixing-and-mastering"
                  : "mixing",
              quote: JSON.parse(item.data as string) as QuoteData,
              cartItemId: item.id,
              startIndex:
                mixingQuoteItems
                  .slice(0, itemIndex)
                  .reduce((count, currentItem) => {
                    const quote = JSON.parse(
                      currentItem.data as string,
                    ) as QuoteData;
                    return count + quote.songs.length;
                  }, 0),
            }),
          )
        : masteringQuoteItems.flatMap((item, itemIndex) =>
            buildMasteringSongSpecs({
              orderId,
              sessionName: stripServiceMetadata(item.name),
              quote: JSON.parse(item.data as string) as MasteringQuoteData,
              cartItemId: item.id,
              startIndex:
                masteringQuoteItems
                  .slice(0, itemIndex)
                  .reduce((count, currentItem) => {
                    const quote = JSON.parse(
                      currentItem.data as string,
                    ) as MasteringQuoteData;
                    return count + quote.songs.length;
                  }, 0),
            }),
          );

    if (nextSpecs.length > 0) {
      await db.insert(orderSongSpecs).values(nextSpecs).onConflictDoNothing();
    }
  } catch (error) {
    if (isMissingOrderDetailSchemaError(error)) {
      console.warn(
        "Detailed order song specs are unavailable because the order detail migration has not been applied yet.",
      );
      return;
    }

    throw error;
  }
};

export const getOrderSongSpecForUser = async ({
  userId,
  orderId,
  songSpecId,
}: {
  userId: string;
  orderId: string;
  songSpecId: string;
}) => {
  const orderRecord = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .get();

  if (!orderRecord) {
    return null;
  }

  try {
    const songSpec = await db
      .select()
      .from(orderSongSpecs)
      .where(
        and(
          eq(orderSongSpecs.orderId, orderId),
          eq(orderSongSpecs.id, songSpecId),
        ),
      )
      .get();

    if (!songSpec) {
      return null;
    }

    const assets = await db
      .select()
      .from(orderSongAssets)
      .where(eq(orderSongAssets.songSpecId, songSpecId))
      .orderBy(asc(orderSongAssets.uploaded_timestamp));

    const mappedAssets = assets.map(toOrderSongAsset);

    return {
      order: orderRecord,
      songSpec: {
        id: songSpec.id,
        orderId: songSpec.orderId,
        sessionName: songSpec.sessionName,
        songIndex: songSpec.songIndex,
        title: songSpec.title,
        serviceType: songSpec.serviceType,
        sourceType: songSpec.sourceType,
        expectedDurationSeconds: songSpec.expectedDurationSeconds,
        durationToleranceSeconds: songSpec.durationToleranceSeconds,
        expectedSourceCount: songSpec.expectedSourceCount,
        expectedTrackCount: songSpec.expectedTrackCount,
        expectedStemCount: songSpec.expectedStemCount,
        allowedSampleRates: parseJsonArray<number>(
          songSpec.allowedSampleRates,
          DEFAULT_ALLOWED_SAMPLE_RATES,
        ),
        allowedBitDepths: parseJsonArray<number>(
          songSpec.allowedBitDepths,
          DEFAULT_ALLOWED_BIT_DEPTHS,
        ),
        requirements: parseJsonArray<string>(songSpec.requirements, []),
        sourceAssets: mappedAssets.filter((asset) => asset.assetKind === "source"),
        deliverableAssets: mappedAssets.filter(
          (asset) => asset.assetKind === "deliverable",
        ),
      } satisfies OrderSongSpec,
      uploadsLocked: getUploadsLocked(orderRecord.workflowStatus),
    };
  } catch (error) {
    if (isMissingOrderDetailSchemaError(error)) {
      return null;
    }

    throw error;
  }
};

export const syncOrderWorkflowFromUploads = async (orderId: string) => {
  try {
    const orderRecord = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .get();

    if (
      !orderRecord ||
      !["awaiting-files", "on-hold", "queued"].includes(orderRecord.workflowStatus)
    ) {
      return;
    }

    const songSpecs = await db
      .select()
      .from(orderSongSpecs)
      .where(eq(orderSongSpecs.orderId, orderId))
      .orderBy(asc(orderSongSpecs.songIndex));

    if (songSpecs.length === 0) {
      return;
    }

    const sourceAssets = await db
      .select()
      .from(orderSongAssets)
      .where(eq(orderSongAssets.orderId, orderId))
      .orderBy(asc(orderSongAssets.uploaded_timestamp));

    const validSourceCounts = sourceAssets.reduce<Record<string, number>>(
      (grouped, asset) => {
        if (
          asset.assetKind === "source" &&
          asset.validationStatus === "valid"
        ) {
          grouped[asset.songSpecId] = (grouped[asset.songSpecId] ?? 0) + 1;
        }

        return grouped;
      },
      {},
    );

    const isComplete = songSpecs.every((songSpec) => {
      const requiredCount = getMinimumRequiredSourceCount(songSpec);
      return (validSourceCounts[songSpec.id] ?? 0) >= requiredCount;
    });

    if (isComplete && orderRecord.workflowStatus !== "queued") {
      await db
        .update(orders)
        .set({
          workflowStatus: "queued",
          updated_timestamp: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId));
      return;
    }

    if (!isComplete && orderRecord.workflowStatus === "queued") {
      await db
        .update(orders)
        .set({
          workflowStatus: "awaiting-files",
          updated_timestamp: new Date().toISOString(),
        })
        .where(eq(orders.id, orderId));
    }
  } catch (error) {
    if (isMissingOrderDetailSchemaError(error)) {
      return;
    }

    throw error;
  }
};

export const getOrderDetailForUser = async ({
  userId,
  orderId,
}: {
  userId: string;
  orderId: string;
}) => {
  const orderRecord = await db
    .select()
    .from(orders)
    .where(and(eq(orders.id, orderId), eq(orders.userId, userId)))
    .get();

  if (!orderRecord) {
    return null;
  }

  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderRecord.id))
    .orderBy(asc(orderItems.created_timestamp));

  const orderListItems: OrderListItemEntry[] = items.map((item) => ({
    id: item.id,
    name: item.name,
    quantity: item.quantity,
    total: item.totalPrice,
  }));

  const serviceType = getOrderServiceTypeFromNames(
    orderListItems.map((item) => item.name),
  );

  try {
    const specs = await ensureSongSpecsForOrder({
      orderId: orderRecord.id,
      items: orderListItems,
    });
    const assets = await db
      .select()
      .from(orderSongAssets)
      .where(eq(orderSongAssets.orderId, orderRecord.id))
      .orderBy(asc(orderSongAssets.uploaded_timestamp));

    const assetsBySongId = assets.reduce<Record<string, OrderSongAsset[]>>(
      (grouped, asset) => {
        grouped[asset.songSpecId] ??= [];
        grouped[asset.songSpecId]?.push(toOrderSongAsset(asset));
        return grouped;
      },
      {},
    );

    const songSpecs: OrderSongSpec[] = specs.map((spec) => {
      const mappedAssets = assetsBySongId[spec.id] ?? [];
      return {
        id: spec.id,
        orderId: spec.orderId,
        sessionName: spec.sessionName,
        songIndex: spec.songIndex,
        title: spec.title,
        serviceType: spec.serviceType,
        sourceType: spec.sourceType,
        expectedDurationSeconds: spec.expectedDurationSeconds,
        durationToleranceSeconds: spec.durationToleranceSeconds,
        expectedSourceCount: spec.expectedSourceCount,
        expectedTrackCount: spec.expectedTrackCount,
        expectedStemCount: spec.expectedStemCount,
        allowedSampleRates: parseJsonArray<number>(
          spec.allowedSampleRates,
          DEFAULT_ALLOWED_SAMPLE_RATES,
        ),
        allowedBitDepths: parseJsonArray<number>(
          spec.allowedBitDepths,
          DEFAULT_ALLOWED_BIT_DEPTHS,
        ),
        requirements: parseJsonArray<string>(spec.requirements, []),
        sourceAssets: mappedAssets.filter((asset) => asset.assetKind === "source"),
        deliverableAssets: mappedAssets.filter(
          (asset) => asset.assetKind === "deliverable",
        ),
      };
    });

    const totalExpectedSourceFiles = songSpecs.reduce(
      (count, songSpec) => count + (songSpec.expectedSourceCount ?? 1),
      0,
    );
    const totalUploadedSourceFiles = songSpecs.reduce(
      (count, songSpec) => count + songSpec.sourceAssets.length,
      0,
    );
    const totalValidatedSourceFiles = songSpecs.reduce(
      (count, songSpec) =>
        count +
        songSpec.sourceAssets.filter(
          (asset) => asset.validationStatus === "valid",
        ).length,
      0,
    );
    const completedSongCount = songSpecs.filter((songSpec) => {
      const requiredCount = getMinimumRequiredSourceCount(songSpec);
      const validCount = songSpec.sourceAssets.filter(
        (asset) => asset.validationStatus === "valid",
      ).length;

      return validCount >= requiredCount;
    }).length;
    const requirementsSummary = [
      ...new Set(songSpecs.flatMap((songSpec) => songSpec.requirements)),
    ];

    return {
      id: orderRecord.id,
      checkoutSessionId: orderRecord.checkoutSessionId,
      paymentIntentId: orderRecord.paymentIntentId,
      customerEmail: orderRecord.customerEmail,
      checkoutStatus: orderRecord.status,
      workflowStatus: orderRecord.workflowStatus,
      paymentStatus: orderRecord.paymentStatus,
      currency: orderRecord.currency,
      subtotal: orderRecord.subtotal,
      discount: orderRecord.discount,
      total: orderRecord.total,
      itemCount: orderRecord.itemCount,
      orderedAt: orderRecord.ordered_timestamp,
      items: orderListItems,
      serviceType,
      songSpecs,
      uploadsLocked: getUploadsLocked(orderRecord.workflowStatus),
      totalExpectedSourceFiles,
      totalUploadedSourceFiles,
      totalValidatedSourceFiles,
      sourceCompletionPercent:
        songSpecs.length > 0
          ? Math.round((completedSongCount / songSpecs.length) * 100)
          : 0,
      completedSongCount,
      requirementsSummary,
      acceptedSourceExtensions: SOURCE_EXTENSIONS,
    } satisfies OrderDetail;
  } catch (error) {
    if (isMissingOrderDetailSchemaError(error)) {
      return {
        id: orderRecord.id,
        checkoutSessionId: orderRecord.checkoutSessionId,
        paymentIntentId: orderRecord.paymentIntentId,
        customerEmail: orderRecord.customerEmail,
        checkoutStatus: orderRecord.status,
        workflowStatus: orderRecord.workflowStatus,
        paymentStatus: orderRecord.paymentStatus,
        currency: orderRecord.currency,
        subtotal: orderRecord.subtotal,
        discount: orderRecord.discount,
        total: orderRecord.total,
        itemCount: orderRecord.itemCount,
        orderedAt: orderRecord.ordered_timestamp,
        items: orderListItems,
        serviceType,
        songSpecs: [],
        uploadsLocked: true,
        totalExpectedSourceFiles: 0,
        totalUploadedSourceFiles: 0,
        totalValidatedSourceFiles: 0,
        sourceCompletionPercent: 0,
        completedSongCount: 0,
        requirementsSummary: [],
        acceptedSourceExtensions: SOURCE_EXTENSIONS,
      } satisfies OrderDetail;
    }

    throw error;
  }
};
