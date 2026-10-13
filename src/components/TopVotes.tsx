import Link from "next/link";
import type { TopVote } from "@/lib/queries";

export function TopVotes({ items, variant }: { items: TopVote[]; variant: "list" | "scroller" }) {
  if (variant === "scroller") {
    if (items.length === 0) return null;
    return (
      <section aria-label="Most voted heroes" className="mb-6">
        <h2 className="mb-3 font-display text-sm font-semibold tracking-[0.2em] text-amber">⚔ MOST WANTED NEXT</h2>
        <ol className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-2">
          {items.map((h, i) => (
            <li key={h.id} className="shrink-0">
              <Link href={`/hero/${h.slug}`} className="flex items-center gap-2 rounded-full border border-line bg-surface py-1 pl-1 pr-3 text-sm">
                <span className="grid h-6 w-6 place-items-center rounded-full bg-amber text-xs font-bold text-ink">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.iconUrl} alt="" className="h-5 w-5" loading="lazy" />
                <span className="text-parchment">{h.name}</span>
                <span className="tabular-nums text-amber">{h.votes}</span>
              </Link>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  const max = Math.max(1, ...items.map((i) => i.votes));
  return (
    <section aria-labelledby="top-votes" className="rounded-2xl border border-line bg-surface/70 p-5 sm:p-8">
      <h2 id="top-votes" className="font-display text-xl font-semibold tracking-[0.15em] text-parchment sm:text-2xl">
        <span className="text-amber">⚔</span> Vote for the next hero
      </h2>
      <p className="mt-1 text-sm text-muted">
        Tap the vote button on any “Coming soon” hero. One vote per hero per day.
      </p>
      {items.length === 0 ? (
        <p className="mt-6 text-muted">No votes yet — be the first to pick the next legend.</p>
      ) : (
        <ol className="mt-6 space-y-3">
          {items.map((h, i) => (
            <li key={h.id}>
              <Link
                href={`/hero/${h.slug}`}
                className="group grid grid-cols-[1.5rem_1.75rem_minmax(0,1fr)_2.5rem] items-center gap-x-3 gap-y-1.5 sm:grid-cols-[2rem_1.75rem_minmax(0,9rem)_1fr_3rem]"
              >
                <span className="font-display text-lg text-amber">{i + 1}</span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.iconUrl} alt="" className="h-7 w-7" loading="lazy" />
                <span className="truncate text-parchment group-hover:text-amber-soft">{h.name}</span>
                {/* On mobile the bar wraps onto its own row under the name. */}
                <span className="col-start-3 row-start-2 h-2 overflow-hidden rounded-full bg-ink sm:col-start-auto sm:row-start-auto sm:h-2.5">
                  <span
                    className="block h-full rounded-full bg-gradient-to-r from-amber/60 to-amber transition-all duration-700 group-hover:shadow-[0_0_12px] group-hover:shadow-amber"
                    style={{ width: `${(h.votes / max) * 100}%` }}
                  />
                </span>
                <span className="col-start-4 row-start-1 text-right tabular-nums text-amber sm:col-start-auto sm:row-start-auto">
                  {h.votes}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
