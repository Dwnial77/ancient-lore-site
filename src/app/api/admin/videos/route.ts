import { eq, inArray } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { detectHeroes } from "@/lib/detect-heroes";
import { ensureHeroes } from "@/lib/heroes";
import { revalidatePublic } from "@/lib/revalidate";
import { lookupVideo, parseYouTubeId } from "@/lib/youtube";

export const maxDuration = 60;

export type AddVideoResult = {
  input: string;
  status: "added" | "exists" | "invalid" | "not_found";
  title?: string;
  suggestions?: number;
  incomplete?: boolean;
};

/** Add videos by link. Body: { urls: string[] } */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { urls?: unknown } | null;
  const urls = Array.isArray(body?.urls)
    ? body.urls.filter((u): u is string => typeof u === "string" && u.trim() !== "").slice(0, 50)
    : [];
  if (urls.length === 0) return NextResponse.json({ error: "Paste at least one YouTube link" }, { status: 400 });

  const db = getDb();
  await ensureHeroes();
  const [heroes, topics] = await Promise.all([
    db.select({ id: schema.heroes.id, slug: schema.heroes.slug, name: schema.heroes.name }).from(schema.heroes),
    db.select({ id: schema.topics.id, slug: schema.topics.slug, name: schema.topics.name }).from(schema.topics),
  ]);

  const parsed = urls.map((input) => ({ input: input.trim(), id: parseYouTubeId(input) }));
  const ids = parsed.map((p) => p.id).filter((id): id is string => Boolean(id));
  const existing = new Set(
    ids.length
      ? (
          await db
            .select({ id: schema.videos.youtubeId })
            .from(schema.videos)
            .where(inArray(schema.videos.youtubeId, ids))
        ).map((r) => r.id)
      : [],
  );

  const results: AddVideoResult[] = [];
  for (const { input, id } of parsed) {
    if (!id) {
      results.push({ input, status: "invalid" });
      continue;
    }
    if (existing.has(id)) {
      results.push({ input, status: "exists" });
      continue;
    }
    existing.add(id); // ignore duplicates within the same paste

    const info = await lookupVideo(id);
    if (!info) {
      results.push({ input, status: "not_found" });
      continue;
    }
    await db
      .insert(schema.videos)
      .values({
        youtubeId: id,
        title: info.title,
        thumbnailUrl: info.thumbnailUrl,
        publishedAt: info.publishedAt ?? new Date(),
        durationSeconds: info.durationSeconds ?? 0,
      })
      .onConflictDoNothing();

    const suggested = detectHeroes(info.title, heroes);
    if (suggested.length) {
      await db
        .insert(schema.appearances)
        .values(suggested.map((heroId) => ({ videoId: id, heroId, role: "main" as const, needsReview: true })))
        .onConflictDoNothing();
    }
    // Topic names work with the same matcher, e.g. "What If" or "Roshan".
    const suggestedTopics = detectHeroes(info.title, topics);
    if (suggestedTopics.length) {
      await db
        .insert(schema.videoTopics)
        .values(suggestedTopics.map((topicId) => ({ videoId: id, topicId, needsReview: true })))
        .onConflictDoNothing();
    }
    results.push({
      input,
      status: "added",
      title: info.title,
      suggestions: suggested.length + suggestedTopics.length,
      incomplete: !info.publishedAt || !info.durationSeconds,
    });
  }

  if (results.some((r) => r.status === "added")) revalidatePublic();
  return NextResponse.json({ results });
}

/** Edit details. Body: { videoId, title, publishedAt: "YYYY-MM-DD", durationSeconds } */
export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const videoId = typeof body?.videoId === "string" ? body.videoId : "";
  const title = typeof body?.title === "string" ? body.title.trim().slice(0, 300) : "";
  const publishedAt = typeof body?.publishedAt === "string" ? new Date(body.publishedAt) : null;
  const durationSeconds = Number(body?.durationSeconds);
  if (
    !videoId ||
    !title ||
    !publishedAt ||
    Number.isNaN(publishedAt.getTime()) ||
    !Number.isInteger(durationSeconds) ||
    durationSeconds < 0
  ) {
    return NextResponse.json({ error: "Invalid details" }, { status: 400 });
  }

  const updated = await getDb()
    .update(schema.videos)
    .set({ title, publishedAt, durationSeconds, updatedAt: new Date() })
    .where(eq(schema.videos.youtubeId, videoId))
    .returning({ id: schema.videos.youtubeId });
  if (updated.length === 0) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  // The video can be on hero pages, topic pages and the home banner.
  revalidatePublic();
  return NextResponse.json({ ok: true });
}

/** Delete a video (its hero and topic links are removed too). ?id=<youtubeId> */
export async function DELETE(req: Request) {
  const videoId = new URL(req.url).searchParams.get("id") ?? "";
  if (!videoId) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await getDb().delete(schema.videos).where(eq(schema.videos.youtubeId, videoId));
  revalidatePublic();
  return NextResponse.json({ ok: true });
}
