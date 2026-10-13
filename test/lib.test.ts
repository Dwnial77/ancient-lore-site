import { describe, expect, it } from "vitest";
import { detectHeroes } from "@/lib/detect-heroes";
import { formatDuration } from "@/lib/format";
import { mapOpenDotaHeroes, slugify } from "@/lib/opendota";
import { voterHash, voteDay, clientIp } from "@/lib/voter";
import { looksLikeShort, parseIsoDuration } from "@/lib/youtube";
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

  it("prefers the longest match", () => {
    expect(detectHeroes("Shadow Shaman rituals", heroes)).toEqual([id("shadow-shaman")]);
  });
});

describe("youtube helpers", () => {
  it("parses ISO-8601 durations", () => {
    expect(parseIsoDuration("PT18M42S")).toBe(1122);
    expect(parseIsoDuration("PT1H2M3S")).toBe(3723);
    expect(parseIsoDuration("PT59S")).toBe(59);
    expect(parseIsoDuration("P0D")).toBe(0);
    expect(parseIsoDuration("garbage")).toBe(0);
    expect(formatDuration(1122)).toBe("18:42");
    expect(formatDuration(3723)).toBe("1:02:03");
  });

  it("detects #shorts", () => {
    expect(looksLikeShort("Pudge in 30s #Shorts", "")).toBe(true);
    expect(looksLikeShort("Pudge Lore", "full story")).toBe(false);
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
