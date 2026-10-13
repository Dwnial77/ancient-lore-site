"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { AdminVideo, PickerHero } from "@/lib/queries";
import { VideoEditor } from "./VideoEditor";

type Filter = "all" | "unassigned" | "review";

type LastSync = {
  status: string;
  source: string;
  videosTotal: number;
  videosNew: number;
  suggestions: number;
  error: string | null;
  startedAt: string;
} | null;

function timeAgo(iso: string): string {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)} days ago`;
}

export function AdminDashboard({
  videos,
  heroes,
  lastSync,
}: {
  videos: AdminVideo[];
  heroes: PickerHero[];
  lastSync: LastSync;
}) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [syncing, setSyncing] = useState(false);
  const [syncMessage, setSyncMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const heroMap = useMemo(() => new Map(heroes.map((h) => [h.id, h])), [heroes]);
  const unassigned = videos.filter((v) => v.appearances.length === 0);
  const needsReview = videos.filter((v) => v.appearances.some((a) => a.needsReview));

  const shown = useMemo(() => {
    const base = filter === "unassigned" ? unassigned : filter === "review" ? needsReview : videos;
    const q = query.trim().toLowerCase();
    return q ? base.filter((v) => v.title.toLowerCase().includes(q)) : base;
  }, [filter, query, videos, unassigned, needsReview]);

  async function sync() {
    setSyncing(true);
    setSyncMessage(null);
    try {
      const res = await fetch("/api/admin/sync", { method: "POST" });
      const data = (await res.json()) as { ok: boolean; videosTotal: number; videosNew: number; suggestions: number; error?: string };
      setSyncMessage(
        data.ok
          ? { ok: true, text: `Synced ${data.videosTotal} videos · ${data.videosNew} new · ${data.suggestions} hero suggestions` }
          : { ok: false, text: data.error ?? "Sync failed" },
      );
      router.refresh();
    } catch {
      setSyncMessage({ ok: false, text: "Sync failed (network error or timeout)" });
    } finally {
      setSyncing(false);
    }
  }

  const tabs: { id: Filter; label: string; count: number }[] = [
    { id: "all", label: "All", count: videos.length },
    { id: "unassigned", label: "No heroes", count: unassigned.length },
    { id: "review", label: "Needs review", count: needsReview.length },
  ];

  return (
    <div className="mt-8 space-y-6">
      <section className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-5 sm:flex-row sm:items-center">
        <div className="flex-1 text-sm">
          <p className="text-parchment">
            {videos.length} videos · {heroes.length} heroes cached
          </p>
          <p className="mt-1 text-muted">
            {lastSync
              ? `Last sync ${timeAgo(lastSync.startedAt)} (${lastSync.source}) — ${lastSync.status === "ok" ? `${lastSync.videosTotal} videos, ${lastSync.videosNew} new` : lastSync.status === "error" ? `failed: ${lastSync.error ?? "unknown error"}` : lastSync.status}`
              : "Never synced — press “Sync videos” to import your channel."}
          </p>
          {syncMessage ? <p className={`mt-1 ${syncMessage.ok ? "text-agi" : "text-str"}`}>{syncMessage.text}</p> : null}
        </div>
        <button
          type="button"
          onClick={sync}
          disabled={syncing}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber px-5 py-2.5 font-semibold text-ink transition hover:bg-amber-soft disabled:opacity-60"
        >
          <span className={syncing ? "animate-spin" : ""} aria-hidden="true">⟳</span>
          {syncing ? "Syncing…" : "Sync videos"}
        </button>
      </section>

      {unassigned.length || needsReview.length ? (
        <section className="rounded-xl border border-amber/40 bg-amber/5 p-5">
          <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-amber">⚠ NEEDS ATTENTION</h2>
          <ul className="mt-3 space-y-1 text-sm">
            {unassigned.length ? (
              <li>
                <button type="button" onClick={() => setFilter("unassigned")} className="text-parchment hover:text-amber">
                  {unassigned.length} {unassigned.length === 1 ? "video has" : "videos have"} no heroes assigned →
                </button>
              </li>
            ) : null}
            {needsReview.length ? (
              <li>
                <button type="button" onClick={() => setFilter("review")} className="text-parchment hover:text-amber">
                  {needsReview.length} {needsReview.length === 1 ? "video has" : "videos have"} auto-suggested heroes to review →
                </button>
              </li>
            ) : null}
          </ul>
          <p className="mt-2 text-xs text-muted">Auto-suggested heroes stay hidden on the public site until you confirm them.</p>
        </section>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2" role="tablist">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={filter === t.id}
              onClick={() => setFilter(t.id)}
              className={`rounded-full border px-3 py-1 text-sm transition ${filter === t.id ? "border-amber bg-amber/15 text-amber" : "border-line text-muted hover:text-parchment"}`}
            >
              {t.label} <span className="tabular-nums opacity-70">{t.count}</span>
            </button>
          ))}
        </div>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search titles…"
          className="rounded-full border border-line bg-surface px-4 py-1.5 text-sm text-parchment placeholder:text-muted/70 focus:border-amber focus:outline-none sm:ml-auto sm:w-64"
        />
      </div>

      <div className="space-y-4">
        {shown.length === 0 ? <p className="py-10 text-center text-muted">Nothing here.</p> : null}
        {shown.map((v) => (
          <VideoEditor key={`${v.youtubeId}:${JSON.stringify(v.appearances)}`} video={v} heroes={heroMap} />
        ))}
      </div>
    </div>
  );
}
