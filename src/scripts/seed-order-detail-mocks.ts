import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { desc, eq, inArray, or } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";

import { buildMasteringQuoteData } from "~/lib/mastering/mastering-pricing-calculator";
import type {
  MasteringAddOns,
  MasteringDeliveryOptions,
  MasteringPricingData,
  MasteringQuoteData,
  MasteringSong,
} from "~/lib/mastering/pricing-types";
import { buildQuoteDataFromDb } from "~/lib/mixing/pricing-calculator";
import type {
  AddOns,
  DeliveryOptions,
  PricingData,
  QuoteData,
  Song,
} from "~/lib/mixing/pricing-types";
import {
  discounts,
  orderItems,
  orders,
  orderSongAssets,
  orderSongSpecs,
  productOptions,
  products,
} from "~/server/db/schema";
import type { OrderWorkflowStatus } from "~/types/orders";

const client = createClient({
  url: process.env.TURSO_SQLITE_DB_DATABASE_URL ?? "",
  authToken: process.env.TURSO_SQLITE_DB_TOKEN,
});

const db = drizzle(client);

const DEFAULT_ALLOWED_SAMPLE_RATES = [44100, 48000];
const HI_RES_SAMPLE_RATES = [96000];
const DEFAULT_ALLOWED_BIT_DEPTHS = [24, 32, 64];
const DEFAULT_DURATION_TOLERANCE_SECONDS = 2;
const MOCK_CUSTOMER_EMAIL = "mock-orders+rpp@example.com";
const MOCK_FILE_DURATION_SECONDS = 0.1;

type MockSourceAssetPlan = "none" | "full";

type BaseMockOrderConfig = {
  checkoutSessionId: string;
  paymentIntentId: string;
  itemNameBase: string;
  workflowStatus: OrderWorkflowStatus;
  orderedAt: string;
  sourceAssetPlan: MockSourceAssetPlan;
  deliverableSongIds?: string[];
};

type MixingMockOrderConfig = BaseMockOrderConfig & {
  kind: "mixing";
  songs: Song[];
  addOns: AddOns;
  deliveryOptions: DeliveryOptions;
};

type MasteringMockOrderConfig = BaseMockOrderConfig & {
  kind: "mastering";
  songs: MasteringSong[];
  addOns: MasteringAddOns;
  deliveryOptions: MasteringDeliveryOptions;
};

type MockOrderConfig = MixingMockOrderConfig | MasteringMockOrderConfig;

type QuoteOrderSeed = {
  orderId: string;
  checkoutSessionId: string;
  workflowStatus: OrderWorkflowStatus;
  total: number;
  itemName: string;
  songSpecRows: Array<typeof orderSongSpecs.$inferInsert>;
  sourceAssetRows: Array<typeof orderSongAssets.$inferInsert>;
  deliverableAssetRows: Array<typeof orderSongAssets.$inferInsert>;
};

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildSilentWavBuffer = ({
  sampleRateHz,
  bitDepth,
  channelCount = 2,
  durationSeconds = MOCK_FILE_DURATION_SECONDS,
}: {
  sampleRateHz: number;
  bitDepth: number;
  channelCount?: number;
  durationSeconds?: number;
}) => {
  const bytesPerSample = bitDepth / 8;
  const frameCount = Math.max(1, Math.floor(sampleRateHz * durationSeconds));
  const blockAlign = channelCount * bytesPerSample;
  const byteRate = sampleRateHz * blockAlign;
  const dataSize = frameCount * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0, "ascii");
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8, "ascii");
  buffer.write("fmt ", 12, "ascii");
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(channelCount, 22);
  buffer.writeUInt32LE(sampleRateHz, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitDepth, 34);
  buffer.write("data", 36, "ascii");
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
};

