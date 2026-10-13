import { NextResponse } from "next/server";
import { refreshHeroes } from "@/lib/heroes";
import { revalidatePublic } from "@/lib/revalidate";

/** Re-fetch the hero list from OpenDota (picks up newly released heroes). */
export async function POST() {
  try {
    const count = await refreshHeroes();
    revalidatePublic();
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Refresh failed" }, { status: 502 });
  }
}
