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

const ensureWishlistColumn = async ({ name, sql }) => {
  const columnInfo = await client.execute("PRAGMA table_info(`wishlist_gear_item`)");
  const hasColumn = columnInfo.rows.some((row) => row.name === name);

  if (hasColumn) {
    return false;
  }

  await client.execute(sql);
  return true;
};

const ensureIndex = async ({ name, sql }) => {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'index' AND name = '${name}'`,
  );

  if (result.rows.length > 0) {
    return false;
  }

  await client.execute(sql);
  return true;
};

try {
  const tableResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'wishlist_gear_item'",
  );
  const hasWishlistTable = tableResult.rows.length > 0;

  if (!hasWishlistTable) {
    await client.execute(`
      CREATE TABLE \`wishlist_gear_item\` (
        \`id\` text(255) PRIMARY KEY NOT NULL,
        \`name\` text(255) NOT NULL,
        \`description\` text(255) NOT NULL,
        \`type\` text(255) NOT NULL,
        \`group\` text(255) NOT NULL,
        \`status\` text NOT NULL DEFAULT 'watching',
        \`target_price\` real NOT NULL DEFAULT 0,
        \`quantity\` integer NOT NULL DEFAULT 1,
        \`manufacturer\` text(255) NOT NULL,
        \`notes\` text NOT NULL DEFAULT '',
        \`created_timestamp\` text NOT NULL,
        \`updated_timestamp\` text DEFAULT (current_timestamp)
      )
    `);
  }

  const addedColumns = [];

  if (
    hasWishlistTable &&
    (await ensureWishlistColumn({
      name: "status",
      sql: "ALTER TABLE `wishlist_gear_item` ADD COLUMN `status` text NOT NULL DEFAULT 'watching'",
    }))
  ) {
    addedColumns.push("status");
  }

  if (
    hasWishlistTable &&
    (await ensureWishlistColumn({
      name: "target_price",
      sql: "ALTER TABLE `wishlist_gear_item` ADD COLUMN `target_price` real NOT NULL DEFAULT 0",
    }))
  ) {
    addedColumns.push("target_price");
  }

  if (
    hasWishlistTable &&
    (await ensureWishlistColumn({
      name: "quantity",
      sql: "ALTER TABLE `wishlist_gear_item` ADD COLUMN `quantity` integer NOT NULL DEFAULT 1",
    }))
  ) {
    addedColumns.push("quantity");
  }

  if (
    hasWishlistTable &&
    (await ensureWishlistColumn({
      name: "notes",
      sql: "ALTER TABLE `wishlist_gear_item` ADD COLUMN `notes` text NOT NULL DEFAULT ''",
    }))
  ) {
    addedColumns.push("notes");
  }

  const createdNameIndex = await ensureIndex({
    name: "wishlist_gear_item_name_idx",
    sql: "CREATE INDEX `wishlist_gear_item_name_idx` ON `wishlist_gear_item` (`name`)",
  });
  const createdStatusIndex = await ensureIndex({
    name: "wishlist_gear_item_status_idx",
    sql: "CREATE INDEX `wishlist_gear_item_status_idx` ON `wishlist_gear_item` (`status`)",
  });
  const createdTypeIndex = await ensureIndex({
    name: "wishlist_gear_item_type_idx",
    sql: "CREATE INDEX `wishlist_gear_item_type_idx` ON `wishlist_gear_item` (`type`)",
  });
  const createdManufacturerIndex = await ensureIndex({
    name: "wishlist_gear_item_manufacturer_idx",
    sql: "CREATE INDEX `wishlist_gear_item_manufacturer_idx` ON `wishlist_gear_item` (`manufacturer`)",
  });

  console.log(
    `Wishlist gear schema ready. Created table: ${String(!hasWishlistTable)}. Added columns: ${addedColumns.length > 0 ? addedColumns.join(", ") : "none"}. Created name index: ${String(createdNameIndex)}. Created status index: ${String(createdStatusIndex)}. Created type index: ${String(createdTypeIndex)}. Created manufacturer index: ${String(createdManufacturerIndex)}.`,
  );
} finally {
  client.close();
}
