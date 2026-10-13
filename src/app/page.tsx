import { HeroGrid } from "@/components/HeroGrid";
import { LatestEpisode } from "@/components/LatestEpisode";
import { BeyondTheHeroes } from "@/components/TopicCard";
import { TopVotes } from "@/components/TopVotes";
import { getHomeData, getLatestEpisode, getTopicsSummary } from "@/lib/queries";

export const revalidate = 3600;

export default async function HomePage() {
  const [{ heroes, topVotes, videoCount }, latest, topics] = await Promise.all([
    getHomeData(),
    getLatestEpisode(),
    getTopicsSummary(),
  ]);
  const covered = heroes.filter((h) => h.episodes > 0).length;

  return (
    <div className="mx-auto max-w-7xl px-4">
      <section className="pb-10 pt-12 text-center sm:pt-16">
        <p className="text-xs uppercase tracking-[0.4em] text-muted">Cinematic Dota 2 lore</p>
        <h1 className="mt-4 font-display text-4xl font-bold leading-tight text-gradient-amber sm:text-6xl">
          The Archive of Heroes
        </h1>
        <div className="mx-auto mt-5 h-px w-40 bg-gradient-to-r from-transparent via-amber to-transparent" />
        <p className="mx-auto mt-5 max-w-xl text-parchment/80">
          Every legend of the Ancients, told one story at a time. Pick a hero to watch their episodes — or vote for
          who rises next.
        </p>
        <p className="mt-4 text-sm text-muted">
          <span className="text-amber">{covered}</span> heroes chronicled · {heroes.length} heroes total ·{" "}
          {videoCount} episodes
        </p>
      </section>

      {latest ? <LatestEpisode video={latest} /> : null}

      <BeyondTheHeroes topics={topics} />

      <h2 className="mb-4 font-display text-xl font-semibold tracking-[0.2em] text-amber">THE HEROES</h2>

      <div className="md:hidden">
        <TopVotes items={topVotes} variant="scroller" />
      </div>

      <HeroGrid heroes={heroes} />

      <div className="py-10 md:py-14">
        <TopVotes items={topVotes} variant="list" />
      </div>
    </div>
  );
}
