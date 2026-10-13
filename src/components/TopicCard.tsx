import Link from "next/link";
import type { TopicSummary } from "@/lib/queries";

export const TOPIC_KIND_LABELS = { series: "Series", character: "World lore" } as const;

export function TopicCover({ topic, className = "" }: { topic: Pick<TopicSummary, "name" | "coverUrl">; className?: string }) {
  if (topic.coverUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={topic.coverUrl} alt="" className={`h-full w-full object-cover ${className}`} loading="lazy" />;
  }
  return (
    <div className={`grid h-full w-full place-items-center bg-[radial-gradient(ellipse_at_top,_#5a3a12,_#1a150e_70%)] ${className}`}>
      <span className="px-4 text-center font-display text-2xl font-bold text-amber/80">{topic.name}</span>
    </div>
  );
}

export function TopicCard({ topic }: { topic: TopicSummary }) {
  const live = topic.episodes > 0;
  return (
    <Link
      href={`/lore/${topic.slug}`}
      className={[
        "group relative block w-64 shrink-0 overflow-hidden rounded-xl border bg-surface transition-all duration-300 sm:w-72",
        live
          ? "border-amber/40 hover:-translate-y-1 hover:border-amber hover:shadow-[0_10px_40px_-10px] hover:shadow-amber/50"
          : "border-line/70 hover:border-line",
      ].join(" ")}
    >
      <div className="relative aspect-video overflow-hidden">
        <TopicCover topic={topic} className={`transition duration-500 group-hover:scale-105 ${live ? "" : "opacity-50 grayscale"}`} />
        <div className="absolute inset-0 bg-gradient-to-t from-surface via-surface/10 to-transparent" />
        <span className="absolute left-2 top-2 rounded-full border border-amber/50 bg-ink/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber">
          {TOPIC_KIND_LABELS[topic.kind]}
        </span>
      </div>
      <div className="px-4 pb-4 pt-1">
        <h3 className="truncate font-display text-lg font-semibold text-parchment group-hover:text-amber-soft">{topic.name}</h3>
        <p className="text-xs uppercase tracking-wider text-muted">
          {live ? `${topic.episodes} ${topic.episodes === 1 ? "episode" : "episodes"}` : "Coming soon"}
        </p>
      </div>
    </Link>
  );
}

export function BeyondTheHeroes({ topics }: { topics: TopicSummary[] }) {
  if (topics.length === 0) return null;
  return (
    <section aria-labelledby="beyond-heroes" className="mb-12">
      <h2 id="beyond-heroes" className="divider-ornament font-display text-xl font-semibold tracking-[0.2em] text-amber">
        BEYOND THE HEROES
      </h2>
      <p className="mt-1 text-sm text-muted">What-ifs, legends and the world between the lanes.</p>
      <div className="-mx-4 mt-5 flex gap-4 overflow-x-auto px-4 pb-3">
        {topics.map((t) => (
          <TopicCard key={t.id} topic={t} />
        ))}
      </div>
    </section>
  );
}
