import { ATTRIBUTE_LABELS } from "@/lib/format";
import { OG_SIZE, ogCard } from "@/lib/og";
import { getHeroPage } from "@/lib/queries";

export const runtime = "nodejs";
export const alt = "Ancient Lore hero";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getHeroPage(slug);
  if (!data) {
    return ogCard({ eyebrow: "Dota 2 lore", title: "The Archive of Heroes", subtitle: "ancient-lore.vercel.app" });
  }
  const count = data.episodes.length + data.alsoIn.length;
  return ogCard({
    eyebrow: `${ATTRIBUTE_LABELS[data.hero.attribute]} hero`,
    title: data.hero.name,
    subtitle: count ? `${count} ${count === 1 ? "episode" : "episodes"} · watch the lore` : "Coming soon · vote for this hero",
    imageUrl: data.hero.imageUrl,
    dimImage: count === 0,
  });
}
