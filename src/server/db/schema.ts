import { sql } from "drizzle-orm";
import {
  // index,
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

export const contactRequestor = createTable(
  'contact_requestor',
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    phone: text("phone", { length: 64 }).notNull(),
    service: text("service", { length: 64 }).notNull(),
    sms_accepted: text('sms_accepted', { length: 64 }).notNull(),
    created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  }
)

export const equipmentItem = createTable(
  'equipment_item',
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).unique().notNull(),
    description: text("description", { length: 255 }).notNull(),
    type: text("type", { length: 255 }).notNull(),
    group: text("group", { length: 255 }).notNull(),
    quantity: integer('quantity').notNull(),
    manufacturer: text("manufacturer", { length: 255 }).notNull(),
    created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
    updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
  }
)

// Products table - base products like "song mix" and "high track count mix"
export const products = createTable("products", {
  id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  productType: text("product_type", { enum: ["mixing", "mastering", "mixing-and-mastering"]}).notNull(),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
})

// Product options table - add-ons, delivery options, track fees, length fees
export const productOptions = createTable("product_options", {
  id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  category: text("category", { enum: ["addon", "delivery", "track_fee", "length_fee"] }).notNull(),
  priceType: text("price_type", { enum: ["flat", "per_ten_tracks", "multiplier", "per_hour"] }).notNull(),
  productType: text("product_type", { enum: ["mixing", "mastering", "mixing-and-mastering"]}).notNull(),
  perCount: integer("per_count").notNull(),
  minThreshold: integer("min_threshold"),
  maxThreshold: integer("max_threshold"),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
})

// Discounts table - volume discounts, production deals, bundles
export const discounts = createTable("discounts", {
  id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  discountPercentage: real("discount_percentage").notNull(),
  category: text("category", { enum: ["volume", "option_volume", "production", "bundle", "delivery_bundle", "cart_bundle"] }).notNull(),
  productType: text("product_type", { enum: ["mixing", "mastering", "mixing-and-mastering"]}).notNull(),
  minThreshold: integer("min_threshold"),
  maxThreshold: integer("max_threshold"),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
})


export const cart = createTable("cart", {
  id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id", { length: 255 })
      .notNull()
      .unique(),
  subtotal: real("subtotal").notNull().default(0),
  discount: real("discount").notNull().default(0),
  total: real("total").notNull().default(0),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
})

export const cartItems = createTable("cart_items", {
  id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
  cartId: text("cart_id").notNull().references(() => cart.id),
  name: text("name").notNull(),
  type: text('type', { enum: ["mixing", 'mastering', "product"]  }).notNull(),
  data: text('data'),
  price: real("price").notNull(),
  quantity: integer("quantity").notNull().default(0),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
})

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
  cartId: text("cart_id").notNull().references(() => cart.id),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp').default(sql`(current_timestamp)`),
})


// Infer types from schema
export type Product = typeof products.$inferSelect
export type ProductOption = typeof productOptions.$inferSelect
export type Discount = typeof discounts.$inferSelect
export type Cart = typeof cart.$inferSelect
export type CartItem = typeof cartItems.$inferSelect
export type CartDiscount = typeof cartItems.$inferSelect