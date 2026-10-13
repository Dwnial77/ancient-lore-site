"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import type { Role } from "@/db/schema";
import { formatDate, formatDuration, parseDurationInput, ROLE_LABELS, youtubeUrl } from "@/lib/format";
import type { AdminAppearance, AdminTopic, AdminTopicLink, AdminVideo, PickerHero } from "@/lib/queries";
import { AttributeDot } from "../AttributeDot";
import { SearchPicker } from "./SearchPicker";

const ROLES: Role[] = ["main", "supporting", "cameo"];

export function VideoEditor({
  video,
  heroes,
  topics,
}: {
  video: AdminVideo;
  heroes: Map<number, PickerHero>;
  topics: Map<number, AdminTopic>;
}) {
  const router = useRouter();
  const [items, setItems] = useState<AdminAppearance[]>(video.appearances);
  const [topicLinks, setTopicLinks] = useState<AdminTopicLink[]>(video.topics);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [editing, setEditing] = useState(video.durationSeconds === 0);
  const [details, setDetails] = useState({
    title: video.title,
    date: video.publishedAt.slice(0, 10),
    duration: video.durationSeconds ? formatDuration(video.durationSeconds) : "",
  });

  const dirty = useMemo(
    () =>
      JSON.stringify(items) !== JSON.stringify(video.appearances) ||
      JSON.stringify(topicLinks) !== JSON.stringify(video.topics),
    [items, topicLinks, video.appearances, video.topics],
  );
  const exclude = useMemo(() => new Set(items.map((i) => i.heroId)), [items]);
  const excludeTopics = useMemo(() => new Set(topicLinks.map((t) => t.topicId)), [topicLinks]);
  const heroOptions = useMemo(
    () => [...heroes.values()].map((h) => ({ ...h, trailing: <AttributeDot attribute={h.attribute} /> })),
    [heroes],
  );
  const topicOptions = useMemo(() => [...topics.values()], [topics]);
  const unassigned = items.length === 0 && topicLinks.length === 0;

  const update = (heroId: number, patch: Partial<AdminAppearance>) =>
    setItems((list) => list.map((i) => (i.heroId === heroId ? { ...i, ...patch } : i)));
  const remove = (heroId: number) => setItems((list) => list.filter((i) => i.heroId !== heroId));

  async function save(next = items, nextTopics = topicLinks) {
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/appearances", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.youtubeId, items: next, topics: nextTopics }),
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

  async function saveDetails() {
    const durationSeconds = parseDurationInput(details.duration);
    if (durationSeconds === null) {
      setStatus({ ok: false, text: "Duration must look like 18:42 or 1:02:03" });
      return;
    }
    setSaving(true);
    setStatus(null);
    const res = await fetch("/api/admin/videos", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.youtubeId, title: details.title, publishedAt: details.date, durationSeconds }),
    });
    setSaving(false);
    if (res.ok) {
      setStatus({ ok: true, text: "Details saved" });
      router.refresh();
    } else {
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      setStatus({ ok: false, text: data.error ?? "Save failed" });
    }
  }

  async function deleteVideo() {
    if (!window.confirm(`Delete "${video.title}" from the site? (It stays on YouTube.)`)) return;
    setSaving(true);
    const res = await fetch(`/api/admin/videos?id=${encodeURIComponent(video.youtubeId)}`, { method: "DELETE" });
    setSaving(false);
    if (res.ok) router.refresh();
    else setStatus({ ok: false, text: "Delete failed" });
  }

  const reviewCount = items.filter((i) => i.needsReview).length + topicLinks.filter((t) => t.needsReview).length;

  return (
    <article
      className={`rounded-xl border bg-surface p-4 transition ${dirty ? "border-amber/70" : unassigned ? "border-str/50" : "border-line"}`}
    >
      <div className="flex gap-4">
        <a href={youtubeUrl(video.youtubeId)} target="_blank" rel="noopener noreferrer" className="shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={video.thumbnailUrl} alt="" className="aspect-video w-28 rounded-lg object-cover sm:w-40" loading="lazy" />
        </a>
        <div className="min-w-0 flex-1">
          <h3 className="line-clamp-2 font-medium text-parchment">{video.title}</h3>
          <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-muted">
            <span>
              {formatDate(video.publishedAt)}
              {video.durationSeconds ? ` · ${formatDuration(video.durationSeconds)}` : ""}
            </span>
            <button type="button" onClick={() => setEditing((e) => !e)} className="text-amber/80 hover:text-amber">
              ✎ {editing ? "Hide details" : "Edit details"}
            </button>
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {unassigned ? (
              <span className="rounded-full bg-str/15 px-2 py-0.5 text-xs text-str">Unassigned</span>
            ) : null}
            {reviewCount ? (
              <span className="rounded-full bg-amber/15 px-2 py-0.5 text-xs text-amber">{reviewCount} need review</span>
            ) : null}
            {video.durationSeconds === 0 ? (
              <span className="rounded-full bg-amber/15 px-2 py-0.5 text-xs text-amber">Duration missing</span>
            ) : null}
          </div>
        </div>
      </div>

      {editing ? (
        <div className="mt-4 grid gap-3 rounded-lg border border-line/60 bg-ink/40 p-3 sm:grid-cols-[1fr_auto_auto]">
          <label className="text-xs text-muted">
            Title
            <input
              value={details.title}
              onChange={(e) => setDetails((d) => ({ ...d, title: e.target.value }))}
              className="mt-1 w-full rounded-md border border-line bg-ink px-2 py-1 text-sm text-parchment focus:border-amber focus:outline-none"
            />
          </label>
          <label className="text-xs text-muted">
            Published
            <input
              type="date"
              value={details.date}
              onChange={(e) => setDetails((d) => ({ ...d, date: e.target.value }))}
              className="mt-1 block rounded-md border border-line bg-ink px-2 py-1 text-sm text-parchment [color-scheme:dark] focus:border-amber focus:outline-none"
            />
          </label>
          <label className="text-xs text-muted">
            Duration
            <input
              value={details.duration}
              onChange={(e) => setDetails((d) => ({ ...d, duration: e.target.value }))}
              placeholder="18:42"
              className="mt-1 block w-24 rounded-md border border-line bg-ink px-2 py-1 text-sm tabular-nums text-parchment focus:border-amber focus:outline-none"
            />
          </label>
          <div className="flex items-center gap-3 sm:col-span-3">
            <button
              type="button"
              onClick={saveDetails}
              disabled={saving}
              className="rounded-md bg-amber/90 px-3 py-1 text-sm font-semibold text-ink hover:bg-amber disabled:opacity-50"
            >
              Save details
            </button>
            <button type="button" onClick={deleteVideo} disabled={saving} className="ml-auto text-sm text-str/80 hover:text-str">
              Delete video
            </button>
          </div>
        </div>
      ) : null}

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

      {topicLinks.length > 0 ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted">Topics</span>
          {topicLinks.map((link) => {
            const topic = topics.get(link.topicId);
            return (
              <span
                key={link.topicId}
                className={`flex items-center gap-1 rounded-full border py-0.5 pl-3 pr-1 text-sm ${link.needsReview ? "border-amber/60 bg-amber/10 text-amber" : "border-line bg-ink/40 text-parchment"}`}
              >
                {topic?.name ?? `Topic #${link.topicId}`}
                {link.needsReview ? (
                  <button
                    type="button"
                    onClick={() =>
                      setTopicLinks((list) => list.map((t) => (t.topicId === link.topicId ? { ...t, needsReview: false } : t)))
                    }
                    className="rounded-full px-1.5 text-xs font-semibold text-agi hover:bg-agi/20"
                    title="Auto-detected from the title — confirm it"
                  >
                    ✓
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => setTopicLinks((list) => list.filter((t) => t.topicId !== link.topicId))}
                  className="rounded-full px-1.5 text-xs text-muted hover:bg-str/15 hover:text-str"
                  aria-label={`Remove ${topic?.name ?? "topic"}`}
                >
                  ✕
                </button>
              </span>
            );
          })}
        </div>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <SearchPicker
          items={heroOptions}
          exclude={exclude}
          label="+ Add hero"
          placeholder="Search hero…"
          emptyText="No heroes found"
          onPick={(h) => setItems((list) => [...list, { heroId: h.id, role: "main", note: null, needsReview: false }])}
        />
        <SearchPicker
          items={topicOptions}
          exclude={excludeTopics}
          label="+ Add topic"
          placeholder="Search topic…"
          emptyText={
            <a href="/admin/topics" className="text-amber hover:underline">
              Create topics first →
            </a>
          }
          onPick={(t) => setTopicLinks((list) => [...list, { topicId: t.id, needsReview: false }])}
        />
        {reviewCount > 0 ? (
          <button
            type="button"
            onClick={() => {
              const next = items.map((i) => ({ ...i, needsReview: false }));
              const nextTopics = topicLinks.map((t) => ({ ...t, needsReview: false }));
              setItems(next);
              setTopicLinks(nextTopics);
              void save(next, nextTopics);
            }}
            className="text-sm text-agi hover:underline"
          >
            Confirm all & save
          </button>
        ) : null}
        <div className="ml-auto flex items-center gap-3">
          {status ? <span className={`text-xs ${status.ok ? "text-agi" : "text-str"}`}>{status.text}</span> : null}
          {dirty ? (
            <button
              type="button"
              onClick={() => {
                setItems(video.appearances);
                setTopicLinks(video.topics);
              }}
              className="text-sm text-muted hover:text-parchment"
            >
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