const buildMixingRequirements = (song: QuoteData["songs"][number]) => {
  const requirements = [
    `${song.tracks} track${song.tracks === 1 ? "" : "s"} expected`,
    `Target duration ${Math.round(song.lengthMinutes * 60)} sec`,
    song.delivery.highResMixdown
      ? "96 kHz source requirement"
      : "44.1 / 48 kHz source requirement",
  ];

  if (song.addOns.vocalProduction) requirements.push("Vocal production add-on");
  if (song.addOns.drumReplacement) requirements.push("Drum replacement add-on");
  if (song.addOns.guitarReamp) requirements.push("Guitar re-amp add-on");
  if (song.delivery.mixedStems) requirements.push("Mixed stems deliverable included");
  if (song.delivery.filmMixdown) requirements.push("Film mixdown deliverable included");
  if (song.delivery.highResMixdown) requirements.push("Hi-res mixdown deliverable included");
  if (song.delivery.extendedArchival) requirements.push("Extended archival included");
  if (song.delivery.rushDelivery) requirements.push("Rush delivery included");

  return requirements;
};

const buildMasteringRequirements = (
  song: MasteringQuoteData["songs"][number],
) => {
  const requirements = [
    song.addOns.stemMastering
      ? `${song.addOns.stemCount} stem${song.addOns.stemCount === 1 ? "" : "s"} expected`
      : "Single stereo source expected",
    `Target duration ${Math.round(song.lengthMinutes * 60)} sec`,
    song.delivery.highResMaster
      ? "96 kHz source requirement"
      : "44.1 / 48 kHz source requirement",
  ];

  if (song.addOns.vinylMastering) requirements.push("Vinyl mastering add-on");
  if (song.addOns.streamingMastering) requirements.push("Streaming mastering add-on");
  if (song.addOns.redbookMastering) requirements.push("Red Book mastering add-on");
  if (song.addOns.stemMastering) requirements.push("Stem mastering add-on");
  if (song.addOns.restorationRemastering) {
    requirements.push("Restoration / remastering add-on");
  }
  if (song.delivery.highResMaster) requirements.push("Hi-res master deliverable included");
  if (song.delivery.ddpImage) requirements.push("DDP image deliverable included");
  if (song.delivery.isrcEncoding) requirements.push("ISRC encoding included");
  if (song.delivery.rushDelivery) requirements.push("Rush delivery included");

  return requirements;
};

const getMixingPricingData = async (): Promise<PricingData> => {
  const [productsData, optionsData, discountsData] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        or(
          eq(products.productType, "mixing"),
          eq(products.productType, "mixing-and-mastering"),
        ),
      ),
    db
      .select()
      .from(productOptions)
      .where(
        or(
          eq(productOptions.productType, "mixing"),
          eq(productOptions.productType, "mixing-and-mastering"),
        ),
      ),
    db
      .select()
      .from(discounts)
      .where(
        or(
          eq(discounts.productType, "mixing"),
          eq(discounts.productType, "mixing-and-mastering"),
        ),
      ),
  ]);

  return {
    products: productsData,
    options: optionsData,
    discounts: discountsData,
  };
};

const getMasteringPricingData = async (): Promise<MasteringPricingData> => {
  const [productsData, optionsData, discountsData] = await Promise.all([
    db
      .select()
      .from(products)
      .where(
        or(
          eq(products.productType, "mastering"),
          eq(products.productType, "mixing-and-mastering"),
        ),
      ),
    db
      .select()
      .from(productOptions)
      .where(
        or(
          eq(productOptions.productType, "mastering"),
          eq(productOptions.productType, "mixing-and-mastering"),
        ),
      ),
    db
      .select()
      .from(discounts)
      .where(
        or(
          eq(discounts.productType, "mastering"),
          eq(discounts.productType, "mixing-and-mastering"),
        ),
      ),
  ]);

  return {
    products: productsData,
    options: optionsData,
    discounts: discountsData,
  };
};

const createMockFile = async ({
  orderId,
  songSpecId,
  fileName,
  sampleRateHz,
  bitDepth,
}: {
  orderId: string;
  songSpecId: string;
  fileName: string;
  sampleRateHz: number;
  bitDepth: number;
}) => {
  const directory = path.join(
    process.cwd(),
    "public",
    "order-assets",
    "orders",
    orderId,
    songSpecId,
  );
  await mkdir(directory, { recursive: true });
  const filePath = path.join(directory, fileName);
  await writeFile(
    filePath,
    buildSilentWavBuffer({
      sampleRateHz,
      bitDepth,
    }),
  );

  return `/order-assets/orders/${orderId}/${songSpecId}/${fileName}`;
};

