import { createClient, type Client } from "@libsql/client";
import { drizzle, } from "drizzle-orm/libsql";
import {writeFile} from 'fs/promises'
import { join } from 'path'
// import { relations, sql } from "drizzle-orm";
import {
  // index,
  // int,
  // primaryKey,
  sqliteTableCreator,
  text,
  integer,
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

const contactRequestor = createTable(
  'ContactRequestor',
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
  'EquipmentItem',
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

const dumpEquipment = async () => {

  const equipment = await db.select().from(equipmentItem)
  const dataPath = join('src', 'data', 'gear.json')
  

  await writeFile(dataPath, JSON.stringify(equipment, null, 4))
    
}

await dumpEquipment()