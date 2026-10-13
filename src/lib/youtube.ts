const API = "https://www.googleapis.com/youtube/v3";

export type ChannelVideo = {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: Date;
  durationSeconds: number;
};

/** Parses ISO-8601 durations such as "PT1H2M10S" or "P1DT2H". */
export function parseIsoDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return Math.round(
    Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0),
  );
}

type Thumb = { url: string; width?: number; height?: number };
type Thumbs = Partial<Record<"default" | "medium" | "high" | "standard" | "maxres", Thumb>>;

export function bestThumbnail(thumbs: Thumbs | undefined, id: string): string {
  const t = thumbs ?? {};
  return (
    t.maxres?.url ??
    t.standard?.url ??
    t.high?.url ??
    t.medium?.url ??
    t.default?.url ??
    `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
  );
}

/** YouTube Shorts can be up to 3 minutes long. */
export const SHORTS_MAX_SECONDS = 180;

export function looksLikeShort(title: string, description: string): boolean {
  return /#shorts?\b/i.test(`${title} ${description}`);
}

async function yt<T>(path: string, params: Record<string, string>): Promise<T> {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error("YOUTUBE_API_KEY is not set");
  const qs = new URLSearchParams({ ...params, key });
  const res = await fetch(`${API}/${path}?${qs}`, { cache: "no-store" });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`YouTube API ${path} responded ${res.status}: ${body.slice(0, 300)}`);
  }
  return (await res.json()) as T;
}

/**
 * For short-duration uploads, ask youtube.com whether /shorts/<id> exists.
 * Regular videos redirect to /watch; Shorts answer 200. Falls back to "is a Short".
 */
async function isShortOnYouTube(id: string): Promise<boolean> {
  try {
    const res = await fetch(`https://www.youtube.com/shorts/${id}`, {
      method: "HEAD",
      redirect: "manual",
      cache: "no-store",
    });
    return res.status === 200;
  } catch {
    return true;
  }
}

/** Fetches every public, non-Short, non-live upload of the channel. */
export async function fetchChannelVideos(channelId: string): Promise<ChannelVideo[]> {
  const channel = await yt<{ items?: { contentDetails: { relatedPlaylists: { uploads: string } } }[] }>(
    "channels",
    { part: "contentDetails", id: channelId },
  );
  const uploads = channel.items?.[0]?.contentDetails.relatedPlaylists.uploads;
  if (!uploads) throw new Error(`Channel ${channelId} not found`);

  const ids: string[] = [];
  let pageToken: string | undefined;
  do {
    const page = await yt<{
      items?: { contentDetails: { videoId: string } }[];
      nextPageToken?: string;
    }>("playlistItems", {
      part: "contentDetails",
      playlistId: uploads,
      maxResults: "50",
      ...(pageToken ? { pageToken } : {}),
    });
    for (const item of page.items ?? []) ids.push(item.contentDetails.videoId);
    pageToken = page.nextPageToken;
  } while (pageToken);

  const result: ChannelVideo[] = [];
  for (let i = 0; i < ids.length; i += 50) {
    const batch = await yt<{
      items?: {
        id: string;
        snippet: {
          title: string;
          description: string;
          publishedAt: string;
          thumbnails: Thumbs;
          liveBroadcastContent?: string;
        };
        contentDetails: { duration: string };
        status?: { privacyStatus?: string };
      }[];
    }>("videos", { part: "snippet,contentDetails,status", id: ids.slice(i, i + 50).join(",") });

    for (const v of batch.items ?? []) {
      if (v.status?.privacyStatus && v.status.privacyStatus !== "public") continue;
      if (v.snippet.liveBroadcastContent && v.snippet.liveBroadcastContent !== "none") continue;
      const durationSeconds = parseIsoDuration(v.contentDetails.duration);
      if (durationSeconds === 0) continue;
      if (looksLikeShort(v.snippet.title, v.snippet.description)) continue;
      if (durationSeconds <= SHORTS_MAX_SECONDS && (await isShortOnYouTube(v.id))) continue;
      result.push({
        youtubeId: v.id,
        title: v.snippet.title,
        thumbnailUrl: bestThumbnail(v.snippet.thumbnails, v.id),
        publishedAt: new Date(v.snippet.publishedAt),
        durationSeconds,
      });
    }
  }
  return result;
}
