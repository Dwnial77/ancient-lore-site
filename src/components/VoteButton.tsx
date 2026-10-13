"use client";

import { useEffect, useState } from "react";

const storageKey = () => `al-votes-${new Date().toISOString().slice(0, 10)}`;

function readVoted(): number[] {
  try {
    return JSON.parse(localStorage.getItem(storageKey()) ?? "[]") as number[];
  } catch {
    return [];
  }
}

function rememberVote(heroId: number) {
  try {
    localStorage.setItem(storageKey(), JSON.stringify([...new Set([...readVoted(), heroId])]));
  } catch {
    /* storage unavailable – server still enforces the limit */
  }
}

export function VoteButton({
  heroId,
  initialVotes,
  size = "sm",
}: {
  heroId: number;
  initialVotes: number;
  size?: "sm" | "lg";
}) {
  const [votes, setVotes] = useState(initialVotes);
  const [voted, setVoted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    setVoted(readVoted().includes(heroId));
  }, [heroId]);

  async function vote() {
    if (voted || busy) return;
    setBusy(true);
    setMessage(null);
    setVotes((v) => v + 1);
    setVoted(true);
    try {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ heroId }),
      });
      const data = (await res.json()) as { votes?: number; error?: string };
      if (typeof data.votes === "number") setVotes(data.votes);
      if (res.ok || res.status === 409) rememberVote(heroId);
      if (!res.ok) {
        setMessage(data.error ?? "Vote failed");
        if (res.status !== 409) setVoted(false);
      } else {
        setMessage("Thanks for voting!");
      }
    } catch {
      setVotes((v) => v - 1);
      setVoted(false);
      setMessage("Network error");
    } finally {
      setBusy(false);
    }
  }

  const lg = size === "lg";
  return (
    <div className={lg ? "flex flex-col items-center gap-2" : "relative"}>
      <button
        type="button"
        onClick={vote}
        disabled={voted || busy}
        title={voted ? "You voted for this hero today" : "Vote for this hero to get an episode next"}
        aria-label={voted ? `Voted (${votes} votes)` : `Vote for this hero (${votes} votes)`}
        className={[
          "inline-flex items-center gap-1.5 rounded-full border font-semibold transition-all",
          lg ? "px-6 py-3 text-base" : "px-2.5 py-1 text-xs",
          voted
            ? "border-amber bg-amber text-ink"
            : "border-amber/60 bg-ink/80 text-amber backdrop-blur hover:bg-amber hover:text-ink hover:shadow-[0_0_18px] hover:shadow-amber/50 active:scale-95",
        ].join(" ")}
      >
        <svg viewBox="0 0 24 24" className={lg ? "h-5 w-5" : "h-3 w-3"} fill="currentColor" aria-hidden="true">
          <path d="M12 4 3 15h6v5h6v-5h6z" />
        </svg>
        {lg ? (voted ? "Voted" : "Vote for this hero") : null}
        <span className="tabular-nums">{votes}</span>
      </button>
      {lg && message ? <p className="text-sm text-muted">{message}</p> : null}
    </div>
  );
}
