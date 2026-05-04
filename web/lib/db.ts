import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "../../src/db/schema";

let _db: ReturnType<typeof drizzle> | null = null;

function getDb() {
  if (_db) return _db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set — see .env.example");
  const queryClient = postgres(url, {
    max: 5,
    prepare: false,
    ssl: url.includes("sslmode=require") ? "require" : undefined,
  });
  _db = drizzle(queryClient, { schema });
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    const inner = getDb();
    const value = (inner as unknown as Record<string | symbol, unknown>)[prop as string];
    return typeof value === "function" ? value.bind(inner) : value;
  },
});

export { schema };
export * from "../../src/db/schema";
