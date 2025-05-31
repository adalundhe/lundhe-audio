import { createClient, type Client } from "@libsql/client";
import { drizzle, } from "drizzle-orm/libsql";
import * as schema from "~/server/db/schema";
import {writeFile} from 'fs/promises'
import { join } from 'path'

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

const dumpEquipment = async () => {

  const equipment = await db.select().from(schema.equipmentItem)
  const dataPath = join('src', 'data', 'gear.json')
  

  await writeFile(dataPath, JSON.stringify(equipment, null, 4))
    
}

await dumpEquipment()