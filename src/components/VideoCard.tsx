"use client";

import type { Role } from "@/db/schema";
import { formatDate, formatDuration, ROLE_LABELS } from "@/lib/format";
import type { EpisodeVideo } from "@/lib/queries";
import { PlayLink } from "./VideoPlayer";

const ROLE_STYLES: Record<Role, string> = {
  main: "border-amber bg-amber text-ink",
  supporting: "border-amber/60 bg-amber/15 text-amber",
  cameo: "border-parchment/30 bg-parchment/10 text-parchment/80",
};

export function RoleBadge({ role }: { role: Role }) {
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${ROLE_STYLES[role]}`}>
      {ROLE_LABELS[role]}
    </span>
  );
}

export function VideoCard({ video, showRole = false }: { video: EpisodeVideo; showRole?: boolean }) {
  return (
    <PlayLink
      video={video}
      className="group block overflow-hidden rounded-xl border border-line bg-surface transition-all duration-300 hover:-translate-y-1 hover:border-amber/70 hover:shadow-[0_10px_40px_-10px] hover:shadow-amber/40"
    >
      <div className="relative aspect-video overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={video.thumbnailUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <div className="absolute inset-0 grid place-items-center bg-ink/0 transition group-hover:bg-ink/30">
          <span className="grid h-14 w-14 scale-75 place-items-center rounded-full bg-amber/90 text-ink opacity-0 shadow-lg transition group-hover:scale-100 group-hover:opacity-100">
            <svg viewBox="0 0 24 24" className="ml-1 h-6 w-6 fill-current" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
        {video.durationSeconds > 0 ? (
          <span className="absolute bottom-2 right-2 rounded bg-ink/85 px-1.5 py-0.5 text-xs font-medium tabular-nums text-parchment">
            {formatDuration(video.durationSeconds)}
          </span>
        ) : null}
      </div>
      <div className="space-y-2 p-4">
        {showRole && video.role ? <RoleBadge role={video.role} /> : null}
        <h3 className="line-clamp-2 font-medium leading-snug text-parchment group-hover:text-amber-soft">{video.title}</h3>
        {video.note ? <p className="text-sm italic text-muted">“{video.note}”</p> : null}
        <p className="text-xs text-muted">
          <time dateTime={new Date(video.publishedAt).toISOString()}>{formatDate(video.publishedAt)}</time>
        </p>
      </div>
    </PlayLink>
  );
}
