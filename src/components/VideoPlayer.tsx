"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { youtubeUrl } from "@/lib/format";

type PlayerVideo = { youtubeId: string; title: string };

const PlayerContext = createContext<(video: PlayerVideo) => void>(() => {});

/** Opens a video in the in-site player. */
export function usePlayer() {
  return useContext(PlayerContext);
}

export function VideoPlayerProvider({ children }: { children: React.ReactNode }) {
  const [video, setVideo] = useState<PlayerVideo | null>(null);
  const [mounted, setMounted] = useState(false);
  const close = useCallback(() => setVideo(null), []);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!video) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [video, close]);

  return (
    <PlayerContext.Provider value={setVideo}>
      {children}
      {mounted
        ? createPortal(
            <AnimatePresence>
              {video ? (
                <motion.div
                  key="player"
                  role="dialog"
                  aria-modal="true"
                  aria-label={video.title}
                  className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-3 backdrop-blur-sm sm:p-8"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={close}
                >
                  <motion.div
                    className="w-full max-w-5xl"
                    initial={{ scale: 0.94, y: 12 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.96, y: 8 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="mb-3 flex items-start gap-3">
                      <h2 className="min-w-0 flex-1 font-display text-base font-semibold leading-snug text-parchment sm:text-xl">
                        {video.title}
                      </h2>
                      <button
                        type="button"
                        onClick={close}
                        aria-label="Close player"
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-line bg-surface text-parchment transition hover:border-amber hover:text-amber"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="aspect-video overflow-hidden rounded-xl border border-amber/30 bg-black shadow-[0_0_80px_-20px] shadow-amber/50">
                      <iframe
                        src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                        title={video.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                    <div className="mt-3 flex justify-end">
                      <a
                        href={youtubeUrl(video.youtubeId)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted transition hover:text-amber"
                      >
                        Like &amp; comment on YouTube ↗
                      </a>
                    </div>
                  </motion.div>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body,
          )
        : null}
    </PlayerContext.Provider>
  );
}

/** Link to the YouTube video that opens the in-site player on a normal click. */
export function PlayLink({
  video,
  className,
  children,
  ariaLabel,
}: {
  video: PlayerVideo;
  className?: string;
  children: React.ReactNode;
  ariaLabel?: string;
}) {
  const open = usePlayer();
  return (
    <a
      href={youtubeUrl(video.youtubeId)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={ariaLabel}
      className={className}
      onClick={(e) => {
        // Let ctrl/cmd/middle-click open YouTube in a new tab as usual.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        open(video);
      }}
    >
      {children}
    </a>
  );
}
