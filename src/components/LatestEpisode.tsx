import Link from "next/link";
import { formatDate, formatDuration } from "@/lib/format";
import type { LatestEpisode as Latest } from "@/lib/queries";
import { PlayLink } from "./VideoPlayer";

export function LatestEpisode({ video }: { video: Latest }) {
  return (
    <section aria-labelledby="latest-episode" className="mb-12">
      <div className="grid overflow-hidden rounded-2xl border border-amber/30 bg-surface/80 shadow-[0_0_80px_-30px] shadow-amber/50 md:grid-cols-[minmax(0,1.5fr)_1fr]">
        <PlayLink video={video} ariaLabel={`Play ${video.title}`} className="group relative block aspect-video overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={video.thumbnailUrl}
            alt=""
            className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:via-transparent md:to-surface/80" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-amber text-ink shadow-[0_0_40px] shadow-amber/60 transition duration-300 group-hover:scale-110 sm:h-20 sm:w-20">
              <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7 fill-current sm:h-9 sm:w-9" aria-hidden="true">
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
          {video.durationSeconds > 0 ? (
            <span className="absolute bottom-3 right-3 rounded bg-ink/85 px-2 py-0.5 text-xs font-medium tabular-nums text-parchment">
              {formatDuration(video.durationSeconds)}
            </span>
          ) : null}
        </PlayLink>

        <div className="flex flex-col justify-center gap-4 p-5 sm:p-8">
          <p id="latest-episode" className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-amber">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber" />
            </span>
            Latest episode
          </p>
          <h2 className="font-display text-2xl font-bold leading-tight text-parchment sm:text-3xl">{video.title}</h2>
          <p className="text-sm text-muted">{formatDate(video.publishedAt)}</p>

          {video.heroes.length || video.topics.length ? (
            <div className="flex flex-wrap gap-2">
              {video.heroes.slice(0, 6).map((h) => (
                <Link
                  key={h.slug}
                  href={`/hero/${h.slug}`}
                  className="flex items-center gap-1.5 rounded-full border border-line bg-ink/60 py-1 pl-1 pr-3 text-sm text-parchment transition hover:border-amber/60 hover:text-amber-soft"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={h.iconUrl} alt="" className="h-5 w-5" />
                  {h.name}
                </Link>
              ))}
              {video.topics.map((t) => (
                <Link
                  key={t.slug}
                  href={`/lore/${t.slug}`}
                  className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-sm text-amber transition hover:bg-amber/20"
                >
                  {t.name}
                </Link>
              ))}
            </div>
          ) : null}

          <PlayLink
            video={video}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-amber px-6 py-2.5 font-semibold text-ink transition hover:bg-amber-soft hover:shadow-[0_0_24px] hover:shadow-amber/50"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
            Watch now
          </PlayLink>
        </div>
      </div>
    </section>
  );
}
