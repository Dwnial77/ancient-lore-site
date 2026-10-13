import { and, eq, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { revalidatePath } from "next/cache";
import { clientIp, voteDay, voterHash } from "@/lib/voter";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as { heroId?: unknown } | null;
  const heroId = Number(body?.heroId);
  if (!Number.isInteger(heroId)) return NextResponse.json({ error: "Invalid hero" }, { status: 400 });

  const db = getDb();
  const [hero] = await db
    .select({
      id: schema.heroes.id,
      slug: schema.heroes.slug,
      covered: sql<boolean>`exists (select 1 from ${schema.appearances} where ${schema.appearances.heroId} = ${schema.heroes.id} and ${schema.appearances.needsReview} = false)`,
    })
    .from(schema.heroes)
    .where(eq(schema.heroes.id, heroId))
    .limit(1);
  if (!hero) return NextResponse.json({ error: "Hero not found" }, { status: 404 });
  if (hero.covered) return NextResponse.json({ error: "This hero already has an episode" }, { status: 409 });

  const inserted = await db
    .insert(schema.votes)
    .values({ heroId, voterHash: voterHash(clientIp(req.headers)), voteDay: voteDay() })
    .onConflictDoNothing()
    .returning({ id: schema.votes.id });

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(schema.votes)
    .where(and(eq(schema.votes.heroId, heroId)));

  if (inserted.length === 0) {
    return NextResponse.json({ error: "You already voted for this hero today", votes: count }, { status: 409 });
  }

  revalidatePath("/");
  revalidatePath(`/hero/${hero.slug}`);
  return NextResponse.json({ ok: true, votes: count });
}
