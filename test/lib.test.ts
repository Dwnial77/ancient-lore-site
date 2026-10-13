import { describe, expect, it } from "vitest";
import { detectHeroes } from "@/lib/detect-heroes";
import { formatDuration, parseDurationInput } from "@/lib/format";
import { mapOpenDotaHeroes, slugify } from "@/lib/opendota";
import { voterHash, voteDay, clientIp } from "@/lib/voter";
import { parseIsoDuration, parseWatchPage, parseYouTubeId } from "@/lib/youtube";
import { OPENDOTA_SAMPLE } from "./fixtures-heroes";

const heroes = mapOpenDotaHeroes(OPENDOTA_SAMPLE);
const id = (slug: string) => heroes.find((h) => h.slug === slug)!.id;

describe("opendota mapping", () => {
  it("builds slugs, attributes and Steam CDN urls", () => {
    const np = heroes.find((h) => h.id === 53)!;
    expect(np.slug).toBe("natures-prophet");
    expect(np.attribute).toBe("int");
    expect(np.imageUrl).toBe("https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/furion.png");
    expect(np.iconUrl).toBe("https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes/icons/furion.png");
    expect(heroes.find((h) => h.id === 74)!.attribute).toBe("all");
    expect(slugify("Anti-Mage")).toBe("anti-mage");
  });
});

describe("detectHeroes", () => {
  it("finds names, aliases and lore names", () => {
    expect(detectHeroes("The Tragedy of Anti-Mage | Dota 2 Lore", heroes)).toEqual([id("anti-mage")]);
    expect(detectHeroes("Magina's Oath", heroes)).toEqual([id("anti-mage")]);
    expect(detectHeroes("Yurnero vs Nevermore", heroes).sort()).toEqual([id("juggernaut"), id("shadow-fiend")].sort());
    expect(detectHeroes("Furion and the Outworld Devourer", heroes).sort()).toEqual(
      [id("natures-prophet"), id("outworld-destroyer")].sort(),
    );
    expect(detectHeroes("NATURE’S PROPHET: Verodicia's Wrath", heroes)).toEqual([id("natures-prophet")]);
  });

  it("avoids common-word false positives", () => {
    expect(detectHeroes("the lion king and an axe", heroes)).toEqual([]);
    expect(detectHeroes("Radio silence", heroes)).toEqual([]);
    expect(detectHeroes("Axe: The Red Mist General", heroes)).toEqual([id("axe")]);
    expect(detectHeroes("TERRORBLADE — Demon Marauder", heroes)).toEqual([id("terrorblade")]);
  });

  it("detects topics with the same matcher", () => {
    const topics = [
      { id: 1, slug: "what-if", name: "What If" },
      { id: 2, slug: "roshan", name: "Roshan" },
      { id: 3, slug: "the-shopkeeper", name: "The Shopkeeper" },
    ];
    expect(detectHeroes("What If Roshan Never Died? | Dota 2 Lore", topics)).toEqual([1, 2]);
    expect(detectHeroes("WHAT IF... the Shopkeeper was a god", topics).sort()).toEqual([1, 3]);
    expect(detectHeroes("Juggernaut: The Last Blade", topics)).toEqual([]);
  });

  it("prefers the longest match", () => {
    expect(detectHeroes("Shadow Shaman rituals", heroes)).toEqual([id("shadow-shaman")]);
  });
});

describe("youtube helpers", () => {
  it("extracts video ids from every link format", () => {
    const id = "dQw4w9WgXcQ";
    for (const url of [
      id,
      `https://www.youtube.com/watch?v=${id}`,
      `https://youtube.com/watch?v=${id}&t=42s&list=PL123`,
      `https://m.youtube.com/watch?v=${id}`,
      `https://youtu.be/${id}?si=abc`,
      `youtu.be/${id}`,
      `https://www.youtube.com/shorts/${id}`,
      `https://www.youtube.com/embed/${id}`,
      `https://www.youtube.com/live/${id}?feature=share`,
    ]) {
      expect(parseYouTubeId(url)).toBe(id);
    }
    expect(parseYouTubeId("https://www.youtube.com/@AncientLore")).toBeNull();
    expect(parseYouTubeId("https://example.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(parseYouTubeId("hello")).toBeNull();
  });

  it("parses duration, date and title from a watch page", () => {
    const html = `<meta name="title" content="Juggernaut &amp; the Mask | Dota 2 Lore">
      <script>var ytInitialPlayerResponse = {"videoDetails":{"lengthSeconds":"1122"},
      "microformat":{"playerMicroformatRenderer":{"publishDate":"2026-03-03T05:00:12-08:00"}}};</script>`;
    const info = parseWatchPage(html);
    expect(info.durationSeconds).toBe(1122);
    expect(info.publishedAt?.toISOString()).toBe("2026-03-03T13:00:12.000Z");
    expect(info.title).toBe("Juggernaut & the Mask | Dota 2 Lore");

    const meta = parseWatchPage(
      `<meta itemprop="duration" content="PT20M5S"><meta itemprop="datePublished" content="2026-04-01">`,
    );
    expect(meta.durationSeconds).toBe(1205);
    expect(meta.publishedAt?.toISOString().slice(0, 10)).toBe("2026-04-01");
    expect(parseWatchPage("<html></html>")).toEqual({ durationSeconds: null, publishedAt: null, title: null });
  });

  it("parses and formats durations", () => {
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(formatDuration(1122)).toBe("18:42");
    expect(formatDuration(3723)).toBe("1:02:03");
    expect(parseDurationInput("18:42")).toBe(1122);
    expect(parseDurationInput("1:02:03")).toBe(3723);
    expect(parseDurationInput("95")).toBe(95);
    expect(parseDurationInput("1:75")).toBeNull();
    expect(parseDurationInput("abc")).toBeNull();
  });
});

describe("voter hashing", () => {
  it("never stores the raw ip and is stable", () => {
    process.env.SESSION_SECRET = "x".repeat(40);
    const h = voterHash("203.0.113.7");
    expect(h).toMatch(/^[a-f0-9]{64}$/);
    expect(h).not.toContain("203.0.113.7");
    expect(voterHash("203.0.113.7")).toBe(h);
    expect(voteDay(new Date("2026-10-13T23:59:00Z"))).toBe("2026-10-13");
    expect(clientIp(new Headers({ "x-forwarded-for": "203.0.113.7, 10.0.0.1" }))).toBe("203.0.113.7");
  });
});
