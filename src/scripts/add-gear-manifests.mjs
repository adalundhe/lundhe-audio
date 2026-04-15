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

const ensureManifestColumn = async ({ name, sql }) => {
  const columnInfo = await client.execute("PRAGMA table_info(`gear_manifest`)");
  const hasColumn = columnInfo.rows.some((row) => row.name === name);

  if (hasColumn) {
    return false;
  }

  await client.execute(sql);
  return true;
};

try {
  const createdManifestTable = await ensureTable({
    name: "gear_manifest",
    sql: `
      CREATE TABLE \`gear_manifest\` (
        \`id\` text(255) PRIMARY KEY NOT NULL,
        \`name\` text(255) NOT NULL,
        \`notes\` text NOT NULL DEFAULT '',
        \`part_count\` integer NOT NULL DEFAULT 1,
        \`created_timestamp\` text NOT NULL,
        \`updated_timestamp\` text DEFAULT (current_timestamp)
      )
    `,
  });

  const addedManifestColumns = [];

  if (
    !createdManifestTable &&
    (await ensureManifestColumn({
      name: "notes",
      sql: "ALTER TABLE `gear_manifest` ADD COLUMN `notes` text NOT NULL DEFAULT ''",
    }))
  ) {
    addedManifestColumns.push("notes");
  }

  if (
    !createdManifestTable &&
    (await ensureManifestColumn({
      name: "part_count",
      sql: "ALTER TABLE `gear_manifest` ADD COLUMN `part_count` integer NOT NULL DEFAULT 1",
    }))
  ) {
    addedManifestColumns.push("part_count");
  }

  const createdManifestEntryTable = await ensureTable({
    name: "gear_manifest_entry",
    sql: `
      CREATE TABLE \`gear_manifest_entry\` (
        \`id\` text(255) PRIMARY KEY NOT NULL,
        \`manifest_id\` text(255) NOT NULL,
        \`equipment_item_id\` text(255) NOT NULL,
        \`item_order\` integer NOT NULL DEFAULT 0,
        \`item_name\` text(255) NOT NULL,
        \`manufacturer\` text(255) NOT NULL,
        \`type\` text(255) NOT NULL,
        \`group\` text(255) NOT NULL,
        \`quantity\` integer NOT NULL DEFAULT 1,
        \`created_timestamp\` text NOT NULL,
        \`updated_timestamp\` text DEFAULT (current_timestamp),
        FOREIGN KEY (\`manifest_id\`) REFERENCES \`gear_manifest\`(\`id\`) ON DELETE CASCADE,
        FOREIGN KEY (\`equipment_item_id\`) REFERENCES \`equipment_item\`(\`id\`)
      )
    `,
  });

  const createdManifestNameIndex = await ensureIndex({
    name: "gear_manifest_name_idx",
    sql: "CREATE INDEX `gear_manifest_name_idx` ON `gear_manifest` (`name`)",
  });
  const createdManifestCreatedIndex = await ensureIndex({
    name: "gear_manifest_created_timestamp_idx",
    sql: "CREATE INDEX `gear_manifest_created_timestamp_idx` ON `gear_manifest` (`created_timestamp`)",
  });
  const createdManifestEntryManifestIndex = await ensureIndex({
    name: "gear_manifest_entry_manifest_id_idx",
    sql: "CREATE INDEX `gear_manifest_entry_manifest_id_idx` ON `gear_manifest_entry` (`manifest_id`)",
  });
  const createdManifestEntryEquipmentIndex = await ensureIndex({
    name: "gear_manifest_entry_equipment_item_id_idx",
    sql: "CREATE INDEX `gear_manifest_entry_equipment_item_id_idx` ON `gear_manifest_entry` (`equipment_item_id`)",
  });
  const createdManifestEntryOrderIndex = await ensureIndex({
    name: "gear_manifest_entry_item_order_idx",
    sql: "CREATE INDEX `gear_manifest_entry_item_order_idx` ON `gear_manifest_entry` (`item_order`)",
  });

  console.log(
    `Gear manifest schema ready. Created manifest table: ${String(createdManifestTable)}. Added manifest columns: ${addedManifestColumns.length > 0 ? addedManifestColumns.join(", ") : "none"}. Created manifest entry table: ${String(createdManifestEntryTable)}. Created manifest name index: ${String(createdManifestNameIndex)}. Created manifest created index: ${String(createdManifestCreatedIndex)}. Created manifest entry manifest index: ${String(createdManifestEntryManifestIndex)}. Created manifest entry equipment index: ${String(createdManifestEntryEquipmentIndex)}. Created manifest entry order index: ${String(createdManifestEntryOrderIndex)}.`,
  );
} finally {
  client.close();
}
