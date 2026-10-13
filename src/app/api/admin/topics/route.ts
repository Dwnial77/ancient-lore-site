import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { getDb, schema } from "@/db";
import { topicKindEnum, type TopicKind } from "@/db/schema";
import { slugify } from "@/lib/opendota";
import { revalidatePublic } from "@/lib/revalidate";

type TopicInput = {
  name: string;
  kind: TopicKind;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

function parseTopic(body: Record<string, unknown> | null): TopicInput | string {
  const name = typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  if (!name) return "Name is required";
  const kind = body?.kind as TopicKind;
  if (!topicKindEnum.enumValues.includes(kind)) return "Invalid type";
  const description =
    typeof body?.description === "string" && body.description.trim() ? body.description.trim().slice(0, 600) : null;
  let imageUrl: string | null = null;
  if (typeof body?.imageUrl === "string" && body.imageUrl.trim()) {
    try {
      const url = new URL(body.imageUrl.trim());
      if (url.protocol !== "https:") return "Cover image must be an https:// link";
      imageUrl = url.toString();
    } catch {
      return "Cover image must be a valid link";
    }
  }
  const sortOrder = Number.isInteger(Number(body?.sortOrder)) ? Number(body?.sortOrder) : 0;
  return { name, kind, description, imageUrl, sortOrder };
}

async function uniqueSlug(name: string, ignoreId?: number): Promise<string> {
  const base = slugify(name) || "topic";
  const db = getDb();
  for (let n = 1; ; n++) {
    const slug = n === 1 ? base : `${base}-${n}`;
    const [hit] = await db.select({ id: schema.topics.id }).from(schema.topics).where(eq(schema.topics.slug, slug)).limit(1);
    if (!hit || hit.id === ignoreId) return slug;
  }
}

/** Create a topic. */
export async function POST(req: Request) {
  const input = parseTopic((await req.json().catch(() => null)) as Record<string, unknown> | null);
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  const [topic] = await getDb()
    .insert(schema.topics)
    .values({ ...input, slug: await uniqueSlug(input.name) })
    .returning();
  revalidatePublic();
  return NextResponse.json({ ok: true, topic });
}

/** Update a topic. Body: { id, ...fields } */
export async function PATCH(req: Request) {
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const id = Number(body?.id);
  const input = parseTopic(body);
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  if (typeof input === "string") return NextResponse.json({ error: input }, { status: 400 });
  const updated = await getDb()
    .update(schema.topics)
    .set({ ...input, slug: await uniqueSlug(input.name, id) })
    .where(eq(schema.topics.id, id))
    .returning();
  if (updated.length === 0) return NextResponse.json({ error: "Topic not found" }, { status: 404 });
  revalidatePublic();
  return NextResponse.json({ ok: true, topic: updated[0] });
}

/** Delete a topic (its video links are removed too). ?id= */
export async function DELETE(req: Request) {
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return NextResponse.json({ error: "Invalid topic" }, { status: 400 });
  await getDb().delete(schema.topics).where(eq(schema.topics.id, id));
  revalidatePublic();
  return NextResponse.json({ ok: true });
}
