import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AttributeDot } from "@/components/AttributeDot";
import { VideoCard } from "@/components/VideoCard";
import { VoteButton } from "@/components/VoteButton";
import { ATTRIBUTE_LABELS } from "@/lib/format";
import { getHeroPage } from "@/lib/queries";

export const revalidate = 3600;
export const dynamicParams = true;

// Pages are generated on first request and then cached (ISR).
export function generateStaticParams() {
  return [];
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const data = await getHeroPage(slug);
  if (!data) return { title: "Hero not found" };
  return {
    title: `${data.hero.name} Lore`,
    description: `Ancient Lore episodes featuring ${data.hero.name}, the ${ATTRIBUTE_LABELS[data.hero.attribute]} hero of Dota 2.`,
  };
}

export default async function HeroPage({ params }: Props) {
  const { slug } = await params;
  const data = await getHeroPage(slug);
  if (!data) notFound();
  const { hero, episodes, alsoIn, votes } = data;
  const covered = episodes.length + alsoIn.length > 0;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-20">
      <Link href="/" className="mt-6 inline-flex items-center gap-2 text-sm text-muted transition hover:text-amber">
        <span aria-hidden="true">←</span> All heroes
      </Link>

      <section className="relative mt-4 overflow-hidden rounded-2xl border border-line">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={hero.imageUrl} alt="" aria-hidden="true" className="absolute inset-0 h-full w-full scale-125 object-cover opacity-40 blur-2xl" />
        <div className="relative grid items-end gap-6 p-5 sm:grid-cols-[minmax(0,1.2fr)_1fr] sm:p-10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={hero.imageUrl}
            alt={hero.name}
            className={`w-full rounded-xl border border-amber/30 shadow-[0_0_60px_-10px] shadow-amber/40 ${covered ? "" : "grayscale"}`}
          />
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-muted">
              <AttributeDot attribute={hero.attribute} /> {ATTRIBUTE_LABELS[hero.attribute]}
            </p>
            <h1 className="mt-3 font-display text-4xl font-bold leading-none text-gradient-amber sm:text-6xl">{hero.name}</h1>
            <p className="mt-4 text-parchment/80">
              {covered
                ? `${episodes.length} ${episodes.length === 1 ? "episode" : "episodes"} · appears in ${alsoIn.length} more`
                : "This legend has not been told yet."}
            </p>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-ink/80 to-transparent" />
      </section>

      {covered ? (
        <>
          <section className="mt-12">
            <h2 className="divider-ornament font-display text-xl font-semibold tracking-[0.2em] text-amber">EPISODES</h2>
            {episodes.length ? (
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {episodes.map((v) => (
                  <VideoCard key={v.youtubeId} video={v} />
                ))}
              </div>
            ) : (
              <p className="mt-4 text-muted">No dedicated episode yet.</p>
            )}
          </section>

          {alsoIn.length ? (
            <section className="mt-14">
              <h2 className="divider-ornament font-display text-xl font-semibold tracking-[0.2em] text-amber">ALSO APPEARS IN</h2>
              <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {alsoIn.map((v) => (
                  <VideoCard key={v.youtubeId} video={v} showRole />
                ))}
              </div>
            </section>
          ) : null}
        </>
      ) : (
        <section className="mt-12 rounded-2xl border border-dashed border-amber/40 bg-surface/60 p-8 text-center sm:p-12">
          <p className="font-display text-2xl tracking-[0.2em] text-amber">COMING SOON</p>
          <p className="mx-auto mt-3 max-w-md text-muted">
            Want {hero.name}&apos;s story told next? Cast your vote — the most wanted heroes get chronicled first.
          </p>
          <div className="mt-6 flex justify-center">
            <VoteButton heroId={hero.id} initialVotes={votes} size="lg" />
          </div>
        </section>
      )}
    </div>
  );
}
