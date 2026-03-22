import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@libsql/client";
import { asc, eq, inArray, or } from "drizzle-orm";
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
const MOCK_FILE_DURATION_SECONDS = 0.1;

type MockSourceAssetPlan = "none" | "full";

type LegacyMixingConfig = {
  kind: "mixing";
  sessionName: string;
  itemName: string;
  sourceAssetPlan: MockSourceAssetPlan;
  deliverAllSongs?: boolean;
  songs: Song[];
  addOns: AddOns;
  deliveryOptions: DeliveryOptions;
};

type LegacyMasteringConfig = {
  kind: "mastering";
  sessionName: string;
  itemName: string;
  sourceAssetPlan: MockSourceAssetPlan;
  deliverAllSongs?: boolean;
  songs: MasteringSong[];
  addOns: MasteringAddOns;
  deliveryOptions: MasteringDeliveryOptions;
};

type LegacyBundleConfig = {
  kind: "bundle";
  mixing: LegacyMixingConfig;
  mastering: LegacyMasteringConfig;
};

type LegacyOrderConfig =
  | LegacyMixingConfig
  | LegacyMasteringConfig
  | LegacyBundleConfig;

type ExistingLegacyOrder = {
  id: string;
  checkoutSessionId: string;
  userId: string;
  workflowStatus: OrderWorkflowStatus;
  orderedAt: string;
  total: number;
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

      const uploadedAt =
        workflowStatus === "completed"
          ? "2026-03-14T16:15:00.000Z"
          : "2026-03-18T14:10:00.000Z";

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
        uploaded_timestamp: uploadedAt,
        created_timestamp: uploadedAt,
        updated_timestamp: uploadedAt,
      });
    }
  }

  return sourceAssetRows;
};

