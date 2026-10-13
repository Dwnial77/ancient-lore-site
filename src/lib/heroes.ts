import { sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { fetchOpenDotaHeroes } from "./opendota";

/** Pull the hero list from OpenDota and upsert it into the heroes table. */
export async function refreshHeroes(): Promise<number> {
  const rows = await fetchOpenDotaHeroes();
  if (rows.length === 0) return 0;
  const db = getDb();
  await db
    .insert(schema.heroes)
    .values(rows.map((r) => ({ ...r, updatedAt: new Date() })))
    .onConflictDoUpdate({
      target: schema.heroes.id,
      set: {
        slug: sql`excluded.slug`,
        name: sql`excluded.name`,
        attribute: sql`excluded.attribute`,
        imageUrl: sql`excluded.image_url`,
        iconUrl: sql`excluded.icon_url`,
        updatedAt: sql`excluded.updated_at`,
      },
    });
  return rows.length;
}

/** Seed the hero cache on first use so a fresh deployment works before the first sync. */
export async function ensureHeroes(): Promise<void> {
  const db = getDb();
  const [{ count }] = await db.select({ count: sql<number>`count(*)::int` }).from(schema.heroes);
  if (count === 0) {
    try {
      await refreshHeroes();
    } catch (err) {
      console.error("[heroes] initial OpenDota fetch failed", err);
    }
  }
}
