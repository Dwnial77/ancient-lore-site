/**
 * Key-less YouTube helpers: the admin pastes a video link and we fill in the details from
 * YouTube's public oEmbed endpoint and the public watch page. No API key is needed.
 */

const ID_RE = /^[A-Za-z0-9_-]{11}$/;

/** Extracts the 11-character video id from any common YouTube URL format (or a bare id). */
export function parseYouTubeId(input: string): string | null {
  const raw = input.trim();
  if (ID_RE.test(raw)) return raw;
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }
  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const m = /^\/(?:shorts|embed|live|v)\/([^/?#]+)/.exec(url.pathname);
      id = m?.[1] ?? null;
    }
  }
  return id && ID_RE.test(id) ? id : null;
}

/** Parses ISO-8601 durations such as "PT1H2M10S". */
export function parseIsoDuration(iso: string): number {
  const m = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/.exec(iso ?? "");
  if (!m) return 0;
  const [, d, h, min, s] = m;
  return Math.round(Number(d ?? 0) * 86400 + Number(h ?? 0) * 3600 + Number(min ?? 0) * 60 + Number(s ?? 0));
}

export type WatchPageInfo = { durationSeconds: number | null; publishedAt: Date | null; title: string | null };

/** Pulls duration, publish date and title out of a YouTube watch page's HTML. */
export function parseWatchPage(html: string): WatchPageInfo {
  let durationSeconds: number | null = null;
  const len = /"lengthSeconds"\s*:\s*"(\d+)"/.exec(html);
  if (len) durationSeconds = Number(len[1]);
  else {
    const iso = /itemprop="duration"\s+content="([^"]+)"/.exec(html);
    if (iso) durationSeconds = parseIsoDuration(iso[1]) || null;
  }

  let publishedAt: Date | null = null;
  const date =
    /"publishDate"\s*:\s*"([^"]+)"/.exec(html) ??
    /"uploadDate"\s*:\s*"([^"]+)"/.exec(html) ??
    /itemprop="(?:datePublished|uploadDate)"\s+content="([^"]+)"/.exec(html);
  if (date) {
    const d = new Date(date[1]);
    if (!Number.isNaN(d.getTime())) publishedAt = d;
  }

  const t = /<meta\s+name="title"\s+content="([^"]*)"/.exec(html);
  const title = t ? decodeEntities(t[1]) : null;

  return { durationSeconds, publishedAt, title };
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export type VideoLookup = {
  youtubeId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: Date | null;
  durationSeconds: number | null;
};

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "CONSENT=YES+1",
};

async function bestThumbnail(id: string): Promise<string> {
  const maxres = `https://i.ytimg.com/vi/${id}/maxresdefault.jpg`;
  try {
    const res = await fetch(maxres, { method: "HEAD", cache: "no-store" });
    if (res.ok) return maxres;
  } catch {
    /* fall through */
  }
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/**
 * Looks up a video's details. Returns null when the video doesn't exist or is private.
 * Duration / publish date are best-effort and may be null; the admin can fill them in.
 */
export async function lookupVideo(id: string): Promise<VideoLookup | null> {
  const watchUrl = `https://www.youtube.com/watch?v=${id}`;
  const [oembed, page, thumbnailUrl] = await Promise.all([
    fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(watchUrl)}`, { cache: "no-store" })
      .then(async (r) => (r.ok ? ((await r.json()) as { title?: string }) : null))
      .catch(() => null),
    fetch(`${watchUrl}&hl=en`, { headers: BROWSER_HEADERS, cache: "no-store" })
      .then(async (r) => (r.ok ? parseWatchPage(await r.text()) : null))
      .catch(() => null),
    bestThumbnail(id),
  ]);

  const title = oembed?.title ?? page?.title;
  if (!title) return null;
  return {
    youtubeId: id,
    title,
    thumbnailUrl,
    publishedAt: page?.publishedAt ?? null,
    durationSeconds: page?.durationSeconds ?? null,
  };
}
