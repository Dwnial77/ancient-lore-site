import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { roleEnum, type Role } from "@/db/schema";
import { heroSlugsForIds } from "@/lib/heroes";
import { revalidateHeroes } from "@/lib/revalidate";

type Item = { heroId: number; role: Role; note: string | null; needsReview: boolean };
type TopicItem = { topicId: number; needsReview: boolean };

function parseItems(input: unknown): Item[] | null {
  if (!Array.isArray(input)) return null;
  const items: Item[] = [];
  const seen = new Set<number>();
  for (const raw of input) {
    const r = raw as Record<string, unknown>;
    const heroId = Number(r.heroId);
    const role = r.role as Role;
    if (!Number.isInteger(heroId) || !roleEnum.enumValues.includes(role) || seen.has(heroId)) return null;
    seen.add(heroId);
    const note = typeof r.note === "string" && r.note.trim() ? r.note.trim().slice(0, 200) : null;
    items.push({ heroId, role, note, needsReview: r.needsReview === true });
  }
  return items;
}

function parseTopics(input: unknown): TopicItem[] | null {
  if (input === undefined) return [];
  if (!Array.isArray(input)) return null;
  const items: TopicItem[] = [];
  const seen = new Set<number>();
  for (const raw of input) {
    const r = raw as Record<string, unknown>;
    const topicId = Number(r.topicId);
    if (!Number.isInteger(topicId) || seen.has(topicId)) return null;
    seen.add(topicId);
    items.push({ topicId, needsReview: r.needsReview === true });
  }
  return items;
}

async function topicSlugsForIds(ids: number[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await getDb()
    .select({ slug: schema.topics.slug })
    .from(schema.topics)
    .where(inArray(schema.topics.id, ids));
  return rows.map((r) => r.slug);
}

/** Replace the full hero + topic list of one video. Body: { videoId, items: Item[], topics: TopicItem[] } */
export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as
    | { videoId?: unknown; items?: unknown; topics?: unknown }
    | null;
  const videoId = typeof body?.videoId === "string" ? body.videoId : "";
  const items = parseItems(body?.items);
  const topicItems = parseTopics(body?.topics);
  if (!videoId || !items || !topicItems) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const db = getDb();
  const [video] = await db
    .select({ id: schema.videos.youtubeId })
    .from(schema.videos)
    .where(eq(schema.videos.youtubeId, videoId))
    .limit(1);
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const [beforeHeroes, beforeTopics] = await Promise.all([
    db
      .select({ heroId: schema.appearances.heroId })
      .from(schema.appearances)
      .where(eq(schema.appearances.videoId, videoId)),
    db
      .select({ topicId: schema.videoTopics.topicId })
      .from(schema.videoTopics)
      .where(eq(schema.videoTopics.videoId, videoId)),
  ]);

  // Heroes
  const keepIds = items.map((i) => i.heroId);
  await db
    .delete(schema.appearances)
    .where(
      keepIds.length
        ? and(eq(schema.appearances.videoId, videoId), notInArray(schema.appearances.heroId, keepIds))
        : eq(schema.appearances.videoId, videoId),
    );
  if (items.length) {
    const valid = new Set(
      (await db.select({ id: schema.heroes.id }).from(schema.heroes).where(inArray(schema.heroes.id, keepIds))).map(
        (v) => v.id,
      ),
    );
    const rows = items.filter((i) => valid.has(i.heroId)).map((i) => ({ ...i, videoId }));
    if (rows.length) {
      await db
        .insert(schema.appearances)
        .values(rows)
        .onConflictDoUpdate({
          target: [schema.appearances.videoId, schema.appearances.heroId],
          set: {
            role: sql`excluded.role`,
            note: sql`excluded.note`,
            needsReview: sql`excluded.needs_review`,
          },
        });
    }
  }

  // Topics
  const keepTopicIds = topicItems.map((t) => t.topicId);
  await db
    .delete(schema.videoTopics)
    .where(
      keepTopicIds.length
        ? and(eq(schema.videoTopics.videoId, videoId), notInArray(schema.videoTopics.topicId, keepTopicIds))
        : eq(schema.videoTopics.videoId, videoId),
    );
  if (topicItems.length) {
    const valid = new Set(
      (
        await db.select({ id: schema.topics.id }).from(schema.topics).where(inArray(schema.topics.id, keepTopicIds))
      ).map((v) => v.id),
    );
    const rows = topicItems.filter((t) => valid.has(t.topicId)).map((t) => ({ ...t, videoId }));
    if (rows.length) {
      await db
        .insert(schema.videoTopics)
        .values(rows)
        .onConflictDoUpdate({
          target: [schema.videoTopics.videoId, schema.videoTopics.topicId],
          set: { needsReview: sql`excluded.needs_review` },
        });
    }
  }

  const touchedHeroes = [...new Set([...beforeHeroes.map((b) => b.heroId), ...keepIds])];
  const touchedTopics = [...new Set([...beforeTopics.map((b) => b.topicId), ...keepTopicIds])];
  const [heroSlugs, topicSlugs] = await Promise.all([heroSlugsForIds(touchedHeroes), topicSlugsForIds(touchedTopics)]);
  revalidateHeroes(heroSlugs, topicSlugs);
  return NextResponse.json({ ok: true });
}
