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

const ensureEquipmentColumn = async ({ name, sql }) => {
  const columnInfo = await client.execute("PRAGMA table_info(`equipment_item`)");
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

const ensureTable = async ({ name, sql }) => {
  const result = await client.execute(
    `SELECT name FROM sqlite_master WHERE type = 'table' AND name = '${name}'`,
  );

  if (result.rows.length > 0) {
    return false;
  }

  await client.execute(sql);
  return true;
};

try {
  const addedColumns = [];

  if (
    await ensureEquipmentColumn({
      name: "serial_number",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `serial_number` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("serial_number");
  }

  if (
    await ensureEquipmentColumn({
      name: "acquired_from",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `acquired_from` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("acquired_from");
  }

  if (
    await ensureEquipmentColumn({
      name: "purchase_date",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `purchase_date` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("purchase_date");
  }

  if (
    await ensureEquipmentColumn({
      name: "purchase_source",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `purchase_source` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("purchase_source");
  }

  if (
    await ensureEquipmentColumn({
      name: "reference_number",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `reference_number` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("reference_number");
  }

  const createdMediaTable = await ensureTable({
    name: "equipment_item_media_asset",
    sql: `
      CREATE TABLE \`equipment_item_media_asset\` (
        \`id\` text(255) PRIMARY KEY NOT NULL,
        \`equipment_item_id\` text(255) NOT NULL,
        \`asset_type\` text NOT NULL,
        \`file_name\` text(255) NOT NULL,
        \`content_type\` text(255) NOT NULL,
        \`byte_size\` integer NOT NULL,
        \`storage_uri\` text NOT NULL UNIQUE,
        \`created_timestamp\` text NOT NULL,
        \`updated_timestamp\` text DEFAULT (current_timestamp),
        FOREIGN KEY (\`equipment_item_id\`) REFERENCES \`equipment_item\`(\`id\`) ON DELETE CASCADE
      )
    `,
  });

  const createdEquipmentItemIdIndex = await ensureIndex({
    name: "equipment_item_media_asset_equipment_item_id_idx",
    sql: "CREATE INDEX `equipment_item_media_asset_equipment_item_id_idx` ON `equipment_item_media_asset` (`equipment_item_id`)",
  });
  const createdAssetTypeIndex = await ensureIndex({
    name: "equipment_item_media_asset_asset_type_idx",
    sql: "CREATE INDEX `equipment_item_media_asset_asset_type_idx` ON `equipment_item_media_asset` (`asset_type`)",
  });
  const createdFileNameIndex = await ensureIndex({
    name: "equipment_item_media_asset_file_name_idx",
    sql: "CREATE INDEX `equipment_item_media_asset_file_name_idx` ON `equipment_item_media_asset` (`file_name`)",
  });

  console.log(
    `Gear media/ownership schema ready. Added columns: ${addedColumns.length > 0 ? addedColumns.join(", ") : "none"}. Created media table: ${String(createdMediaTable)}. Created equipment item id index: ${String(createdEquipmentItemIdIndex)}. Created asset type index: ${String(createdAssetTypeIndex)}. Created file name index: ${String(createdFileNameIndex)}.`,
  );
} finally {
  client.close();
}
