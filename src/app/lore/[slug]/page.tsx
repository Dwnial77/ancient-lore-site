import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TOPIC_KIND_LABELS, TopicCover } from "@/components/TopicCard";
import { VideoCard } from "@/components/VideoCard";
import { getTopicPage } from "@/lib/queries";

export const revalidate = 3600;
export const dynamicParams = true;

export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getTopicPage(slug);
  if (!data) return { title: "Not found" };
  return {
    title: data.topic.name,
    description: data.topic.description ?? `Ancient Lore episodes about ${data.topic.name} — Dota 2 lore beyond the heroes.`,
  };
}

export default async function TopicPage({ params }: Props) {
  const { slug } = await params;
  const data = await getTopicPage(slug);
  if (!data) notFound();
  const { topic, videos } = data;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-amber">
        <span aria-hidden="true">←</span> Back to the archive
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-2xl border border-line">
        <div className="absolute inset-0 scale-110 opacity-40 blur-2xl" aria-hidden="true">
          <TopicCover topic={topic} />
        </div>
        <div className="relative grid items-end gap-6 p-5 sm:grid-cols-[minmax(0,1.2fr)_1fr] sm:p-10">
          <div className="aspect-video overflow-hidden rounded-xl border border-amber/30 shadow-[0_0_60px_-10px] shadow-amber/40">
            <TopicCover topic={topic} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-amber">{TOPIC_KIND_LABELS[topic.kind]}</p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-none text-gradient-amber sm:text-6xl">{topic.name}</h1>
            {topic.description ? <p className="mt-4 text-parchment/80">{topic.description}</p> : null}
            <p className="mt-3 text-sm text-muted">
              {topic.episodes ? `${topic.episodes} ${topic.episodes === 1 ? "episode" : "episodes"}` : "Coming soon"}
            </p>
          </div>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="divider-ornament font-display text-xl font-semibold tracking-[0.2em] text-amber">EPISODES</h2>
        {videos.length ? (
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {videos.map((v) => (
              <VideoCard key={v.youtubeId} video={v} />
            ))}
          </div>
        ) : (
          <p className="mt-4 text-muted">The first episode is on its way.</p>
        )}
      </section>
    </div>
  );
}
