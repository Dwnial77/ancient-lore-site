import Link from "next/link";
import type { HeroSummary } from "@/lib/queries";
import { AttributeDot } from "./AttributeDot";
import { VoteButton } from "./VoteButton";

export function HeroCard({ hero }: { hero: HeroSummary }) {
  const covered = hero.episodes > 0;
  return (
    <div
      className={[
        "group relative overflow-hidden rounded-xl border bg-surface transition-all duration-300 ease-out",
        covered
          ? "border-amber/40 hover:z-10 hover:scale-[1.05] hover:border-amber hover:shadow-[0_0_28px_-4px] hover:shadow-amber/60"
          : "border-line/70 hover:border-line hover:scale-[1.02]",
      ].join(" ")}
    >
      <Link href={`/hero/${hero.slug}`} className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-amber">
        <div className="relative aspect-[16/9] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.imageUrl}
            alt={hero.name}
            loading="lazy"
            className={[
              "h-full w-full object-cover transition duration-500 group-hover:scale-110",
              covered ? "" : "opacity-40 grayscale group-hover:opacity-60 group-hover:grayscale-[60%]",
            ].join(" ")}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface via-transparent to-transparent" />
          {covered ? (
            <span className="absolute left-2 top-2 rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink shadow">
              {hero.episodes} {hero.episodes === 1 ? "episode" : "episodes"}
            </span>
          ) : (
            <span className="absolute left-2 top-2 rounded-full border border-parchment/20 bg-ink/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
              Coming soon
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 px-3 pb-3 pt-1">
          <AttributeDot attribute={hero.attribute} />
          <span
            className={`truncate font-display text-sm font-semibold tracking-wide ${covered ? "text-parchment group-hover:text-amber-soft" : "text-muted"}`}
          >
            {hero.name}
          </span>
        </div>
      </Link>
      {!covered ? (
        <div className="absolute right-2 top-2">
          <VoteButton heroId={hero.id} initialVotes={hero.votes} />
        </div>
      ) : null}
    </div>
  );
}
