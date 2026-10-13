import type { Attribute } from "@/db/schema";

const OPENDOTA_HEROES_URL = "https://api.opendota.com/api/constants/heroes";
const STEAM_CDN = "https://cdn.cloudflare.steamstatic.com/apps/dota2/images/dota_react/heroes";

export type OpenDotaHero = {
  id: number;
  name: string; // npc_dota_hero_antimage
  localized_name: string; // Anti-Mage
  primary_attr: string; // str | agi | int | all
};

export type HeroRow = {
  id: number;
  slug: string;
  name: string;
  attribute: Attribute;
  imageUrl: string;
  iconUrl: string;
};

/** "Nature's Prophet" -> "natures-prophet" */
export function slugify(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const ATTRS: Attribute[] = ["str", "agi", "int", "all"];

export function mapOpenDotaHeroes(data: Record<string, OpenDotaHero>): HeroRow[] {
  return Object.values(data)
    .filter((h) => h && typeof h.id === "number" && h.name && h.localized_name)
    .map((h) => {
      const cdnKey = h.name.replace(/^npc_dota_hero_/, "");
      const attribute = (ATTRS as string[]).includes(h.primary_attr) ? (h.primary_attr as Attribute) : "all";
      return {
        id: h.id,
        slug: slugify(h.localized_name),
        name: h.localized_name,
        attribute,
        imageUrl: `${STEAM_CDN}/${cdnKey}.png`,
        iconUrl: `${STEAM_CDN}/icons/${cdnKey}.png`,
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchOpenDotaHeroes(): Promise<HeroRow[]> {
  const res = await fetch(OPENDOTA_HEROES_URL, { cache: "no-store" });
  if (!res.ok) throw new Error(`OpenDota responded ${res.status}`);
  return mapOpenDotaHeroes((await res.json()) as Record<string, OpenDotaHero>);
}
