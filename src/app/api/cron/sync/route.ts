import { NextResponse } from "next/server";
import { runSync } from "@/lib/sync";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

// Called daily by Vercel Cron (see vercel.json). Vercel sends `Authorization: Bearer $CRON_SECRET`.
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runSync("cron");
  return NextResponse.json(result, { status: result.ok ? 200 : 500 });
}
