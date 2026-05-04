import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { env } from "../lib/env.js";
import * as schema from "./schema.js";

const queryClient = postgres(env.DATABASE_URL, {
  max: 10,
  prepare: false,
  ssl: env.DATABASE_URL.includes("sslmode=require") ? "require" : undefined,
});

export const db = drizzle(queryClient, { schema });
export { schema };
export * from "./schema.js";
export type DB = typeof db;
