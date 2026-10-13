"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { TopicKind } from "@/db/schema";
import type { AdminTopic } from "@/lib/queries";

type Draft = { id?: number; name: string; kind: TopicKind; description: string; imageUrl: string; sortOrder: number };

const EMPTY: Draft = { name: "", kind: "series", description: "", imageUrl: "", sortOrder: 0 };

const KINDS: { value: TopicKind; label: string; hint: string }[] = [
  { value: "series", label: "Series", hint: "A recurring format, e.g. What If…" },
  { value: "character", label: "World lore", hint: "A character, creature or place, e.g. Roshan, the Shopkeeper" },
];

const input =
  "mt-1 w-full rounded-md border border-line bg-ink px-3 py-2 text-sm text-parchment placeholder:text-muted/60 focus:border-amber focus:outline-none";

export function TopicsManager({ topics }: { topics: AdminTopic[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  function edit(t: AdminTopic) {
    setDraft({
      id: t.id,
      name: t.name,
      kind: t.kind,
      description: t.description ?? "",
      imageUrl: t.imageUrl ?? "",
      sortOrder: t.sortOrder,
    });
    setMessage(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    const res = await fetch("/api/admin/topics", {
      method: draft.id ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(draft),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    setBusy(false);
    if (!res.ok) {
      setMessage({ ok: false, text: data.error ?? "Save failed" });
      return;
    }
    setMessage({ ok: true, text: draft.id ? "Topic updated" : "Topic created — now tag videos with it on the Videos page" });
    setDraft(EMPTY);
    router.refresh();
  }

  async function remove(t: AdminTopic) {
    if (!window.confirm(`Delete "${t.name}"? Videos stay, only the topic and its tags are removed.`)) return;
    const res = await fetch(`/api/admin/topics?id=${t.id}`, { method: "DELETE" });
    if (res.ok) {
      if (draft.id === t.id) setDraft(EMPTY);
      router.refresh();
    } else setMessage({ ok: false, text: "Delete failed" });
  }

  return (
    <div className="mt-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl tracking-[0.15em] text-parchment">Topics</h1>
        <p className="mt-1 text-sm text-muted">
          Topics are for videos that aren&apos;t about one hero, like a series (What If…) or world lore (Roshan, the
          Shopkeeper). Each topic gets its own page and a card in &ldquo;Beyond the Heroes&rdquo; on the home page.
        </p>
      </div>

      <form onSubmit={submit} className="grid gap-4 rounded-xl border border-line bg-surface p-5 sm:grid-cols-2">
        <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-amber sm:col-span-2">
          {draft.id ? "EDIT TOPIC" : "NEW TOPIC"}
        </h2>
        <label className="text-sm text-muted">
          Name
          <input
            required
            value={draft.name}
            onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
            placeholder="What If…"
            maxLength={80}
            className={input}
          />
        </label>
        <fieldset className="text-sm text-muted">
          <legend>Type</legend>
          <div className="mt-1 flex gap-2">
            {KINDS.map((k) => (
              <button
                key={k.value}
                type="button"
                title={k.hint}
                onClick={() => setDraft((d) => ({ ...d, kind: k.value }))}
                className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${draft.kind === k.value ? "border-amber bg-amber/15 text-amber" : "border-line text-muted hover:text-parchment"}`}
              >
                {k.label}
              </button>
            ))}
          </div>
          <p className="mt-1 text-xs">{KINDS.find((k) => k.value === draft.kind)?.hint}</p>
        </fieldset>
        <label className="text-sm text-muted sm:col-span-2">
          Short description <span className="text-muted/60">(optional)</span>
          <textarea
            value={draft.description}
            onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
            rows={2}
            maxLength={600}
            placeholder="Alternate histories of the Ancients — what if one moment had gone differently?"
            className={input}
          />
        </label>
        <label className="text-sm text-muted">
          Cover image link <span className="text-muted/60">(optional)</span>
          <input
            value={draft.imageUrl}
            onChange={(e) => setDraft((d) => ({ ...d, imageUrl: e.target.value }))}
            placeholder="https://… (empty = latest episode thumbnail)"
            className={input}
          />
        </label>
        <label className="text-sm text-muted">
          Order on home page <span className="text-muted/60">(lower = first)</span>
          <input
            type="number"
            value={draft.sortOrder}
            onChange={(e) => setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) || 0 }))}
            className={input}
          />
        </label>
        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
          <button
            type="submit"
            disabled={busy || !draft.name.trim()}
            className="rounded-lg bg-amber px-5 py-2 font-semibold text-ink transition hover:bg-amber-soft disabled:opacity-50"
          >
            {busy ? "Saving…" : draft.id ? "Save topic" : "+ Create topic"}
          </button>
          {draft.id ? (
            <button type="button" onClick={() => setDraft(EMPTY)} className="text-sm text-muted hover:text-parchment">
              Cancel
            </button>
          ) : null}
          {message ? <p className={`text-sm ${message.ok ? "text-agi" : "text-str"}`}>{message.text}</p> : null}
        </div>
      </form>

      {topics.length === 0 ? (
        <p className="text-muted">No topics yet. Create your first one above, e.g. &ldquo;What If…&rdquo; or &ldquo;Roshan&rdquo;.</p>
      ) : (
        <ul className="space-y-3">
          {topics.map((t) => (
            <li key={t.id} className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface p-4">
              <span className="rounded-full border border-amber/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
                {t.kind === "series" ? "Series" : "World lore"}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-parchment">{t.name}</p>
                <p className="truncate text-xs text-muted">/lore/{t.slug}</p>
              </div>
              <a href={`/lore/${t.slug}`} target="_blank" className="text-sm text-muted hover:text-parchment">
                View ↗
              </a>
              <button type="button" onClick={() => edit(t)} className="text-sm text-amber/80 hover:text-amber">
                Edit
              </button>
              <button type="button" onClick={() => remove(t)} className="text-sm text-str/70 hover:text-str">
                Delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
