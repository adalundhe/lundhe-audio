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

const ensureEquipmentColumn = async ({
  name,
  sql,
}) => {
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

try {
  const addedColumns = [];

  if (
    await ensureEquipmentColumn({
      name: "status",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `status` text NOT NULL DEFAULT 'active'",
    })
  ) {
    addedColumns.push("status");
  }

  if (
    await ensureEquipmentColumn({
      name: "location",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `location` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("location");
  }

  if (
    await ensureEquipmentColumn({
      name: "room",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `room` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("room");
  }

  if (
    await ensureEquipmentColumn({
      name: "rack",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `rack` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("rack");
  }

  if (
    await ensureEquipmentColumn({
      name: "shelf",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `shelf` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("shelf");
  }

  if (
    await ensureEquipmentColumn({
      name: "slot",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `slot` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("slot");
  }

  if (
    await ensureEquipmentColumn({
      name: "storage_case",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `storage_case` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("storage_case");
  }

  if (
    await ensureEquipmentColumn({
      name: "notes",
      sql: "ALTER TABLE `equipment_item` ADD COLUMN `notes` text NOT NULL DEFAULT ''",
    })
  ) {
    addedColumns.push("notes");
  }

  await client.execute(`
    UPDATE \`equipment_item\`
    SET \`location\` = trim(
      CASE
        WHEN trim(coalesce(\`location\`, '')) <> '' THEN trim(\`location\`)
        WHEN trim(coalesce(\`room\`, '')) <> '' THEN trim(\`room\`)
        WHEN trim(coalesce(\`rack\`, '')) <> '' THEN trim(\`rack\`)
        WHEN trim(coalesce(\`shelf\`, '')) <> '' THEN trim(\`shelf\`)
        WHEN trim(coalesce(\`slot\`, '')) <> '' THEN trim(\`slot\`)
        WHEN trim(coalesce(\`storage_case\`, '')) <> '' THEN trim(\`storage_case\`)
        ELSE ''
      END
    )
    WHERE trim(coalesce(\`location\`, '')) = ''
  `);

  const tableResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'equipment_service_log'",
  );
  const hasServiceLogTable = tableResult.rows.length > 0;

  if (!hasServiceLogTable) {
    await client.execute(`
      CREATE TABLE \`equipment_service_log\` (
        \`id\` text(255) PRIMARY KEY NOT NULL,
        \`equipment_item_id\` text(255) NOT NULL,
        \`service_type\` text(255) NOT NULL,
        \`service_date\` text NOT NULL,
        \`warranty_until\` text NOT NULL DEFAULT '',
        \`notes\` text NOT NULL DEFAULT '',
        \`created_timestamp\` text NOT NULL,
        \`updated_timestamp\` text DEFAULT (current_timestamp),
        FOREIGN KEY (\`equipment_item_id\`) REFERENCES \`equipment_item\`(\`id\`) ON DELETE CASCADE
      )
    `);
  }

  const createdItemIndex = await ensureIndex({
    name: "equipment_service_log_equipment_item_id_idx",
    sql: "CREATE INDEX `equipment_service_log_equipment_item_id_idx` ON `equipment_service_log` (`equipment_item_id`)",
  });
  const createdDateIndex = await ensureIndex({
    name: "equipment_service_log_service_date_idx",
    sql: "CREATE INDEX `equipment_service_log_service_date_idx` ON `equipment_service_log` (`service_date`)",
  });

  console.log(
    `Equipment detail schema ready. Added columns: ${addedColumns.length > 0 ? addedColumns.join(", ") : "none"}. Created service log table: ${String(!hasServiceLogTable)}. Created equipment index: ${String(createdItemIndex)}. Created service date index: ${String(createdDateIndex)}.`,
  );
} finally {
  client.close();
}