const buildSourceAssetRows = async ({
  orderId,
  songSpecRows,
  workflowStatus,
  sourceAssetPlan,
}: {
  orderId: string;
  songSpecRows: Array<typeof orderSongSpecs.$inferInsert>;
  workflowStatus: OrderWorkflowStatus;
  sourceAssetPlan: MockSourceAssetPlan;
}) => {
  if (sourceAssetPlan === "none") {
    return [];
  }

  const sourceAssetRows: Array<typeof orderSongAssets.$inferInsert> = [];

  for (const songSpec of songSpecRows) {
    const expectedCount = songSpec.expectedSourceCount ?? 1;
    const sampleRates = JSON.parse(
      String(songSpec.allowedSampleRates ?? "[]"),
    ) as number[];
    const bitDepths = JSON.parse(
      String(songSpec.allowedBitDepths ?? "[24,32,64]"),
    ) as number[];
    const sampleRateHz = sampleRates[0] ?? 44100;
    const bitDepth = bitDepths[0] ?? 24;
    const baseFileName = toSlug(songSpec.title);

    for (let index = 0; index < expectedCount; index += 1) {
      const numberedName =
        expectedCount === 1
          ? `${baseFileName}-${songSpec.sourceType}.wav`
          : `${baseFileName}-${songSpec.sourceType}-${String(index + 1).padStart(2, "0")}.wav`;

      const publicPath = await createMockFile({
        orderId,
        songSpecId: songSpec.id,
        fileName: numberedName,
        sampleRateHz,
        bitDepth,
      });

      sourceAssetRows.push({
        id: crypto.randomUUID(),
        orderId,
        songSpecId: songSpec.id,
        assetKind: "source",
        validationStatus: "valid",
        fileName: numberedName,
        originalRelativePath: null,
        publicPath,
        mimeType: "audio/wav",
        byteSize: 0,
        durationSeconds: songSpec.expectedDurationSeconds ?? null,
        sampleRateHz,
        bitDepth,
        channelCount: 2,
        validationMessages: JSON.stringify([]),
        uploaded_timestamp:
          workflowStatus === "completed"
            ? "2026-03-14T16:15:00.000Z"
            : "2026-03-18T14:10:00.000Z",
        created_timestamp:
          workflowStatus === "completed"
            ? "2026-03-14T16:15:00.000Z"
            : "2026-03-18T14:10:00.000Z",
        updated_timestamp:
          workflowStatus === "completed"
            ? "2026-03-14T16:15:00.000Z"
            : "2026-03-18T14:10:00.000Z",
      });
    }
  }

  return sourceAssetRows;
};

const buildDeliverableAssetRows = async ({
  orderId,
  songSpecRows,
  deliverableSongIds,
}: {
  orderId: string;
  songSpecRows: Array<typeof orderSongSpecs.$inferInsert>;
  deliverableSongIds?: string[];
}) => {
  if (!deliverableSongIds || deliverableSongIds.length === 0) {
    return [];
  }

  const deliverableRows: Array<typeof orderSongAssets.$inferInsert> = [];

  for (const songSpec of songSpecRows.filter((row) =>
    deliverableSongIds.includes(row.id),
  )) {
    const sampleRates = JSON.parse(
      String(songSpec.allowedSampleRates ?? "[]"),
    ) as number[];
    const bitDepths = JSON.parse(
      String(songSpec.allowedBitDepths ?? "[24,32,64]"),
    ) as number[];
    const sampleRateHz = sampleRates[0] ?? 44100;
    const bitDepth = bitDepths[0] ?? 24;
    const fileName = `${toSlug(songSpec.title)}-final-${songSpec.serviceType === "mixing" ? "mix" : "master"}.wav`;
    const publicPath = await createMockFile({
      orderId,
      songSpecId: songSpec.id,
      fileName,
      sampleRateHz,
      bitDepth,
    });

    deliverableRows.push({
      id: crypto.randomUUID(),
      orderId,
      songSpecId: songSpec.id,
      assetKind: "deliverable",
      validationStatus: "valid",
      fileName,
      originalRelativePath: null,
      publicPath,
      mimeType: "audio/wav",
      byteSize: 0,
      durationSeconds: songSpec.expectedDurationSeconds ?? null,
      sampleRateHz,
      bitDepth,
      channelCount: 2,
      validationMessages: JSON.stringify([]),
      uploaded_timestamp: "2026-03-19T10:00:00.000Z",
      created_timestamp: "2026-03-19T10:00:00.000Z",
      updated_timestamp: "2026-03-19T10:00:00.000Z",
    });
  }

  return deliverableRows;
};

