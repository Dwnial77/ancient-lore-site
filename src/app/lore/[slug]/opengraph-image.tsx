import { OG_SIZE, ogCard } from "@/lib/og";
import { getTopicPage } from "@/lib/queries";

export const runtime = "nodejs";
export const alt = "Ancient Lore";
export const size = OG_SIZE;
export const contentType = "image/png";
export const revalidate = 3600;

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getTopicPage(slug);
  if (!data) {
    return ogCard({ eyebrow: "Dota 2 lore", title: "Beyond the Heroes", subtitle: "ancient-lore.vercel.app" });
  }
  const { topic } = data;
  return ogCard({
    eyebrow: topic.kind === "series" ? "Series" : "World lore",
    title: topic.name,
    subtitle: topic.episodes ? `${topic.episodes} ${topic.episodes === 1 ? "episode" : "episodes"}` : "Coming soon",
    imageUrl: topic.coverUrl,
  });
}
