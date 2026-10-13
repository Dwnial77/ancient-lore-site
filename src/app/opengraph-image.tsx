import { OG_SIZE, ogCard } from "@/lib/og";

export const runtime = "nodejs";
export const alt = "Ancient Lore — The Archive of Dota 2 Heroes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return ogCard({
    eyebrow: "Cinematic Dota 2 lore",
    title: "The Archive of Heroes",
    subtitle: "Every legend, one story at a time",
  });
}
