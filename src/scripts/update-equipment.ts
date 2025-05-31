import { createClient, ResultSet, type Client } from "@libsql/client";
import { drizzle, } from "drizzle-orm/libsql";
import * as schema from "~/server/db/schema";
import Gear from '~/data/gear.json'
import { randomUUID } from "node:crypto";
import { SQLiteInsertBuilder } from "drizzle-orm/sqlite-core";
import { EquipmentItem } from "~/server/api/routers/equipment";

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

const client =
  globalForDb.client ?? createClient({ 
    url: process.env.TURSO_SQLITE_DB_DATABASE_URL ?? "", 
    authToken: process.env.TURSO_SQLITE_DB_TOKEN ?? "",
  });

const db = drizzle(client, { schema });

const updateEquipment = async () => {

  const updated = Gear.map(item => item.id ? item : {
    ...item,
    id: randomUUID()
  })
  
  const items = Gear.length;
  const updates: Array<Promise<ResultSet>> =[]

  for (const item of updated) {


    updates.push(
      db.insert(schema.equipmentItem)
      .values(item)
      .onConflictDoUpdate({
        target: schema.equipmentItem.id,
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