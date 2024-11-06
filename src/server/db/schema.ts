// import { relations, sql } from "drizzle-orm";
import {
  // index,
  // int,
  // primaryKey,
  sqliteTableCreator,
  text,
} from "drizzle-orm/sqlite-core";
// import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = sqliteTableCreator((name) => name);

export const contactRequestor = createTable(
  'ContactRequestor',
  {
    id: text("id", { length: 255 })
      .notNull()
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    name: text("name", { length: 255 }).notNull(),
    email: text("email", { length: 255 }).notNull(),
    phone: text("phone", { length: 64 }).notNull(),
    service: text("service", { length: 64 }).notNull(),
    sms_accepted: text('sms_accepted', { length: 64 }).notNull(),
    created_timestamp: text('created_timestamp').notNull(),
  }
)