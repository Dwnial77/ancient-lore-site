import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, hasDatabase, schema } from "@/db";
import type { Attribute, Role, TopicKind } from "@/db/schema";
import { ensureHeroes } from "./heroes";

const { heroes, videos, appearances, votes, topics, videoTopics } = schema;

export type HeroSummary = {
  id: number;
  slug: string;
  name: string;
  attribute: Attribute;
  imageUrl: string;
  iconUrl: string;
  episodes: number; // confirmed videos the hero appears in (any role)
  votes: number;
};

export type TopVote = { id: number; slug: string; name: string; iconUrl: string; votes: number };

export type HomeData = { heroes: HeroSummary[]; topVotes: TopVote[]; videoCount: number };

/** Public pages only count appearances that have been reviewed. */
const confirmed = eq(appearances.needsReview, false);

export async function getHomeData(): Promise<HomeData> {
  if (!hasDatabase()) return { heroes: [], topVotes: [], videoCount: 0 };
  await ensureHeroes();
  const db = getDb();

  const episodeCounts = db
    .select({
      heroId: appearances.heroId,
      episodes: sql<number>`count(distinct ${appearances.videoId})::int`.as("episodes"),
    })
    .from(appearances)
    .where(confirmed)
    .groupBy(appearances.heroId)
    .as("ep");

  const voteCounts = db
    .select({ heroId: votes.heroId, votes: sql<number>`count(*)::int`.as("votes") })
    .from(votes)
    .groupBy(votes.heroId)
    .as("vc");

  const [rows, [{ videoCount }]] = await Promise.all([
    db
      .select({
        id: heroes.id,
        slug: heroes.slug,
        name: heroes.name,
        attribute: heroes.attribute,
        imageUrl: heroes.imageUrl,
        iconUrl: heroes.iconUrl,
        episodes: sql<number>`coalesce(${episodeCounts.episodes}, 0)::int`,
        votes: sql<number>`coalesce(${voteCounts.votes}, 0)::int`,
      })
      .from(heroes)
      .leftJoin(episodeCounts, eq(episodeCounts.heroId, heroes.id))
      .leftJoin(voteCounts, eq(voteCounts.heroId, heroes.id)),
    db.select({ videoCount: sql<number>`count(*)::int` }).from(videos),
  ]);

  const sorted = rows.sort(
    (a, b) => Number(b.episodes > 0) - Number(a.episodes > 0) || a.name.localeCompare(b.name),
  );

  const topVotes = sorted
    .filter((h) => h.episodes === 0 && h.votes > 0)
    .sort((a, b) => b.votes - a.votes || a.name.localeCompare(b.name))
    .slice(0, 10)
    .map(({ id, slug, name, iconUrl, votes }) => ({ id, slug, name, iconUrl, votes }));

  return { heroes: sorted, topVotes, videoCount };
}

/** Fields a public video card needs. */
export type EpisodeVideo = {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: Date;
  durationSeconds: number;
  role?: Role;
  note?: string | null;
};

export type HeroVideo = EpisodeVideo & { role: Role; note: string | null };

export async function getHeroPage(slug: string) {
  if (!hasDatabase()) return null;
  await ensureHeroes();
  const db = getDb();
  const [hero] = await db.select().from(heroes).where(eq(heroes.slug, slug)).limit(1);
  if (!hero) return null;

  const [list, [{ votes: voteCount }]] = await Promise.all([
    db
      .select({
        youtubeId: videos.youtubeId,
        title: videos.title,
        thumbnailUrl: videos.thumbnailUrl,
        publishedAt: videos.publishedAt,
        durationSeconds: videos.durationSeconds,
        role: appearances.role,
        note: appearances.note,
      })
      .from(appearances)
      .innerJoin(videos, eq(videos.youtubeId, appearances.videoId))
      .where(and(eq(appearances.heroId, hero.id), confirmed))
      .orderBy(desc(videos.publishedAt)),
    db.select({ votes: sql<number>`count(*)::int` }).from(votes).where(eq(votes.heroId, hero.id)),
  ]);

  return {
    hero,
    votes: voteCount,
    episodes: list.filter((v) => v.role === "main"),
    alsoIn: list.filter((v) => v.role !== "main"),
  };
}

// ---------- Topics ("Beyond the Heroes") ----------

const topicConfirmed = eq(videoTopics.needsReview, false);

export type TopicSummary = {
  id: number;
  slug: string;
  name: string;
  kind: TopicKind;
  description: string | null;
  coverUrl: string | null;
  episodes: number;
};

/** Custom cover, else the newest confirmed episode's thumbnail. */
const coverSql = sql<string | null>`coalesce(${topics.imageUrl}, (
  select ${videos.thumbnailUrl} from ${videoTopics}
  join ${videos} on ${videos.youtubeId} = ${videoTopics.videoId}
  where ${videoTopics.topicId} = ${topics.id} and ${videoTopics.needsReview} = false
  order by ${videos.publishedAt} desc limit 1))`;

const episodeCountSql = sql<number>`(select count(*)::int from ${videoTopics}
  where ${videoTopics.topicId} = ${topics.id} and ${videoTopics.needsReview} = false)`;

export async function getTopicsSummary(): Promise<TopicSummary[]> {
  if (!hasDatabase()) return [];
  return getDb()
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      kind: topics.kind,
      description: topics.description,
      coverUrl: coverSql,
      episodes: episodeCountSql,
    })
    .from(topics)
    .orderBy(asc(topics.sortOrder), asc(topics.name));
}

