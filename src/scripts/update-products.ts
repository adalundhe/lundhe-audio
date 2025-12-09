import { createClient, type ResultSet, type Client } from "@libsql/client";
import { drizzle, } from "drizzle-orm/libsql";
import Products from '~/data/mixing/products.json'
import ProductOptions from '~/data/mixing/product-options.json'
import Discounts from '~/data/mixing/discounts.json'
import { randomUUID } from "node:crypto";
// import { relations, sql } from "drizzle-orm";
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

/**
 * This is a silly little NodeJS script to populate the Gear table in the DB
 * via upsert. It's not using any of the nice typesafe env things Theo
 * has provided because we only want a slice of the envars here and
 * if they don't exist we can let this fail.
 * 
 */

const globalForDb = globalThis as unknown as {
  client: Client | undefined;
};

// Products table - base products like "song mix" and "high track count mix"
export const products = createTable("products", {
  id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
  name: text("name").notNull(),
  description: text("description"),
  price: real("price").notNull(),
  productType: text("productType", { enum: ["mixing", "mastering"]}).notNull(),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp')
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
  minThreshold: integer("min_threshold"),
  maxThreshold: integer("max_threshold"),
  productType: text("productType", { enum: ["mixing", "mastering"]}).notNull(),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp')
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
  category: text("category", { enum: ["volume", "option_volume", "production", "bundle"] }).notNull(),
  minThreshold: integer("min_threshold"),
  maxThreshold: integer("max_threshold"),
  productType: text("productType", { enum: ["mixing", "mastering"]}).notNull(),
  created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
  updated_timestamp: text('updated_timestamp')
})


export type ProductRecord = typeof products.$inferSelect
export type ProductOptionRecord = typeof productOptions.$inferSelect
export type DiscountRecord = typeof discounts.$inferSelect

const client =
  globalForDb.client ?? createClient({ 
    url: process.env.TURSO_SQLITE_DB_DATABASE_URL ?? "", 
    authToken: process.env.TURSO_SQLITE_DB_TOKEN ?? "",
  });

const db = drizzle(client, { schema: {
    products,
    productOptions,
    discounts,
} });

const updateMixProducts = async () => {


  const created = new Date().toString()

  const updated = Products.map(item => item.id ? item : {
    ...item,
    id: randomUUID(),
    created_timestamp: created,
    updated_timestamp: created,
  }) as ProductRecord[]

  const items = Products.length;
  const updates: Array<Promise<ResultSet>> =[]


   for (const item of updated) {


    updates.push(
      db.insert(products)
      .values(item)
      .onConflictDoUpdate({
        target: products.id,
        set: {
          ...item,
          updated_timestamp: new Date().toString()
        }
      })
    )
  }

  await Promise.allSettled(updates)
  let inserted = 1;
  for (const item of updated) {

    console.log(`Updated: ${item.name} - ${inserted}/${items}`)
    inserted += 1
  }
    
}

const updateMixProductOptions = async () => {


  const created = new Date().toString()

  const updated = ProductOptions.map(item => item.id ? item : {
    ...item,
    id: randomUUID(),
    created_timestamp: created,
    updated_timestamp: created,
  }) as ProductOptionRecord[]

  const items = ProductOptions.length;
  const updates: Array<Promise<ResultSet>> =[]


   for (const item of updated) {


    updates.push(
      db.insert(productOptions)
      .values(item)
      .onConflictDoUpdate({
        target: productOptions.id,
        set: {
          ...item,
          updated_timestamp: new Date().toString()
        }
      })
    )
  }

  await Promise.allSettled(updates)
  let inserted = 1;
  for (const item of updated) {

    console.log(`Updated: ${item.name} - ${inserted}/${items}`)
    inserted += 1
  }
    
}

const updateMixDiscounts = async () => {

  const created = new Date().toString()

  const updated = Discounts.map(item => item.id ? item : {
    ...item,
    id: randomUUID(),
    created_timestamp: created,
    updated_timestamp: created,
  }) as DiscountRecord[]

  const items = Discounts.length;
  const updates: Array<Promise<ResultSet>> =[]


   for (const item of updated) {


    updates.push(
      db.insert(discounts)
      .values(item)
      .onConflictDoUpdate({
        target: discounts.id,
        set: {
          ...item,
          updated_timestamp: new Date().toString()
        }
      })
    )
  }

  await Promise.allSettled(updates)
  let inserted = 1;
  for (const item of updated) {

    console.log(`Updated: ${item.name} - ${inserted}/${items}`)
    inserted += 1
  }
}


const updateProducts = async () => {
  await Promise.allSettled([
    updateMixProducts(),
    updateMixProductOptions(),
    updateMixDiscounts(),
  ])
}

await updateProducts()