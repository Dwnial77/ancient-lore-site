import { eq, inArray, sql } from "drizzle-orm";
import { getDb, schema } from "@/db";
import { detectHeroes } from "./detect-heroes";
import { refreshHeroes } from "./heroes";
import { revalidatePublic } from "./revalidate";
import { fetchChannelVideos } from "./youtube";

export type SyncResult = {
  ok: boolean;
  videosTotal: number;
  videosNew: number;
  suggestions: number;
  heroesCount: number;
  error?: string;
};

export async function runSync(source: "manual" | "cron"): Promise<SyncResult> {
  const db = getDb();
  const [run] = await db.insert(schema.syncRuns).values({ source, status: "running" }).returning();
  const result: SyncResult = { ok: false, videosTotal: 0, videosNew: 0, suggestions: 0, heroesCount: 0 };

  try {
    // 1. Refresh the hero cache (non-fatal if OpenDota is down).
    try {
      result.heroesCount = await refreshHeroes();
    } catch (err) {
      console.error("[sync] hero refresh failed", err);
    }

    // 2. Fetch channel uploads.
    const channelId = process.env.YOUTUBE_CHANNEL_ID;
    if (!channelId) throw new Error("YOUTUBE_CHANNEL_ID is not set");
    const fetched = await fetchChannelVideos(channelId);
    result.videosTotal = fetched.length;

    const existing = new Set(
      (await db.select({ id: schema.videos.youtubeId }).from(schema.videos)).map((r) => r.id),
    );
    const fresh = fetched.filter((v) => !existing.has(v.youtubeId));
    result.videosNew = fresh.length;

    // 3. Upsert all videos (titles/thumbnails can change).
    for (let i = 0; i < fetched.length; i += 100) {
      const chunk = fetched.slice(i, i + 100);
      await db
        .insert(schema.videos)
        .values(chunk.map((v) => ({ ...v, updatedAt: new Date() })))
        .onConflictDoUpdate({
          target: schema.videos.youtubeId,
          set: {
            title: sql`excluded.title`,
            thumbnailUrl: sql`excluded.thumbnail_url`,
            publishedAt: sql`excluded.published_at`,
            durationSeconds: sql`excluded.duration_seconds`,
            updatedAt: sql`excluded.updated_at`,
          },
        });
    }

    // 4. Auto-suggest heroes for new videos, flagged for review.
    if (fresh.length > 0) {
      const heroes = await db
        .select({ id: schema.heroes.id, slug: schema.heroes.slug, name: schema.heroes.name })
        .from(schema.heroes);
      const suggestions = fresh.flatMap((v) =>
        detectHeroes(v.title, heroes).map((heroId) => ({
          videoId: v.youtubeId,
          heroId,
          role: "main" as const,
          needsReview: true,
        })),
      );
      if (suggestions.length > 0) {
        await db.insert(schema.appearances).values(suggestions).onConflictDoNothing();
      }
      result.suggestions = suggestions.length;
    }

    result.ok = true;
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
    console.error("[sync] failed", err);
  }

  await db
    .update(schema.syncRuns)
    .set({
      status: result.ok ? "ok" : "error",
      videosTotal: result.videosTotal,
      videosNew: result.videosNew,
      suggestions: result.suggestions,
      heroesCount: result.heroesCount,
      error: result.error ?? null,
      finishedAt: new Date(),
    })
    .where(eq(schema.syncRuns.id, run.id));

  // Titles/thumbnails may have changed anywhere, so refresh every public page.
  revalidatePublic();
  return result;
}

export async function heroSlugsForIds(ids: number[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select({ slug: schema.heroes.slug })
    .from(schema.heroes)
    .where(inArray(schema.heroes.id, ids));
  return rows.map((r) => r.slug);
}
