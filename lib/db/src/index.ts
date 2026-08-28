import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema";

const { Pool } = pg;

type Database = NodePgDatabase<typeof schema>;

let realPool: pg.Pool | undefined;
let realDb: Database | undefined;

/**
 * Created on first use, never at import time. The api-server must be able to
 * load (and start listening) on the very first publish, which happens before
 * Replit provisions the production database; an import-time throw here would
 * crash boot and make publishing impossible. Callers see the missing-database
 * error on first query instead.
 */
function requireDb(): Database {
  if (!realDb) {
    if (!process.env.DATABASE_URL) {
      throw new Error(
        "DATABASE_URL must be set. Did you forget to provision a database?",
      );
    }
    realPool = new Pool({ connectionString: process.env.DATABASE_URL });
    realDb = drizzle(realPool, { schema });
  }
  return realDb;
}

function lazyProxy<T extends object>(resolve: () => T): T {
  return new Proxy({} as T, {
    get(_target, prop) {
      const real = resolve();
      const value = (real as Record<PropertyKey, unknown>)[prop];
      return typeof value === "function" ? value.bind(real) : value;
    },
  });
}

export const db: Database = lazyProxy(requireDb);
export const pool: pg.Pool = lazyProxy(() => {
  requireDb();
  return realPool as pg.Pool;
});

/**
 * Idempotent DDL mirroring ./schema/newsletter.ts, so a fresh production
 * database (provisioned during the first successful publish) gets the
 * newsletter tables without a manual drizzle-kit push. Keep in sync with the
 * Drizzle schema when it changes.
 */
const NEWSLETTER_DDL = `
create table if not exists newsletter_subscribers (
  id serial primary key,
  email text not null unique,
  first_name text not null default '',
  status text not null default 'active',
  unsubscribe_token text not null unique,
  created_at timestamp with time zone not null default now()
);
create table if not exists newsletter_issues (
  id serial primary key,
  subject text not null,
  body text not null,
  content_hash text not null,
  recipient_count integer not null,
  failed_count integer not null default 0,
  sent_at timestamp with time zone not null default now()
);
`;

export async function ensureNewsletterSchema(): Promise<void> {
  await pool.query(NEWSLETTER_DDL);
}

export * from "./schema";