const buildDeliverableAssetRows = async ({
  orderId,
  songSpecRows,
  deliverAllSongs,
}: {
  orderId: string;
  songSpecRows: Array<typeof orderSongSpecs.$inferInsert>;
  deliverAllSongs?: boolean;
}) => {
  if (!deliverAllSongs) {
    return [];
  }

  const deliverableRows: Array<typeof orderSongAssets.$inferInsert> = [];

  for (const songSpec of songSpecRows) {
    const sampleRates = JSON.parse(
      String(songSpec.allowedSampleRates ?? "[]"),
    ) as number[];
    const bitDepths = JSON.parse(
      String(songSpec.allowedBitDepths ?? "[24,32,64]"),
    ) as number[];
    const sampleRateHz = sampleRates[0] ?? 44100;
    const bitDepth = bitDepths[0] ?? 24;
    const fileName = `${toSlug(songSpec.title)}-final-${songSpec.sourceType === "mixing-tracks" ? "mix" : "master"}.wav`;
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

const buildMixingSongSpecs = ({
  orderId,
  sessionName,
  quote,
  specPrefix,
  serviceType = "mixing",
  startIndex = 0,
  createdAt,
}: {
  orderId: string;
  sessionName: string;
  quote: QuoteData;
  specPrefix: string;
  serviceType?: "mixing" | "mixing-and-mastering";
  startIndex?: number;
  createdAt: string;
}) =>
  quote.songs.map((song, index) => ({
    id: `${orderId}:${specPrefix}:${song.songId}`,
    orderId,
    sessionName,
    songIndex: startIndex + index,
    title: song.title,
    serviceType,
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
    created_timestamp: createdAt,
    updated_timestamp: createdAt,
  }));

const buildMasteringSongSpecs = ({
  orderId,
  sessionName,
  quote,
  specPrefix,
  startIndex = 0,
  createdAt,
}: {
  orderId: string;
  sessionName: string;
  quote: MasteringQuoteData;
  specPrefix: string;
  startIndex?: number;
  createdAt: string;
}) =>
  quote.songs.map((song, index) => ({
    id: `${orderId}:${specPrefix}:${song.songId}`,
    orderId,
    sessionName,
    songIndex: startIndex + index,
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
    created_timestamp: createdAt,
    updated_timestamp: createdAt,
  }));

const legacyConfigs: Record<string, LegacyOrderConfig> = {
  cs_seed_user36_mix_ep_20251018: {
    kind: "mixing",
    sessionName: "Mixing Session - Redline Motel EP",
    itemName: "Mixing Session - Redline Motel EP (4 songs)",
    sourceAssetPlan: "full",
    songs: [
      { id: "legacy-mix-1", title: "Redline Motel", tracks: 16, minutes: 3, seconds: 41 },
      { id: "legacy-mix-2", title: "Chrome Season", tracks: 11, minutes: 4, seconds: 8 },
      { id: "legacy-mix-3", title: "Halogen Hearts", tracks: 19, minutes: 5, seconds: 4 },
      { id: "legacy-mix-4", title: "Downtown Receiver", tracks: 8, minutes: 3, seconds: 27 },
    ],
    addOns: {
      vocalProductionSongs: ["legacy-mix-1", "legacy-mix-3"],
      drumReplacementSongs: ["legacy-mix-1", "legacy-mix-2"],
      guitarReampSongs: ["legacy-mix-1", "legacy-mix-4"],
      virtualSessionHours: 1,
      revisions: 2,
    },
    deliveryOptions: {
      highResMixdownSongs: ["legacy-mix-1", "legacy-mix-3"],
      filmMixdownSongs: ["legacy-mix-1", "legacy-mix-3"],
      mixedStemsSongs: ["legacy-mix-1", "legacy-mix-2", "legacy-mix-4"],
      extendedArchivalSongs: ["legacy-mix-1", "legacy-mix-4"],
      rushDeliverySongs: ["legacy-mix-1", "legacy-mix-3"],
    },
  },
  cs_seed_user36_master_lp_20251202: {
    kind: "mastering",
    sessionName: "Mastering Session - Static Meridian LP",
    itemName: "Mastering Session - Static Meridian LP (7 songs)",
    sourceAssetPlan: "full",
    songs: [
      { id: "legacy-master-lp-1", title: "Static Meridian", minutes: 4, seconds: 5 },
      { id: "legacy-master-lp-2", title: "Summer Relay", minutes: 5, seconds: 48 },
      { id: "legacy-master-lp-3", title: "Night Bus Lullaby", minutes: 3, seconds: 31 },
      { id: "legacy-master-lp-4", title: "Wide Echo Field", minutes: 10, seconds: 27 },
      { id: "legacy-master-lp-5", title: "Lowlight Parade", minutes: 4, seconds: 42 },
      { id: "legacy-master-lp-6", title: "Velour Circuit", minutes: 6, seconds: 2 },
      { id: "legacy-master-lp-7", title: "Terminal Bloom", minutes: 4, seconds: 18 },
    ],
    addOns: {
      vinylMasteringSongs: [
        "legacy-master-lp-1",
        "legacy-master-lp-3",
        "legacy-master-lp-5",
      ],
      streamingMasteringSongs: [
        "legacy-master-lp-1",
        "legacy-master-lp-2",
        "legacy-master-lp-4",
        "legacy-master-lp-6",
      ],
      redbookMasteringSongs: [
        "legacy-master-lp-1",
        "legacy-master-lp-4",
        "legacy-master-lp-7",
      ],
      stemMasteringSongs: {
        "legacy-master-lp-2": 3,
        "legacy-master-lp-4": 4,
        "legacy-master-lp-6": 2,
      },
      restorationRemasteringSongs: ["legacy-master-lp-5"],
      virtualSessionHours: 0,
      revisions: 1,
    },
    deliveryOptions: {
      highResMasterSongs: [
        "legacy-master-lp-1",
        "legacy-master-lp-2",
        "legacy-master-lp-6",
      ],
      ddpImageSongs: [
        "legacy-master-lp-1",
        "legacy-master-lp-2",
        "legacy-master-lp-6",
      ],
      isrcEncodingSongs: [
        "legacy-master-lp-1",
        "legacy-master-lp-3",
        "legacy-master-lp-7",
      ],
      rushDeliverySongs: ["legacy-master-lp-1", "legacy-master-lp-4"],
    },
  },
  cs_seed_user36_bundle_pair_20260211: {
    kind: "bundle",
    mixing: {
      kind: "mixing",
      sessionName: "Mixing Session - Observatory Run",
      itemName: "Mixing Session - Observatory Run (3 songs)",
      sourceAssetPlan: "full",
      songs: [
        { id: "legacy-bundle-mix-1", title: "Observatory Run", tracks: 12, minutes: 4, seconds: 14 },
        { id: "legacy-bundle-mix-2", title: "Kinetic Harbor", tracks: 9, minutes: 3, seconds: 53 },
        { id: "legacy-bundle-mix-3", title: "Silver Atrium", tracks: 15, minutes: 4, seconds: 37 },
      ],
      addOns: {
        vocalProductionSongs: ["legacy-bundle-mix-1", "legacy-bundle-mix-3"],
        drumReplacementSongs: ["legacy-bundle-mix-2"],
        guitarReampSongs: ["legacy-bundle-mix-1"],
        virtualSessionHours: 1,
        revisions: 1,
      },
      deliveryOptions: {
        highResMixdownSongs: ["legacy-bundle-mix-1", "legacy-bundle-mix-3"],
        filmMixdownSongs: ["legacy-bundle-mix-3"],
        mixedStemsSongs: ["legacy-bundle-mix-1", "legacy-bundle-mix-2"],
        extendedArchivalSongs: ["legacy-bundle-mix-1"],
        rushDeliverySongs: ["legacy-bundle-mix-3"],
      },
    },
    mastering: {
      kind: "mastering",
      sessionName: "Mastering Session - Observatory Run",
      itemName: "Mastering Session - Observatory Run (3 songs)",
      sourceAssetPlan: "full",
      songs: [
        { id: "legacy-bundle-master-1", title: "Observatory Run", minutes: 4, seconds: 14 },
        { id: "legacy-bundle-master-2", title: "Kinetic Harbor", minutes: 3, seconds: 53 },
        { id: "legacy-bundle-master-3", title: "Silver Atrium", minutes: 4, seconds: 37 },
      ],
      addOns: {
        vinylMasteringSongs: ["legacy-bundle-master-1"],
        streamingMasteringSongs: [
          "legacy-bundle-master-1",
          "legacy-bundle-master-2",
        ],
        redbookMasteringSongs: ["legacy-bundle-master-3"],
        stemMasteringSongs: {
          "legacy-bundle-master-2": 3,
        },
        restorationRemasteringSongs: [],
        virtualSessionHours: 0,
        revisions: 1,
      },
      deliveryOptions: {
        highResMasterSongs: ["legacy-bundle-master-1"],
        ddpImageSongs: ["legacy-bundle-master-1"],
        isrcEncodingSongs: [
          "legacy-bundle-master-1",
          "legacy-bundle-master-3",
        ],
        rushDeliverySongs: ["legacy-bundle-master-3"],
      },
    },
  },
  cs_seed_user36_master_single_20260314: {
    kind: "mastering",
    sessionName: "Mastering Session - Blue Hour Single",
    itemName: "Mastering Session - Blue Hour Single (1 song)",
    sourceAssetPlan: "full",
    deliverAllSongs: true,
    songs: [
      { id: "legacy-master-single-1", title: "Blue Hour Archive", minutes: 4, seconds: 44 },
    ],
    addOns: {
      vinylMasteringSongs: [],
      streamingMasteringSongs: ["legacy-master-single-1"],
      redbookMasteringSongs: ["legacy-master-single-1"],
      stemMasteringSongs: {},
      restorationRemasteringSongs: [],
      virtualSessionHours: 0,
      revisions: 0,
    },
    deliveryOptions: {
      highResMasterSongs: ["legacy-master-single-1"],
      ddpImageSongs: ["legacy-master-single-1"],
      isrcEncodingSongs: ["legacy-master-single-1"],
      rushDeliverySongs: ["legacy-master-single-1"],
    },
  },
};

const clearExistingOrderAssets = async (orderId: string) => {
  const existingDirectory = path.join(
    process.cwd(),
    "public",
    "order-assets",
    "orders",
    orderId,
  );

  await rm(existingDirectory, { recursive: true, force: true }).catch(() => null);
};

const updateOrderItemNames = async ({
  orderId,
  config,
}: {
  orderId: string;
  config: LegacyOrderConfig;
}) => {
  const items = await db
    .select()
    .from(orderItems)
    .where(eq(orderItems.orderId, orderId))
    .orderBy(asc(orderItems.created_timestamp));

  if (config.kind === "bundle") {
    for (const item of items) {
      const nextName = /\bmix(ing)?\b/i.test(item.name)
        ? config.mixing.itemName
        : config.mastering.itemName;

      await db
        .update(orderItems)
        .set({
          name: nextName,
          updated_timestamp: new Date().toISOString(),
        })
        .where(eq(orderItems.id, item.id));
    }

    return;
  }

  if (items[0]) {
    await db
      .update(orderItems)
      .set({
        name: config.itemName,
        updated_timestamp: new Date().toISOString(),
      })
      .where(eq(orderItems.id, items[0].id));
  }
};

const buildOrderUpgradeRows = async ({
  order,
  config,
  mixingPricingData,
  masteringPricingData,
}: {
  order: ExistingLegacyOrder;
  config: LegacyOrderConfig;
  mixingPricingData: PricingData;
  masteringPricingData: MasteringPricingData;
}) => {
  if (config.kind === "mixing") {
    const quote = buildQuoteDataFromDb(
      mixingPricingData,
      config.songs,
      config.addOns,
      config.deliveryOptions,
    );
    const songSpecRows = buildMixingSongSpecs({
      orderId: order.id,
      sessionName: config.sessionName,
      quote,
      specPrefix: "mix",
      createdAt: order.orderedAt,
    });
    const sourceAssetRows = await buildSourceAssetRows({
      orderId: order.id,
      songSpecRows,
      workflowStatus: order.workflowStatus,
      sourceAssetPlan: config.sourceAssetPlan,
    });
    const deliverableAssetRows = await buildDeliverableAssetRows({
      orderId: order.id,
      songSpecRows,
      deliverAllSongs: config.deliverAllSongs,
    });

    return {
      computedTotal: Number(quote.costs.total.toFixed(2)),
      songSpecRows,
      sourceAssetRows,
      deliverableAssetRows,
    };
  }

  if (config.kind === "mastering") {
    const quote = buildMasteringQuoteData(
      masteringPricingData,
      config.songs,
      config.addOns,
      config.deliveryOptions,
    );
    const songSpecRows = buildMasteringSongSpecs({
      orderId: order.id,
      sessionName: config.sessionName,
      quote,
      specPrefix: "master",
      createdAt: order.orderedAt,
    });
    const sourceAssetRows = await buildSourceAssetRows({
      orderId: order.id,
      songSpecRows,
      workflowStatus: order.workflowStatus,
      sourceAssetPlan: config.sourceAssetPlan,
    });
    const deliverableAssetRows = await buildDeliverableAssetRows({
      orderId: order.id,
      songSpecRows,
      deliverAllSongs: config.deliverAllSongs,
    });

    return {
      computedTotal: Number(quote.costs.total.toFixed(2)),
      songSpecRows,
      sourceAssetRows,
      deliverableAssetRows,
    };
  }

  const mixingQuote = buildQuoteDataFromDb(
    mixingPricingData,
    config.mixing.songs,
    config.mixing.addOns,
    config.mixing.deliveryOptions,
  );
  const masteringQuote = buildMasteringQuoteData(
    masteringPricingData,
    config.mastering.songs,
    config.mastering.addOns,
    config.mastering.deliveryOptions,
  );
  const mixingSongSpecRows = buildMixingSongSpecs({
    orderId: order.id,
    sessionName: config.mixing.sessionName,
    quote: mixingQuote,
    specPrefix: "mix",
    createdAt: order.orderedAt,
  });
  const masteringSongSpecRows = buildMasteringSongSpecs({
    orderId: order.id,
    sessionName: config.mastering.sessionName,
    quote: masteringQuote,
    specPrefix: "master",
    startIndex: mixingSongSpecRows.length,
    createdAt: order.orderedAt,
  });
  const songSpecRows = [...mixingSongSpecRows, ...masteringSongSpecRows];
  const sourceAssetRows = await buildSourceAssetRows({
    orderId: order.id,
    songSpecRows,
    workflowStatus: order.workflowStatus,
    sourceAssetPlan: "full",
  });
  const deliverableAssetRows: Array<typeof orderSongAssets.$inferInsert> = [];

  return {
    computedTotal: Number(
      (mixingQuote.costs.total + masteringQuote.costs.total).toFixed(2),
    ),
    songSpecRows,
    sourceAssetRows,
    deliverableAssetRows,
  };
};

const main = async () => {
  const checkoutSessionIds = Object.keys(legacyConfigs);

  const legacyOrders = await db
    .select({
      id: orders.id,
      checkoutSessionId: orders.checkoutSessionId,
      userId: orders.userId,
      workflowStatus: orders.workflowStatus,
      orderedAt: orders.ordered_timestamp,
      total: orders.total,
    })
    .from(orders)
    .where(inArray(orders.checkoutSessionId, checkoutSessionIds));

  if (legacyOrders.length === 0) {
    console.log(
      JSON.stringify(
        {
          upgradedCount: 0,
          message: "No legacy demo orders were found.",
        },
        null,
        2,
      ),
    );
    await client.close();
    return;
  }

  const [mixingPricingData, masteringPricingData] = await Promise.all([
    getMixingPricingData(),
    getMasteringPricingData(),
  ]);

  const results = [];

  for (const order of legacyOrders) {
    const config = legacyConfigs[order.checkoutSessionId];

    if (!config) {
      continue;
    }

    await clearExistingOrderAssets(order.id);
    await db.delete(orderSongAssets).where(eq(orderSongAssets.orderId, order.id));
    await db.delete(orderSongSpecs).where(eq(orderSongSpecs.orderId, order.id));

    const {
      computedTotal,
      songSpecRows,
      sourceAssetRows,
      deliverableAssetRows,
    } = await buildOrderUpgradeRows({
      order,
      config,
      mixingPricingData,
      masteringPricingData,
    });

    await db.insert(orderSongSpecs).values(songSpecRows);

    if (sourceAssetRows.length > 0) {
      await db.insert(orderSongAssets).values(sourceAssetRows);
    }

    if (deliverableAssetRows.length > 0) {
      await db.insert(orderSongAssets).values(deliverableAssetRows);
    }

    await updateOrderItemNames({ orderId: order.id, config });

    await db
      .update(orders)
      .set({
        updated_timestamp: new Date().toISOString(),
      })
      .where(eq(orders.id, order.id));

    results.push({
      orderId: order.id,
      userId: order.userId,
      checkoutSessionId: order.checkoutSessionId,
      workflowStatus: order.workflowStatus,
      dbTotal: order.total,
      computedQuoteTotal: computedTotal,
      songSpecCount: songSpecRows.length,
      sourceAssetCount: sourceAssetRows.length,
      deliverableAssetCount: deliverableAssetRows.length,
    });
  }

  const verification = await db
    .select({
      orderId: orders.id,
      checkoutSessionId: orders.checkoutSessionId,
      songSpecId: orderSongSpecs.id,
      requirements: orderSongSpecs.requirements,
    })
    .from(orders)
    .leftJoin(orderSongSpecs, eq(orderSongSpecs.orderId, orders.id))
    .where(inArray(orders.checkoutSessionId, checkoutSessionIds))
    .orderBy(asc(orders.ordered_timestamp), asc(orderSongSpecs.songIndex));

  const legacyRequirementRows = verification.filter((row) =>
    row.requirements?.includes("Legacy order:"),
  ).length;

  console.log(
    JSON.stringify(
      {
        upgradedCount: results.length,
        results,
        remainingLegacyRequirementRows: legacyRequirementRows,
      },
      null,
      2,
    ),
  );

  await client.close();
};

await main();
