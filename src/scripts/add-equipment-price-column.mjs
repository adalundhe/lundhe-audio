import { createClient } from "@libsql/client";

const url = process.env.TURSO_SQLITE_DB_DATABASE_URL;
const authToken = process.env.TURSO_SQLITE_DB_TOKEN;

if (!url) {
  throw new Error("Missing TURSO_SQLITE_DB_DATABASE_URL");
}

if (!authToken) {
  throw new Error("Missing TURSO_SQLITE_DB_TOKEN");
}

const client = createClient({ url, authToken });

try {
  const columnInfo = await client.execute("PRAGMA table_info(`equipment_item`)");
  const hasPriceColumn = columnInfo.rows.some((row) => row.name === "price");

  if (hasPriceColumn) {
    console.log("equipment_item.price already exists. Nothing to do.");
    process.exit(0);
  }

  const countResult = await client.execute(
    "SELECT COUNT(*) AS count FROM `equipment_item`",
  );
  const existingRows = Number(countResult.rows[0]?.count ?? 0);

  await client.execute(
    "ALTER TABLE `equipment_item` ADD COLUMN `price` real DEFAULT 0 NOT NULL",
  );

  const updatedColumnInfo = await client.execute("PRAGMA table_info(`equipment_item`)");
  const priceColumn = updatedColumnInfo.rows.find((row) => row.name === "price");

  if (!priceColumn) {
    throw new Error("equipment_item.price was not added successfully");
  }

  console.log(
    `Added equipment_item.price with DEFAULT ${String(priceColumn.dflt_value ?? 0)} and preserved ${existingRows} existing rows.`,
  );
} finally {
  client.close();
}
