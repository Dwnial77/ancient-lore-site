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

/** "18:42" → 1122, "1:02:03" → 3723, "95" → 95. Returns null for invalid input. */
export function parseDurationInput(input: string): number | null {
  const parts = input.trim().split(":");
  if (parts.length === 0 || parts.length > 3 || parts.some((p) => !/^\d+$/.test(p))) return null;
  const nums = parts.map(Number);
  if (nums.slice(1).some((n) => n >= 60)) return null;
  return nums.reduce((total, n) => total * 60 + n, 0);
}
