"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Role } from "@/db/schema";
import { formatDate, formatDuration, ROLE_LABELS, youtubeUrl } from "@/lib/format";
import type { AdminAppearance, AdminVideo, PickerHero } from "@/lib/queries";
import { HeroPicker } from "./HeroPicker";

const ROLES: Role[] = ["main", "supporting", "cameo"];

export function VideoEditor({ video, heroes }: { video: AdminVideo; heroes: Map<number, PickerHero> }) {
  const router = useRouter();
  const [items, setItems] = useState<AdminAppearance[]>(video.appearances);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);

  const dirty = useMemo(() => JSON.stringify(items) !== JSON.stringify(video.appearances), [items, video.appearances]);
  const exclude = useMemo(() => new Set(items.map((i) => i.heroId)), [items]);
  const heroList = useMemo(() => [...heroes.values()], [heroes]);

  const update = (heroId: number, patch: Partial<AdminAppearance>) =>
    setItems((list) => list.map((i) => (i.heroId === heroId ? { ...i, ...patch } : i)));
  const remove = (heroId: number) => setItems((list) => list.filter((i) => i.heroId !== heroId));

  async function save(next = items) {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/appearances", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.youtubeId, items: next }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus({ ok: true, text: "Saved — public pages updated" });
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus({ ok: false, text: data.error ?? "Save failed" });
    }
  }

  const reviewCount = items.filter((i) => i.needsReview).length;

  return (
    <article
      className={`rounded-xl border bg-surface p-4 transition ${dirty ? "border-amber/70" : items.length === 0 ? "border-str/50" : "border-line"}`}
    >
      <div className="flex gap-4">
        <a href={youtubeUrl(video.youtubeId)} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.thumbnailUrl} alt="" className="aspect-video w-28 rounded-lg object-cover sm:w-40" loading="lazy" />
        </a>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-medium text-parchment">{video.title}</h3>
          <p className="mt-1 text-xs text-muted">
            {formatDate(video.publishedAt)} · {formatDuration(video.durationSeconds)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {items.length === 0 ? (
              <span className="rounded-full bg-str/15 px-2 py-0.5 text-xs text-str">No heroes assigned</span>
            ) : null}
            {reviewCount ? (
              <span className="rounded-full bg-amber/15 px-2 py-0.5 text-xs text-amber">{reviewCount} need review</span>
            ) : null}
          </div>
        </div>
      </div>

      {items.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {items.map((item) => {
            const hero = heroes.get(item.heroId);
            return (
              <li
                key={item.heroId}
                className={`flex flex-wrap items-center gap-2 rounded-lg border px-2 py-2 ${item.needsReview ? "border-amber/50 bg-amber/5" : "border-line/60 bg-ink/40"}`}
              >
                <span className="flex min-w-36 items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {hero ? <img src={hero.iconUrl} alt="" className="h-6 w-6" /> : null}
                  <span className="text-sm text-parchment">{hero?.name ?? `Hero #${item.heroId}`}</span>
                </span>
                <select
                  value={item.role}
                  onChange={(e) => update(item.heroId, { role: e.target.value as Role })}
                  className="rounded-md border border-line bg-ink px-2 py-1 text-sm text-parchment focus:border-amber focus:outline-none"
                  aria-label="Role"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABELS[r]}
                    </option>
                  ))}
                </select>
                <input
                  value={item.note ?? ""}
                  onChange={(e) => update(item.heroId, { note: e.target.value || null })}
                  placeholder="Note (optional), e.g. enters in chapter 4"
                  maxLength={200}
                  className="min-w-0 flex-1 basis-48 rounded-md border border-line bg-ink px-2 py-1 text-sm text-parchment placeholder:text-muted/60 focus:border-amber focus:outline-none"
                />
                {item.needsReview ? (
                  <button
                    type="button"
                    onClick={() => update(item.heroId, { needsReview: false })}
                    className="rounded-md bg-agi/20 px-2 py-1 text-xs font-semibold text-agi hover:bg-agi/30"
                    title="Auto-detected from the title — confirm it"
                  >
                    ✓ Confirm
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => remove(item.heroId)}
                  className="rounded-md px-2 py-1 text-sm text-muted hover:bg-str/15 hover:text-str"
                  aria-label={`Remove ${hero?.name ?? "hero"}`}
                >
                  ✕
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <HeroPicker
          heroes={heroList}
          exclude={exclude}
          onPick={(h) => setItems((list) => [...list, { heroId: h.id, role: "main", note: null, needsReview: false }])}
        />
        {reviewCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              const next = items.map((i) => ({ ...i, needsReview: false }));
              setItems(next);
              void save(next);
            }}
            className="text-sm text-agi hover:underline"
          >
            Confirm all & save
          </button>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          {status ? <span className={`text-xs ${status.ok ? "text-agi" : "text-str"}`}>{status.text}</span> : null}
          {dirty ? (
            <button type="button" onClick={() => setItems(video.appearances)} className="text-sm text-muted hover:text-parchment">
              Reset
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => save()}
            disabled={!dirty || saving}
            className="rounded-lg bg-amber px-4 py-1.5 text-sm font-semibold text-ink transition hover:bg-amber-soft disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>
    </article>
  );
}