const buildMixingOrderSeed = async (
  config: MixingMockOrderConfig,
  pricingData: PricingData,
): Promise<QuoteOrderSeed> => {
  const quote = buildQuoteDataFromDb(
    pricingData,
    config.songs,
    config.addOns,
    config.deliveryOptions,
  );
  const orderId = crypto.randomUUID();
  const itemName = `${config.itemNameBase} (${config.songs.length} songs)`;
  const songSpecRows = quote.songs.map((song, index) => {
    const songId = `${orderId}:mix:${song.songId}`;
    return {
      id: songId,
      orderId,
      sessionName: config.itemNameBase,
      songIndex: index,
      title: song.title,
      serviceType: "mixing" as const,
      sourceType: "mixing-tracks" as const,
      expectedDurationSeconds: Math.round(song.lengthMinutes * 60),
      durationToleranceSeconds: DEFAULT_DURATION_TOLERANCE_SECONDS,
      expectedSourceCount: song.tracks,
      expectedTrackCount: song.tracks,
      expectedStemCount: null,
      allowedSampleRates: JSON.stringify(
        song.delivery.highResMixdown
          ? HI_RES_SAMPLE_RATES
          : DEFAULT_ALLOWED_SAMPLE_RATES,
      ),
      allowedBitDepths: JSON.stringify(DEFAULT_ALLOWED_BIT_DEPTHS),
      requirements: JSON.stringify(buildMixingRequirements(song)),
      created_timestamp: config.orderedAt,
      updated_timestamp: config.orderedAt,
    };
  });

  const sourceAssetRows = await buildSourceAssetRows({
    orderId,
    songSpecRows,
    workflowStatus: config.workflowStatus,
    sourceAssetPlan: config.sourceAssetPlan,
  });
  const deliverableAssetRows = await buildDeliverableAssetRows({
    orderId,
    songSpecRows,
    deliverableSongIds: config.deliverableSongIds,
  });

  return {
    orderId,
    checkoutSessionId: config.checkoutSessionId,
    workflowStatus: config.workflowStatus,
    total: Number(quote.costs.total.toFixed(2)),
    itemName,
    songSpecRows,
    sourceAssetRows,
    deliverableAssetRows,
  };
};

