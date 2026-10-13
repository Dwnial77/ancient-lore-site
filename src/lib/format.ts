export function formatDuration(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  const mm = h > 0 ? String(m).padStart(2, "0") : String(m);
  return `${h > 0 ? `${h}:` : ""}${mm}:${String(s).padStart(2, "0")}`;
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

export const ATTRIBUTE_LABELS = {
  str: "Strength",
  agi: "Agility",
  int: "Intelligence",
  all: "Universal",
} as const;

export const ROLE_LABELS = {
  main: "Main",
  supporting: "Supporting",
  cameo: "Cameo",
} as const;

export function youtubeUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}