export async function getTopicPage(slug: string) {
  if (!hasDatabase()) return null;
  const db = getDb();
  const [topic] = await db
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      kind: topics.kind,
      description: topics.description,
      coverUrl: coverSql,
      episodes: episodeCountSql,
    })
    .from(topics)
    .where(eq(topics.slug, slug))
    .limit(1);
  if (!topic) return null;

  const list: EpisodeVideo[] = await db
    .select({
      youtubeId: videos.youtubeId,
      title: videos.title,
      thumbnailUrl: videos.thumbnailUrl,
      publishedAt: videos.publishedAt,
      durationSeconds: videos.durationSeconds,
    })
    .from(videoTopics)
    .innerJoin(videos, eq(videos.youtubeId, videoTopics.videoId))
    .where(and(eq(videoTopics.topicId, topic.id), topicConfirmed))
    .orderBy(desc(videos.publishedAt));

  return { topic, videos: list };
}

export type LatestEpisode = EpisodeVideo & {
  heroes: { slug: string; name: string; iconUrl: string }[];
  topics: { slug: string; name: string }[];
};

export async function getLatestEpisode(): Promise<LatestEpisode | null> {
  if (!hasDatabase()) return null;
  const db = getDb();
  const [video] = await db
    .select({
      youtubeId: videos.youtubeId,
      title: videos.title,
      thumbnailUrl: videos.thumbnailUrl,
      publishedAt: videos.publishedAt,
      durationSeconds: videos.durationSeconds,
    })
    .from(videos)
    .orderBy(desc(videos.publishedAt))
    .limit(1);
  if (!video) return null;

  const [heroRows, topicRows] = await Promise.all([
    db
      .select({ slug: heroes.slug, name: heroes.name, iconUrl: heroes.iconUrl })
      .from(appearances)
      .innerJoin(heroes, eq(heroes.id, appearances.heroId))
      .where(and(eq(appearances.videoId, video.youtubeId), confirmed))
      .orderBy(asc(appearances.role), asc(heroes.name)),
    db
      .select({ slug: topics.slug, name: topics.name })
      .from(videoTopics)
      .innerJoin(topics, eq(topics.id, videoTopics.topicId))
      .where(and(eq(videoTopics.videoId, video.youtubeId), topicConfirmed)),
  ]);
  return { ...video, heroes: heroRows, topics: topicRows };
}

// ---------- Admin ----------

export type AdminAppearance = {
  heroId: number;
  role: Role;
  note: string | null;
  needsReview: boolean;
};

export type AdminTopicLink = { topicId: number; needsReview: boolean };

export type AdminVideo = {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  durationSeconds: number;
  appearances: AdminAppearance[];
  topics: AdminTopicLink[];
};

export type AdminTopic = {
  id: number;
  slug: string;
  name: string;
  kind: TopicKind;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
};

export type PickerHero = { id: number; slug: string; name: string; attribute: Attribute; iconUrl: string };

export async function getAdminData() {
  await ensureHeroes();
  const db = getDb();
  const [videoRows, appearanceRows, heroRows, topicRows, topicLinkRows] = await Promise.all([
    db.select().from(videos).orderBy(desc(videos.publishedAt)),
    db.select().from(appearances).orderBy(asc(appearances.createdAt)),
    db
      .select({
        id: heroes.id,
        slug: heroes.slug,
        name: heroes.name,
        attribute: heroes.attribute,
        iconUrl: heroes.iconUrl,
      })
      .from(heroes)
      .orderBy(asc(heroes.name)),
    getAdminTopics(),
    db.select().from(videoTopics).orderBy(asc(videoTopics.createdAt)),
  ]);

  const topicsByVideo = new Map<string, AdminTopicLink[]>();
  for (const t of topicLinkRows) {
    const list = topicsByVideo.get(t.videoId) ?? [];
    list.push({ topicId: t.topicId, needsReview: t.needsReview });
    topicsByVideo.set(t.videoId, list);
  }

  const byVideo = new Map<string, AdminAppearance[]>();
  for (const a of appearanceRows) {
    const list = byVideo.get(a.videoId) ?? [];
    list.push({ heroId: a.heroId, role: a.role, note: a.note, needsReview: a.needsReview });
    byVideo.set(a.videoId, list);
  }

  const adminVideos: AdminVideo[] = videoRows.map((v) => ({
    youtubeId: v.youtubeId,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    publishedAt: v.publishedAt.toISOString(),
    durationSeconds: v.durationSeconds,
    appearances: byVideo.get(v.youtubeId) ?? [],
    topics: topicsByVideo.get(v.youtubeId) ?? [],
  }));

  return {
    videos: adminVideos,
    heroes: heroRows as PickerHero[],
    topics: topicRows,
  };
}

export async function getAdminTopics(): Promise<AdminTopic[]> {
  return getDb()
    .select({
      id: topics.id,
      slug: topics.slug,
      name: topics.name,
      kind: topics.kind,
      description: topics.description,
      imageUrl: topics.imageUrl,
      sortOrder: topics.sortOrder,
    })
    .from(topics)
    .orderBy(asc(topics.sortOrder), asc(topics.name));
}

export async function getVoteResults() {
  const db = getDb();
  return db
    .select({
      id: heroes.id,
      slug: heroes.slug,
      name: heroes.name,
      iconUrl: heroes.iconUrl,
      total: sql<number>`count(${votes.id})::int`,
      last7: sql<number>`count(${votes.id}) filter (where ${votes.createdAt} > now() - interval '7 days')::int`,
      today: sql<number>`count(${votes.id}) filter (where ${votes.voteDay} = current_date)::int`,
      covered: sql<boolean>`exists (select 1 from ${appearances} where ${appearances.heroId} = ${heroes.id} and ${appearances.needsReview} = false)`,
    })
    .from(votes)
    .innerJoin(heroes, eq(heroes.id, votes.heroId))
    .groupBy(heroes.id)
    .orderBy(desc(sql`count(${votes.id})`), asc(heroes.name));
}