const buildMasteringOrderSeed = async (
  config: MasteringMockOrderConfig,
  pricingData: MasteringPricingData,
): Promise<QuoteOrderSeed> => {
  const quote = buildMasteringQuoteData(
    pricingData,
    config.songs,
    config.addOns,
    config.deliveryOptions,
  );
  const orderId = crypto.randomUUID();
  const itemName = `${config.itemNameBase} (${config.songs.length} song${config.songs.length === 1 ? "" : "s"})`;
  const songSpecRows = quote.songs.map((song, index) => {
    const songId = `${orderId}:master:${song.songId}`;
    return {
      id: songId,
      orderId,
      sessionName: config.itemNameBase,
      songIndex: index,
      title: song.title,
      serviceType: "mastering" as const,
      sourceType: song.addOns.stemMastering
        ? ("mastering-stems" as const)
        : ("mastering-file" as const),
      expectedDurationSeconds: Math.round(song.lengthMinutes * 60),
      durationToleranceSeconds: DEFAULT_DURATION_TOLERANCE_SECONDS,
      expectedSourceCount: song.addOns.stemMastering
        ? Math.max(song.addOns.stemCount, 1)
        : 1,
      expectedTrackCount: null,
      expectedStemCount: song.addOns.stemMastering
        ? Math.max(song.addOns.stemCount, 1)
        : null,
      allowedSampleRates: JSON.stringify(
        song.delivery.highResMaster
          ? HI_RES_SAMPLE_RATES
          : DEFAULT_ALLOWED_SAMPLE_RATES,
      ),
      allowedBitDepths: JSON.stringify(DEFAULT_ALLOWED_BIT_DEPTHS),
      requirements: JSON.stringify(buildMasteringRequirements(song)),
      created_timestamp: config.orderedAt,
      updated_timestamp: config.orderedAt,
    };
  });

  const sourceAssetRows = await buildSourceAssetRows({
    orderId,
    songSpecRows,
    workflowStatus: config.workflowStatus,
    sourceAssetPlan: config.sourceAssetPlan,
  });
  const deliverableAssetRows = await buildDeliverableAssetRows({
    orderId,
    songSpecRows,
    deliverableSongIds: config.deliverableSongIds,
  });

  return {
    orderId,
    checkoutSessionId: config.checkoutSessionId,
    workflowStatus: config.workflowStatus,
    total: Number(quote.costs.total.toFixed(2)),
    itemName,
    songSpecRows,
    sourceAssetRows,
    deliverableAssetRows,
  };
};

const buildMockConfigs = (): MockOrderConfig[] => [
  {
    kind: "mixing",
    checkoutSessionId: "cs_seed_rpp_mix_open_20260320",
    paymentIntentId: "pi_seed_rpp_mix_open_20260320",
    itemNameBase: "Mixing Session - Northside Lights EP",
    workflowStatus: "awaiting-files",
    orderedAt: "2026-03-20T09:30:00.000Z",
    sourceAssetPlan: "none",
    songs: [
      { id: "mix-open-1", title: "Northside Lights", tracks: 14, minutes: 3, seconds: 42 },
      { id: "mix-open-2", title: "Velvet Static", tracks: 10, minutes: 4, seconds: 11 },
      { id: "mix-open-3", title: "Afterglow Bloom", tracks: 18, minutes: 5, seconds: 9 },
    ],
    addOns: {
      vocalProductionSongs: ["mix-open-1", "mix-open-3"],
      drumReplacementSongs: ["mix-open-1", "mix-open-2"],
      guitarReampSongs: ["mix-open-1", "mix-open-3"],
      virtualSessionHours: 1,
      revisions: 2,
    },
    deliveryOptions: {
      highResMixdownSongs: ["mix-open-1", "mix-open-3"],
      filmMixdownSongs: ["mix-open-1", "mix-open-3"],
      mixedStemsSongs: ["mix-open-1", "mix-open-2"],
      extendedArchivalSongs: ["mix-open-1"],
      rushDeliverySongs: ["mix-open-1", "mix-open-3"],
    },
  },
  {
    kind: "mixing",
    checkoutSessionId: "cs_seed_rpp_mix_feedback_20260320",
    paymentIntentId: "pi_seed_rpp_mix_feedback_20260320",
    itemNameBase: "Mixing Session - Feedback Pass",
    workflowStatus: "awaiting-feedback",
    orderedAt: "2026-03-11T14:10:00.000Z",
    sourceAssetPlan: "full",
    songs: [
      { id: "mix-feedback-1", title: "Polaroid Nights", tracks: 4, minutes: 3, seconds: 30 },
      { id: "mix-feedback-2", title: "Signal Bloom", tracks: 5, minutes: 4, seconds: 20 },
    ],
    addOns: {
      vocalProductionSongs: ["mix-feedback-1"],
      drumReplacementSongs: ["mix-feedback-2"],
      guitarReampSongs: ["mix-feedback-1"],
      virtualSessionHours: 0,
      revisions: 1,
    },
    deliveryOptions: {
      highResMixdownSongs: ["mix-feedback-1"],
      filmMixdownSongs: ["mix-feedback-2"],
      mixedStemsSongs: ["mix-feedback-1"],
      extendedArchivalSongs: ["mix-feedback-2"],
      rushDeliverySongs: ["mix-feedback-2"],
    },
  },
  {
    kind: "mastering",
    checkoutSessionId: "cs_seed_rpp_master_progress_20260320",
    paymentIntentId: "pi_seed_rpp_master_progress_20260320",
    itemNameBase: "Mastering Session - Satellite Heart EP",
    workflowStatus: "in-progress",
    orderedAt: "2026-02-21T13:05:00.000Z",
    sourceAssetPlan: "full",
    songs: [
      { id: "master-progress-1", title: "Satellite Heart", minutes: 4, seconds: 5 },
      { id: "master-progress-2", title: "Silver Chamber", minutes: 6, seconds: 24 },
      { id: "master-progress-3", title: "Static Veil", minutes: 3, seconds: 58 },
      { id: "master-progress-4", title: "Nocturne Tape", minutes: 10, seconds: 48 },
    ],
    addOns: {
      vinylMasteringSongs: ["master-progress-1", "master-progress-3"],
      streamingMasteringSongs: ["master-progress-1", "master-progress-2"],
      redbookMasteringSongs: ["master-progress-1", "master-progress-4"],
      stemMasteringSongs: {
        "master-progress-2": 3,
        "master-progress-4": 4,
      },
      restorationRemasteringSongs: ["master-progress-3"],
      virtualSessionHours: 0,
      revisions: 1,
    },
    deliveryOptions: {
      highResMasterSongs: ["master-progress-1", "master-progress-2"],
      ddpImageSongs: ["master-progress-1", "master-progress-2"],
      isrcEncodingSongs: ["master-progress-1", "master-progress-3"],
      rushDeliverySongs: ["master-progress-1", "master-progress-4"],
    },
  },
  {
    kind: "mastering",
    checkoutSessionId: "cs_seed_rpp_master_complete_20260320",
    paymentIntentId: "pi_seed_rpp_master_complete_20260320",
    itemNameBase: "Mastering Session - Midnight Archive Single",
    workflowStatus: "completed",
    orderedAt: "2026-01-28T11:20:00.000Z",
    sourceAssetPlan: "full",
    deliverableSongIds: [],
    songs: [
      { id: "master-complete-1", title: "Midnight Archive", minutes: 4, seconds: 44 },
    ],
    addOns: {
      vinylMasteringSongs: [],
      streamingMasteringSongs: ["master-complete-1"],
      redbookMasteringSongs: ["master-complete-1"],
      stemMasteringSongs: {},
      restorationRemasteringSongs: [],
      virtualSessionHours: 0,
      revisions: 0,
    },
    deliveryOptions: {
      highResMasterSongs: ["master-complete-1"],
      ddpImageSongs: ["master-complete-1"],
      isrcEncodingSongs: ["master-complete-1"],
      rushDeliverySongs: ["master-complete-1"],
    },
  },
];

