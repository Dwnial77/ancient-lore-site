"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type Result = {
  input: string;
  status: "added" | "exists" | "invalid" | "not_found";
  title?: string;
  suggestions?: number;
  incomplete?: boolean;
};

const STATUS_TEXT: Record<Result["status"], string> = {
  added: "added",
  exists: "already in the list",
  invalid: "not a YouTube video link",
  not_found: "video not found or private",
};

export function AddVideoForm() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const urls = text.split(/[\s,]+/).filter(Boolean);
    if (urls.length === 0) return;
    setBusy(true);
    setMessage(null);
    setResults([]);
    try {
      const res = await fetch("/api/admin/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ urls }),
      });
      const data = (await res.json()) as { results?: Result[]; error?: string };
      if (!res.ok) {
        setMessage({ ok: false, text: data.error ?? "Could not add videos" });
      } else {
        setResults(data.results ?? []);
        if (data.results?.every((r) => r.status === "added" || r.status === "exists")) setText("");
        router.refresh();
      }
    } catch {
      setMessage({ ok: false, text: "Network error — try again" });
    } finally {
      setBusy(false);
    }
  }

  async function refreshHeroes() {
    setRefreshing(true);
    setMessage(null);
    const res = await fetch("/api/admin/heroes/refresh", { method: "POST" });
    const data = (await res.json().catch(() => ({}))) as { count?: number; error?: string };
    setRefreshing(false);
    setMessage(res.ok ? { ok: true, text: `Hero list updated (${data.count} heroes)` } : { ok: false, text: data.error ?? "Refresh failed" });
    if (res.ok) router.refresh();
  }

  return (
    <section className="rounded-xl border border-line bg-surface p-5">
      <h2 className="font-display text-sm font-semibold tracking-[0.2em] text-amber">ADD VIDEOS</h2>
      <form onSubmit={add} className="mt-3 space-y-3">
        <label className="block">
          <span className="text-sm text-muted">Paste YouTube links — one per line</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            placeholder={"https://www.youtube.com/watch?v=…\nhttps://youtu.be/…"}
            className="mt-1 w-full resize-y rounded-lg border border-line bg-ink px-3 py-2 font-mono text-sm text-parchment placeholder:text-muted/50 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
          />
        </label>
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-xs text-muted">Title, thumbnail, date and duration are filled in automatically.</p>
          <button
            type="button"
            onClick={refreshHeroes}
            disabled={refreshing}
            className="ml-auto rounded-lg border border-line px-3 py-2 text-sm text-muted transition hover:border-amber/50 hover:text-parchment disabled:opacity-50"
          >
            {refreshing ? "Refreshing…" : "↻ Refresh hero list"}
          </button>
          <button
            type="submit"
            disabled={busy || !text.trim()}
            className="rounded-lg bg-amber px-5 py-2 font-semibold text-ink transition hover:bg-amber-soft disabled:opacity-50"
          >
            {busy ? "Adding…" : "+ Add videos"}
          </button>
        </div>
      </form>

      {message ? <p className={`mt-3 text-sm ${message.ok ? "text-agi" : "text-str"}`}>{message.text}</p> : null}

      {results.length ? (
        <ul className="mt-4 space-y-1.5 text-sm">
          {results.map((r, i) => {
            return (
              <li key={i} className="flex gap-2">
                <span className={r.status === "added" ? (r.incomplete ? "text-amber" : "text-agi") : r.status === "exists" ? "text-muted" : "text-str"}>
                  {r.status === "added" ? (r.incomplete ? "⚠" : "✓") : r.status === "exists" ? "•" : "✕"}
                </span>
                <span className="min-w-0">
                  <span className="text-parchment">{r.title ?? r.input}</span>
                  <span className="text-muted">
                    {" — "}
                    {STATUS_TEXT[r.status]}
                    {r.status === "added" && r.suggestions ? `, ${r.suggestions} hero${r.suggestions > 1 ? "es" : ""} suggested` : ""}
                    {r.status === "added" && r.incomplete ? ", please check date & duration" : ""}
                  </span>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
