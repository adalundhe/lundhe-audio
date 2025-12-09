import { defineConfig } from 'drizzle-kit';


export default defineConfig({
  out: './drizzle',
  schema: './src/server/db/schema.ts',
  driver: 'turso',
  dialect: 'sqlite',
  dbCredentials: {
    url: process.env.TURSO_SQLITE_DB_DATABASE_URL ?? "",
    authToken: process.env.TURSO_SQLITE_DB_TOKEN ?? "",
  },
});