const main = async () => {
  const userId = process.argv[2];

  if (!userId) {
    throw new Error("Usage: seed-order-detail-mocks.ts <clerk-user-id>");
  }

  const [mixingPricingData, masteringPricingData] = await Promise.all([
    getMixingPricingData(),
    getMasteringPricingData(),
  ]);

  const mockConfigs = buildMockConfigs();
  const seededOrders: QuoteOrderSeed[] = [];

  for (const config of mockConfigs) {
    if (config.kind === "mixing") {
      seededOrders.push(
        await buildMixingOrderSeed(config, mixingPricingData),
      );
      continue;
    }

    const orderSeed = await buildMasteringOrderSeed(
      config,
      masteringPricingData,
    );

    if (config.workflowStatus === "completed") {
      orderSeed.deliverableAssetRows = await buildDeliverableAssetRows({
        orderId: orderSeed.orderId,
        songSpecRows: orderSeed.songSpecRows,
        deliverableSongIds: orderSeed.songSpecRows.map((row) => row.id),
      });
    }

    seededOrders.push(orderSeed);
  }

  const existingOrders = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.userId, userId));

  if (existingOrders.length > 0) {
    const existingOrderIds = existingOrders.map((order) => order.id);

    for (const existingOrderId of existingOrderIds) {
      const existingDirectory = path.join(
        process.cwd(),
        "public",
        "order-assets",
        "orders",
        existingOrderId,
      );
      await rm(existingDirectory, { recursive: true, force: true }).catch(
        () => null,
      );
    }

    await db
      .delete(orderSongAssets)
      .where(inArray(orderSongAssets.orderId, existingOrderIds));
    await db
      .delete(orderSongSpecs)
      .where(inArray(orderSongSpecs.orderId, existingOrderIds));
    await db.delete(orderItems).where(inArray(orderItems.orderId, existingOrderIds));
    await db.delete(orders).where(inArray(orders.id, existingOrderIds));
  }

  for (const orderSeed of seededOrders) {
    await db.insert(orders).values({
      id: orderSeed.orderId,
      userId,
      checkoutSessionId: orderSeed.checkoutSessionId,
      paymentIntentId: `pi_${orderSeed.checkoutSessionId.slice(3)}`,
      customerEmail: MOCK_CUSTOMER_EMAIL,
      status: "paid",
      workflowStatus: orderSeed.workflowStatus,
      paymentStatus: "paid",
      currency: "usd",
      subtotal: orderSeed.total,
      discount: 0,
      total: orderSeed.total,
      itemCount: 1,
      ordered_timestamp:
        mockConfigs.find(
          (config) => config.checkoutSessionId === orderSeed.checkoutSessionId,
        )?.orderedAt ?? new Date().toISOString(),
      created_timestamp:
        mockConfigs.find(
          (config) => config.checkoutSessionId === orderSeed.checkoutSessionId,
        )?.orderedAt ?? new Date().toISOString(),
      updated_timestamp:
        mockConfigs.find(
          (config) => config.checkoutSessionId === orderSeed.checkoutSessionId,
        )?.orderedAt ?? new Date().toISOString(),
    });

    await db.insert(orderItems).values({
      id: crypto.randomUUID(),
      orderId: orderSeed.orderId,
      name: orderSeed.itemName,
      quantity: 1,
      unitPrice: orderSeed.total,
      totalPrice: orderSeed.total,
      created_timestamp:
        mockConfigs.find(
          (config) => config.checkoutSessionId === orderSeed.checkoutSessionId,
        )?.orderedAt ?? new Date().toISOString(),
      updated_timestamp:
        mockConfigs.find(
          (config) => config.checkoutSessionId === orderSeed.checkoutSessionId,
        )?.orderedAt ?? new Date().toISOString(),
    });

    await db.insert(orderSongSpecs).values(orderSeed.songSpecRows);

    if (orderSeed.sourceAssetRows.length > 0) {
      await db.insert(orderSongAssets).values(orderSeed.sourceAssetRows);
    }

    if (orderSeed.deliverableAssetRows.length > 0) {
      await db.insert(orderSongAssets).values(orderSeed.deliverableAssetRows);
    }
  }

  const verificationOrders = await db
    .select({
      checkoutSessionId: orders.checkoutSessionId,
      workflowStatus: orders.workflowStatus,
      total: orders.total,
    })
    .from(orders)
    .where(eq(orders.userId, userId))
    .orderBy(desc(orders.ordered_timestamp));

  const verificationOrderIds = await db
    .select({ id: orders.id })
    .from(orders)
    .where(eq(orders.userId, userId));

  const orderIds = verificationOrderIds.map((order) => order.id);
  const songSpecCount =
    orderIds.length > 0
      ? (
          await db
            .select({ id: orderSongSpecs.id })
            .from(orderSongSpecs)
            .where(inArray(orderSongSpecs.orderId, orderIds))
        ).length
      : 0;
  const assetCount =
    orderIds.length > 0
      ? (
          await db
            .select({ id: orderSongAssets.id })
            .from(orderSongAssets)
            .where(inArray(orderSongAssets.orderId, orderIds))
        ).length
      : 0;

  console.log(
    JSON.stringify(
      {
        userId,
        orderCount: verificationOrders.length,
        orderSongSpecCount: songSpecCount,
        orderSongAssetCount: assetCount,
        orders: verificationOrders,
      },
      null,
      2,
    ),
  );

  await client.close();
};

await main();
