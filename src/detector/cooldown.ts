import { sql, eq, lt } from "drizzle-orm";
import { db } from "../db/index.js";
import { alertCooldowns } from "../db/schema.js";

export async function isOnCooldown(key: string): Promise<boolean> {
  const rows = await db
    .select()
    .from(alertCooldowns)
    .where(eq(alertCooldowns.key, key))
    .limit(1);
  const row = rows[0];
  if (!row) return false;
  if (row.expiresAt.getTime() < Date.now()) {
    await db.delete(alertCooldowns).where(eq(alertCooldowns.key, key));
    return false;
  }
  return true;
}

export async function setCooldown(key: string, minutes: number): Promise<void> {
  const expiresAt = new Date(Date.now() + minutes * 60_000);
  await db
    .insert(alertCooldowns)
    .values({ key, expiresAt })
    .onConflictDoUpdate({ target: alertCooldowns.key, set: { expiresAt } });
}

export async function pruneExpired(): Promise<void> {
  await db.delete(alertCooldowns).where(lt(alertCooldowns.expiresAt, sql`NOW()`));
}
