/**
 * Finds Dota 2 hero names (plus well-known lore names and old names) in a video title.
 * Results are only suggestions: they are stored with needs_review = true.
 */

export type DetectableHero = { id: number; slug: string; name: string };

/** Extra names keyed by hero slug. Kept to distinctive names to limit false positives. */
export const HERO_ALIASES: Record<string, string[]> = {
  "anti-mage": ["Antimage", "Anti Mage", "Magina"],
  axe: ["Mogul Khan"],
  bane: ["Atropos"],
  bloodseeker: ["Strygwyr"],
  "crystal-maiden": ["Rylai"],
  "drow-ranger": ["Traxex"],
  earthshaker: ["Raigor"],
  juggernaut: ["Yurnero"],
  "shadow-fiend": ["Nevermore"],
  "phantom-lancer": ["Azwraith"],
  "sand-king": ["Crixalis"],
  "storm-spirit": ["Raijin Thunderkeg"],
  "vengeful-spirit": ["Shendelzare"],
  windranger: ["Lyralei", "Windrunner"],
  "shadow-shaman": ["Rhasta"],
  "witch-doctor": ["Zharvakko"],
  lich: ["Ethreain"],
  tinker: ["Boush"],
  sniper: ["Kardel Sharpeye", "Kardel"],
  necrophos: ["Necrolyte", "Rotund'jere"],
  warlock: ["Demnok Lannik"],
  beastmaster: ["Karroch"],
  "queen-of-pain": ["Akasha"],
  venomancer: ["Lesale"],
  "faceless-void": ["Darkterror"],
  "wraith-king": ["Ostarion", "Skeleton King"],
  "death-prophet": ["Krobelus"],
  "phantom-assassin": ["Mortred"],
  "templar-assassin": ["Lanaya"],
  "dragon-knight": ["Davion"],
  clockwerk: ["Rattletrap"],
  "natures-prophet": ["Furion", "Natures Prophet"],
  lifestealer: ["N'aix", "Naix"],
  "dark-seer": ["Ish'kafel"],
  omniknight: ["Purist Thunderwrath"],
  enchantress: ["Aiushtha"],
  "night-stalker": ["Balanar"],
  broodmother: ["Black Arachnia"],
  "bounty-hunter": ["Gondar"],
  weaver: ["Skitskurr"],
  "ancient-apparition": ["Kaldr"],
  doom: ["Doom Bringer"],
  ursa: ["Ulfsaar"],
  "spirit-breaker": ["Barathrum"],
  gyrocopter: ["Aurel"],
  alchemist: ["Razzil Darkbrew", "Razzil"],
  invoker: ["Arsenal Magus"],
  silencer: ["Nortrom"],
  "outworld-destroyer": ["Outworld Devourer", "Obsidian Destroyer"],
  lycan: ["Banehallow"],
  brewmaster: ["Mangix"],
  "lone-druid": ["Sylla"],
  "chaos-knight": ["Nessaj"],
  "treant-protector": ["Rooftrellen", "Treant"],
  "ogre-magi": ["Aggron Stonebreak"],
  "naga-siren": ["Slithice"],
  "keeper-of-the-light": ["Ezalor", "KotL"],
  "troll-warlord": ["Jah'rakal"],
  "centaur-warrunner": ["Bradwarden"],
  timbersaw: ["Rizzrack"],
  bristleback: ["Rigwarl"],
  "skywrath-mage": ["Dragonus"],
  "legion-commander": ["Tresdin"],
  "ember-spirit": ["Xin"],
  "earth-spirit": ["Kaolin"],
  underlord: ["Vrogros"],
  oracle: ["Nerif"],
  "winter-wyvern": ["Auroth"],
  "arc-warden": ["Zet"],
  "monkey-king": ["Sun Wukong", "Wukong"],
  "dark-willow": ["Mireska"],
  pangolier: ["Donte Panlin"],
  "void-spirit": ["Inai"],
  snapfire: ["Beatrix"],
  dawnbreaker: ["Valora"],
};

function normalize(text: string): string {
  return text
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[’‘`´]/g, "'");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

type Term = { heroId: number; term: string; regex: RegExp };

function buildTerms(heroes: DetectableHero[]): Term[] {
  const terms: Term[] = [];
  for (const hero of heroes) {
    const names = [hero.name, ...(HERO_ALIASES[hero.slug] ?? [])];
    for (const raw of names) {
      const term = normalize(raw);
      // Treat hyphen, space and apostrophe variants alike ("Anti-Mage" / "Anti Mage").
      const body = escapeRegex(term).replace(/\\?-|\s+/g, "[\\s-]*").replace(/'/g, "'?");
      const bounded = (p: string) => `(?<![\\p{L}\\p{N}])(?:${p})(?![\\p{L}\\p{N}])`;
      // Single words like "Axe", "Lion", "Oracle" are also normal English words, so they must
      // appear Capitalized or in ALL CAPS. Multi-word names match case-insensitively.
      const singleWord = !/[\s-]/.test(term);
      const regex = singleWord
        ? new RegExp(bounded(`${body}|${body.toUpperCase()}`), "gu")
        : new RegExp(bounded(body), "giu");
      terms.push({ heroId: hero.id, term, regex });
    }
  }
  // Longest first so "Shadow Fiend" wins over a shorter overlapping name.
  return terms.sort((a, b) => b.term.length - a.term.length);
}

export function detectHeroes(title: string, heroes: DetectableHero[]): number[] {
  let text = normalize(title);
  const found: number[] = [];
  for (const { heroId, regex } of buildTerms(heroes)) {
    regex.lastIndex = 0;
    if (!regex.test(text)) continue;
    if (!found.includes(heroId)) found.push(heroId);
    regex.lastIndex = 0;
    // Mask the match so shorter names can't match inside it.
    text = text.replace(regex, (m) => " ".repeat(m.length));
  }
  return found;
}
