import { and, eq, inArray, notInArray, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { roleEnum, type Role } from "@/db/schema";
import { revalidateHeroes } from "@/lib/revalidate";
import { heroSlugsForIds } from "@/lib/sync";

type Item = { heroId: number; role: Role; note: string | null; needsReview: boolean };

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

/** Replace the full hero list of one video. Body: { videoId, items: Item[] } */
export async function PUT(req: Request) {
  const body = (await req.json().catch(() => null)) as { videoId?: unknown; items?: unknown } | null;
  const videoId = typeof body?.videoId === "string" ? body.videoId : "";
  const items = parseItems(body?.items);
  if (!videoId || !items) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

  const db = getDb();
  const [video] = await db
    .select({ id: schema.videos.youtubeId })
    .from(schema.videos)
    .where(eq(schema.videos.youtubeId, videoId))
    .limit(1);
  if (!video) return NextResponse.json({ error: "Video not found" }, { status: 404 });

  const before = await db
    .select({ heroId: schema.appearances.heroId })
    .from(schema.appearances)
    .where(eq(schema.appearances.videoId, videoId));

  const keepIds = items.map((i) => i.heroId);
  await db
    .delete(schema.appearances)
    .where(
      keepIds.length
        ? and(eq(schema.appearances.videoId, videoId), notInArray(schema.appearances.heroId, keepIds))
        : eq(schema.appearances.videoId, videoId),
    );

  if (items.length) {
    const valid = await db
      .select({ id: schema.heroes.id })
      .from(schema.heroes)
      .where(inArray(schema.heroes.id, keepIds));
    const validIds = new Set(valid.map((v) => v.id));
    const rows = items.filter((i) => validIds.has(i.heroId)).map((i) => ({ ...i, videoId }));
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

  const touched = [...new Set([...before.map((b) => b.heroId), ...keepIds])];
  revalidateHeroes(await heroSlugsForIds(touched));
  return NextResponse.json({ ok: true });
}
