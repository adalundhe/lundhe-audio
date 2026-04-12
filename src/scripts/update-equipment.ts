import { createClient, type ResultSet, type Client } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import Gear from '~/data/gear.json'
import { randomUUID } from "node:crypto";
import {
  // index,
  // int,
  // primaryKey,
  sqliteTableCreator,
  text,
  integer,
  real,
} from "drizzle-orm/sqlite-core";

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


export const createTable = sqliteTableCreator((name) => name);

const contactRequestor = createTable(
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

const equipmentItem = createTable(
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
    price: real("price").notNull().default(0),
    quantity: integer('quantity').notNull(),
    manufacturer: text("manufacturer", { length: 255 }).notNull(),
    created_timestamp: text('created_timestamp').notNull().$defaultFn(() => new Date().toString()),
    updated_timestamp: text('updated_timestamp')
  }
)

const client =
  globalForDb.client ?? createClient({ 
    url: process.env.TURSO_SQLITE_DB_DATABASE_URL ?? "", 
    authToken: process.env.TURSO_SQLITE_DB_TOKEN ?? "",
  });

const db = drizzle(client, { schema: {
  equipmentItem: equipmentItem,
  contactRequestor: contactRequestor,
} });

type LegacyGearItem = (typeof Gear)[number] & {
  price?: number;
  id?: string;
  created_timestamp?: string;
  updated_timestamp?: string;
};

const normalizeCurrency = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return 0;
  return Number(parsed.toFixed(2));
};

const updateEquipment = async () => {

  const created = new Date().toString()

  const updated = (Gear as LegacyGearItem[]).map(item => ({
    ...item,
    price: normalizeCurrency(item.price),
    id: item.id ?? randomUUID(),
    created_timestamp: item.created_timestamp ?? created,
    updated_timestamp: item.updated_timestamp ?? created,
  }))
  
  const items = Gear.length;
  const updates: Array<Promise<ResultSet>> =[]

  for (const item of updated) {


    updates.push(
      db.insert(equipmentItem)
      .values(item)
      .onConflictDoUpdate({
        target: equipmentItem.id,
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

await updateEquipment()
