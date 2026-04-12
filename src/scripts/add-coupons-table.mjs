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
  const tableResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'coupons'",
  );
  const hasCouponsTable = tableResult.rows.length > 0;

  if (!hasCouponsTable) {
    await client.execute(`
      CREATE TABLE \`coupons\` (
        \`id\` text(255) PRIMARY KEY NOT NULL,
        \`code\` text(64) NOT NULL,
        \`coupon_type\` text NOT NULL DEFAULT 'flat',
        \`amount\` real NOT NULL DEFAULT 0,
        \`redeemed\` integer DEFAULT false NOT NULL,
        \`redeemed_at\` text,
        \`redeemed_by_user_id\` text(255),
        \`created_timestamp\` text NOT NULL,
        \`updated_timestamp\` text DEFAULT (current_timestamp)
      )
    `);
  }

  const columnInfo = await client.execute("PRAGMA table_info(`coupons`)");
  const hasCouponTypeColumn = columnInfo.rows.some(
    (row) => row.name === "coupon_type",
  );
  const hasAmountColumn = columnInfo.rows.some((row) => row.name === "amount");

  if (!hasCouponTypeColumn) {
    await client.execute(
      "ALTER TABLE `coupons` ADD COLUMN `coupon_type` text NOT NULL DEFAULT 'flat'",
    );
  }

  if (!hasAmountColumn) {
    await client.execute(
      "ALTER TABLE `coupons` ADD COLUMN `amount` real NOT NULL DEFAULT 0",
    );
  }

  const indexResult = await client.execute(
    "SELECT name FROM sqlite_master WHERE type = 'index' AND name = 'coupons_code_unique'",
  );
  const hasCodeIndex = indexResult.rows.length > 0;

  if (!hasCodeIndex) {
    await client.execute(
      "CREATE UNIQUE INDEX `coupons_code_unique` ON `coupons` (`code`)",
    );
  }

  console.log(
    `Coupons table ready. Created table: ${String(!hasCouponsTable)}. Added coupon_type: ${String(!hasCouponTypeColumn)}. Added amount: ${String(!hasAmountColumn)}. Created index: ${String(!hasCodeIndex)}.`,
  );
} finally {
  client.close();
}
