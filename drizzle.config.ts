import { type Config } from "drizzle-kit";

import { defineConfig } from 'drizzle-kit';

import { env } from "~/env";

export default defineConfig({
  out: './drizzle',
  schema: './src/server/db/schema.ts',
  driver: 'turso',
  dialect: 'sqlite',
  dbCredentials: {
    url: env.TURSO_SQLITE_DB_DATABASE_URL,
    authToken: env.TURSO_SQLITE_DB_TOKEN,
  },
});