import { sql } from "drizzle-orm";
import {
  index,
  // int,
  // primaryKey,
  sqliteTableCreator,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";
// import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => name);

export const contactRequestor = createTable("contact_requestor", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name", { length: 255 }).notNull(),
  email: text("email", { length: 255 }).notNull(),
  phone: text("phone", { length: 64 }).notNull(),
  service: text("service", { length: 64 }).notNull(),
  sms_accepted: text("sms_accepted", { length: 64 }).notNull(),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
});

export const equipmentItem = createTable("equipment_item", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name", { length: 255 }).unique().notNull(),
  description: text("description", { length: 255 }).notNull(),
  type: text("type", { length: 255 }).notNull(),
  group: text("group", { length: 255 }).notNull(),
  status: text("status", {
    enum: ["active", "inactive", "out-of-order"],
  })
    .notNull()
    .default("active"),
  price: real("price").notNull().default(0),
  quantity: integer("quantity").notNull(),
  manufacturer: text("manufacturer", { length: 255 }).notNull(),
  location: text("location", { length: 255 }).notNull().default(""),
  serialNumber: text("serial_number", { length: 255 }).notNull().default(""),
  acquiredFrom: text("acquired_from", { length: 255 }).notNull().default(""),
  purchaseDate: text("purchase_date").notNull().default(""),
  purchaseSource: text("purchase_source", { length: 255 })
    .notNull()
    .default(""),
  referenceNumber: text("reference_number", { length: 255 })
    .notNull()
    .default(""),
  room: text("room", { length: 255 }).notNull().default(""),
  rack: text("rack", { length: 255 }).notNull().default(""),
  shelf: text("shelf", { length: 255 }).notNull().default(""),
  slot: text("slot", { length: 255 }).notNull().default(""),
  storageCase: text("storage_case", { length: 255 }).notNull().default(""),
  notes: text("notes").notNull().default(""),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const equipmentServiceLog = createTable(
  "equipment_service_log",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    equipmentItemId: text("equipment_item_id", { length: 255 })
      .notNull()
      .references(() => equipmentItem.id, { onDelete: "cascade" }),
    serviceType: text("service_type", { length: 255 }).notNull(),
    serviceDate: text("service_date").notNull(),
    warrantyUntil: text("warranty_until").notNull().default(""),
    notes: text("notes").notNull().default(""),
    createdTimestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedTimestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
  (table) => ({
    equipmentItemIdIdx: index("equipment_service_log_equipment_item_id_idx").on(
      table.equipmentItemId,
    ),
    serviceDateIdx: index("equipment_service_log_service_date_idx").on(
      table.serviceDate,
    ),
  }),
);

export const equipmentItemMediaAsset = createTable(
  "equipment_item_media_asset",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    equipmentItemId: text("equipment_item_id", { length: 255 })
      .notNull()
      .references(() => equipmentItem.id, { onDelete: "cascade" }),
    assetType: text("asset_type", {
      enum: ["photo", "document"],
    }).notNull(),
    fileName: text("file_name", { length: 255 }).notNull(),
    contentType: text("content_type", { length: 255 }).notNull(),
    byteSize: integer("byte_size").notNull(),
    storageUri: text("storage_uri").notNull().unique(),
    createdTimestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedTimestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
  (table) => ({
    equipmentItemIdIdx: index("equipment_item_media_asset_equipment_item_id_idx").on(
      table.equipmentItemId,
    ),
    assetTypeIdx: index("equipment_item_media_asset_asset_type_idx").on(
      table.assetType,
    ),
    fileNameIdx: index("equipment_item_media_asset_file_name_idx").on(
      table.fileName,
    ),
  }),
);

export const gearManifest = createTable(
  "gear_manifest",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    notes: text("notes").notNull().default(""),
    partCount: integer("part_count").notNull().default(1),
    created_timestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toString()),
    updated_timestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
  (table) => ({
    nameIdx: index("gear_manifest_name_idx").on(table.name),
    createdTimestampIdx: index("gear_manifest_created_timestamp_idx").on(
      table.created_timestamp,
    ),
  }),
);

export const gearManifestEntry = createTable(
  "gear_manifest_entry",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    manifestId: text("manifest_id", { length: 255 })
      .notNull()
      .references(() => gearManifest.id, { onDelete: "cascade" }),
    equipmentItemId: text("equipment_item_id", { length: 255 })
      .notNull()
      .references(() => equipmentItem.id),
    itemOrder: integer("item_order").notNull().default(0),
    itemName: text("item_name", { length: 255 }).notNull(),
    manufacturer: text("manufacturer", { length: 255 }).notNull(),
    type: text("type", { length: 255 }).notNull(),
    group: text("group", { length: 255 }).notNull(),
    quantity: integer("quantity").notNull().default(1),
    createdTimestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updatedTimestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
  (table) => ({
    manifestIdIdx: index("gear_manifest_entry_manifest_id_idx").on(
      table.manifestId,
    ),
    equipmentItemIdIdx: index("gear_manifest_entry_equipment_item_id_idx").on(
      table.equipmentItemId,
    ),
    itemOrderIdx: index("gear_manifest_entry_item_order_idx").on(table.itemOrder),
  }),
);

