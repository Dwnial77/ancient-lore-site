"use client";

import { useMemo, useState } from "react";
import type { Attribute } from "@/db/schema";
import { ATTRIBUTE_LABELS } from "@/lib/format";
import type { HeroSummary } from "@/lib/queries";
import { AttributeDot } from "./AttributeDot";
import { HeroCard } from "./HeroCard";

const FILTERS: (Attribute | "any")[] = ["any", "str", "agi", "int", "all"];

export function HeroGrid({ heroes }: { heroes: HeroSummary[] }) {
  const [query, setQuery] = useState("");
  const [attribute, setAttribute] = useState<Attribute | "any">("any");
  const [onlyEpisodes, setOnlyEpisodes] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter(
      (h) =>
        (attribute === "any" || h.attribute === attribute) &&
        (!onlyEpisodes || h.episodes > 0) &&
        (!q || h.name.toLowerCase().includes(q)),
    );
  }, [heroes, query, attribute, onlyEpisodes]);

  return (
    <section aria-label="Heroes">
      <div className="sticky top-14 z-30 -mx-4 mb-6 border-b border-line/40 bg-ink/85 px-4 py-3 backdrop-blur-md">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative block lg:w-72">
            <span className="sr-only">Search heroes</span>
            <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-3.5-3.5" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search heroes…"
              className="w-full rounded-full border border-line bg-surface py-2 pl-9 pr-4 text-sm text-parchment placeholder:text-muted/70 focus:border-amber focus:outline-none focus:ring-1 focus:ring-amber"
            />
          </label>

          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:pb-0" role="group" aria-label="Filter by attribute">
            {FILTERS.map((f) => {
              const active = attribute === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setAttribute(f)}
                  aria-pressed={active}
                  className={[
                    "flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition",
                    active
                      ? "border-amber bg-amber/15 text-amber"
                      : "border-line bg-surface text-muted hover:border-amber/50 hover:text-parchment",
                  ].join(" ")}
                >
                  {f !== "any" ? <AttributeDot attribute={f} /> : null}
                  {f === "any" ? "All" : ATTRIBUTE_LABELS[f]}
                </button>
              );
            })}
          </div>

          <label className="flex cursor-pointer select-none items-center gap-3 text-sm text-muted lg:ml-auto">
            <span>Only heroes with episodes</span>
            <button
              type="button"
              role="switch"
              aria-checked={onlyEpisodes}
              onClick={() => setOnlyEpisodes((v) => !v)}
              className={`relative h-6 w-11 rounded-full border transition ${onlyEpisodes ? "border-amber bg-amber" : "border-line bg-surface"}`}
            >
              <span
                className={`absolute top-0.5 h-4.5 w-4.5 rounded-full transition-all ${onlyEpisodes ? "left-[22px] bg-ink" : "left-0.5 bg-muted"}`}
              />
            </button>
          </label>
        </div>
      </div>

      <p className="mb-4 text-xs uppercase tracking-widest text-muted">
        Showing {filtered.length} of {heroes.length} heroes
      </p>

      {filtered.length === 0 ? (
        <p className="py-16 text-center text-muted">No heroes match your filters.</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-4 lg:grid-cols-6">
          {filtered.map((hero) => (
            <HeroCard key={hero.id} hero={hero} />
          ))}
        </div>
      )}
    </section>
  );
}