export const wishlistGearItem = createTable(
  "wishlist_gear_item",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    description: text("description", { length: 255 }).notNull(),
    type: text("type", { length: 255 }).notNull(),
    group: text("group", { length: 255 }).notNull(),
    status: text("status", {
      enum: ["researching", "watching", "ready-to-buy"],
    })
      .notNull()
      .default("watching"),
    targetPrice: real("target_price").notNull().default(0),
    quantity: integer("quantity").notNull().default(1),
    manufacturer: text("manufacturer", { length: 255 }).notNull(),
    notes: text("notes").notNull().default(""),
    created_timestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toString()),
    updated_timestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
  (table) => ({
    nameIdx: index("wishlist_gear_item_name_idx").on(table.name),
    statusIdx: index("wishlist_gear_item_status_idx").on(table.status),
    typeIdx: index("wishlist_gear_item_type_idx").on(table.type),
    manufacturerIdx: index("wishlist_gear_item_manufacturer_idx").on(
      table.manufacturer,
    ),
  }),
);

// Products table - base products like "song mix" and "high track count mix"
export const products = createTable("products", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull().default(0),
  productType: text("product_type", {
    enum: ["mixing", "mastering", "mixing-and-mastering"],
  }).notNull(),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

// Product options table - add-ons, delivery options, track fees, length fees
export const productOptions = createTable("product_options", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull().default(0),
  category: text("category", {
    enum: ["addon", "delivery", "track_fee", "length_fee"],
  }).notNull(),
  priceType: text("price_type", {
    enum: ["flat", "per_ten_tracks", "multiplier", "per_hour"],
  }).notNull(),
  productType: text("product_type", {
    enum: ["mixing", "mastering", "mixing-and-mastering"],
  }).notNull(),
  perCount: integer("per_count").notNull(),
  minThreshold: integer("min_threshold"),
  maxThreshold: integer("max_threshold"),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

// Discounts table - volume discounts, production deals, bundles
export const discounts = createTable("discounts", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  discountPercentage: real("discount_percentage").notNull(),
  category: text("category", {
    enum: [
      "volume",
      "option_volume",
      "production",
      "bundle",
      "delivery_bundle",
      "cart_bundle",
    ],
  }).notNull(),
  productType: text("product_type", {
    enum: ["mixing", "mastering", "mixing-and-mastering"],
  }).notNull(),
  minThreshold: integer("min_threshold"),
  maxThreshold: integer("max_threshold"),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const cart = createTable("cart", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id", { length: 255 }).notNull().unique(),
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull().default(0),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const cartItems = createTable("cart_items", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  cartId: text("cart_id")
    .notNull()
    .references(() => cart.id),
  name: text("name").notNull(),
  type: text("type", { enum: ["mixing", "mastering", "product"] }).notNull(),
  data: text("data"),
  price: real("price").notNull().default(0),
  quantity: integer("quantity").notNull().default(0),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const cartDiscounts = createTable("cart_discounts", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  percentage: real("percentage").notNull().default(0),
  amount: real("amount").notNull().default(0),
  count: integer("count").notNull().default(0),
  description: text("description").notNull(),
  items: text("items").notNull().default("[]"),
  cartId: text("cart_id")
    .notNull()
    .references(() => cart.id),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const orders = createTable("orders", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id", { length: 255 }).notNull(),
  checkoutSessionId: text("checkout_session_id", { length: 255 })
    .notNull()
    .unique(),
  paymentIntentId: text("payment_intent_id", { length: 255 }),
  customerEmail: text("customer_email", { length: 255 }),
  status: text("status", {
    enum: ["paid", "processing", "unpaid", "expired", "no-payment-required"],
  }).notNull(),
  workflowStatus: text("workflow_status", {
    enum: [
      "awaiting-files",
      "queued",
      "in-progress",
      "awaiting-feedback",
      "revision-in-progress",
      "completed",
      "on-hold",
      "cancelled",
    ],
  })
    .notNull()
    .default("awaiting-files"),
  paymentStatus: text("payment_status", {
    enum: ["paid", "unpaid", "no_payment_required"],
  })
    .notNull()
    .default("unpaid"),
  currency: text("currency", { length: 16 }).notNull().default("usd"),
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull().default(0),
  itemCount: integer("item_count").notNull().default(0),
  ordered_timestamp: text("ordered_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const orderItems = createTable("order_items", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  orderId: text("order_id", { length: 255 })
    .notNull()
    .references(() => orders.id),
  name: text("name").notNull(),
  quantity: integer("quantity").notNull().default(1),
  unitPrice: real("unit_price").notNull().default(0),
  totalPrice: real("total_price").notNull().default(0),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const orderSongSpecs = createTable("order_song_specs", {
  id: text("id", { length: 255 }).notNull().primaryKey(),
  orderId: text("order_id", { length: 255 })
    .notNull()
    .references(() => orders.id),
  sessionName: text("session_name").notNull(),
  songIndex: integer("song_index").notNull(),
  title: text("title").notNull(),
  serviceType: text("service_type", {
    enum: ["mixing", "mastering", "mixing-and-mastering", "studio-service"],
  }).notNull(),
  sourceType: text("source_type", {
    enum: ["mixing-tracks", "mastering-file", "mastering-stems"],
  }).notNull(),
  expectedDurationSeconds: real("expected_duration_seconds"),
  durationToleranceSeconds: real("duration_tolerance_seconds")
    .notNull()
    .default(2),
  expectedSourceCount: integer("expected_source_count"),
  expectedTrackCount: integer("expected_track_count"),
  expectedStemCount: integer("expected_stem_count"),
  allowedSampleRates: text("allowed_sample_rates").notNull().default("[]"),
  allowedBitDepths: text("allowed_bit_depths").notNull().default("[24,32,64]"),
  requirements: text("requirements").notNull().default("[]"),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const orderSongAssets = createTable("order_song_assets", {
  id: text("id", { length: 255 }).notNull().primaryKey(),
  orderId: text("order_id", { length: 255 })
    .notNull()
    .references(() => orders.id),
  songSpecId: text("song_spec_id", { length: 255 })
    .notNull()
    .references(() => orderSongSpecs.id),
  assetKind: text("asset_kind", {
    enum: ["source", "deliverable"],
  }).notNull(),
  validationStatus: text("validation_status", {
    enum: ["valid", "invalid"],
  })
    .notNull()
    .default("valid"),
  fileName: text("file_name").notNull(),
  originalRelativePath: text("original_relative_path"),
  publicPath: text("public_path").notNull(),
  mimeType: text("mime_type"),
  byteSize: integer("byte_size").notNull().default(0),
  durationSeconds: real("duration_seconds"),
  sampleRateHz: integer("sample_rate_hz"),
  bitDepth: integer("bit_depth"),
  channelCount: integer("channel_count"),
  validationMessages: text("validation_messages").notNull().default("[]"),
  uploaded_timestamp: text("uploaded_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

export const orderSubmissions = createTable(
  "submissions",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id", { length: 255 })
      .notNull()
      .references(() => orders.id),
    userId: text("user_id", { length: 255 }).notNull(),
    uploadBucketKey: text("upload_bucket_key", { length: 255 })
      .notNull()
      .unique(),
    downloadBucketKey: text("download_bucket_key", { length: 255 }).unique(),
    submittedAt: text("submitted_at").notNull(),
    created_timestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_timestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
  (table) => ({
    orderIdIdx: index("submissions_order_id_idx").on(table.orderId),
    userIdIdx: index("submissions_user_id_idx").on(table.userId),
    submittedAtIdx: index("submissions_submitted_at_idx").on(table.submittedAt),
  }),
);

export const orderArchiveDownloadSessions = createTable(
  "order_archive_download_sessions",
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    orderId: text("order_id", { length: 255 })
      .notNull()
      .references(() => orders.id),
    userId: text("user_id", { length: 255 }).notNull(),
    token: text("token", { length: 255 }).notNull().unique(),
    assetIds: text("asset_ids").notNull().default("[]"),
    expiresAt: text("expires_at").notNull(),
    revokedAt: text("revoked_at"),
    created_timestamp: text("created_timestamp")
      .notNull()
      .$defaultFn(() => new Date().toISOString()),
    updated_timestamp: text("updated_timestamp").default(
      sql`(current_timestamp)`,
    ),
  },
);

export const coupons = createTable("coupons", {
  id: text("id", { length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  code: text("code", { length: 64 }).notNull().unique(),
  couponType: text("coupon_type", {
    enum: ["flat", "percentage"],
  })
    .notNull()
    .default("flat"),
  amount: real("amount").notNull().default(0),
  redeemed: integer("redeemed", { mode: "boolean" })
    .notNull()
    .default(false),
  redeemedAt: text("redeemed_at"),
  redeemedByUserId: text("redeemed_by_user_id", { length: 255 }),
  created_timestamp: text("created_timestamp")
    .notNull()
    .$defaultFn(() => new Date().toISOString()),
  updated_timestamp: text("updated_timestamp").default(
    sql`(current_timestamp)`,
  ),
});

// Infer types from schema
export type Product = typeof products.$inferSelect;
export type ProductOption = typeof productOptions.$inferSelect;
export type Discount = typeof discounts.$inferSelect;
export type Cart = typeof cart.$inferSelect;
export type CartItem = typeof cartItems.$inferSelect;
export type CartDiscount = typeof cartDiscounts.$inferSelect;
export type Order = typeof orders.$inferSelect;
export type OrderItem = typeof orderItems.$inferSelect;
export type OrderSongSpec = typeof orderSongSpecs.$inferSelect;
export type OrderSongAsset = typeof orderSongAssets.$inferSelect;
export type OrderSubmission = typeof orderSubmissions.$inferSelect;
export type OrderArchiveDownloadSession =
  typeof orderArchiveDownloadSessions.$inferSelect;
export type Coupon = typeof coupons.$inferSelect;
