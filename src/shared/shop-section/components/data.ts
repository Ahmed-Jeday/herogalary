export type Category = "marvel" | "dc" | "spawn" | "anime" | "pop";

export interface Item {
  name: string;
  category: Category;
}

export const CATS: Record<Category, string> = {
  marvel: "Marvel",
  dc: "DC",
  spawn: "Spawn",
  anime: "Anime and games",
  pop: "Movies, TV and horror",
};

export const ITEMS: Item[] = [
  ["Batman: Three Jokers", "dc"],
  ["Killer Croc Todd's Mods", "dc"],
  ["Killer Croc Limited", "dc"],
  ["Kingdom Come Gold Label", "dc"],
  ["Martian Manhunter", "dc"],
  ["Batman 1,000,000", "dc"],
  ["Mystique X-Men", "marvel"],
  ["Dark Avengers Spider-Man", "marvel"],
  ["Bob Ross", "pop"],
  ["Shuri", "marvel"],
  ["Silver Surfer", "marvel"],
  ["Legends of the Dark Knight Batman", "dc"],
  ["Call of Duty Spawn", "spawn"],
  ["Tornado Batman", "dc"],
  ["Call of Duty Spawn, boxed", "spawn"],
  ["Human Torch", "marvel"],
  ["The Riddler", "dc"],
  ["Green Ranger", "pop"],
  ["Megazord", "pop"],
  ["Tekken 8 King", "anime"],
  ["Spawn", "spawn"],
  ["figma Batman Ninja", "anime"],
  ["Punisher", "marvel"],
  ["Ghost-Spider", "marvel"],
  ["Red Lantern", "dc"],
  ["Ultimate Iron Man", "marvel"],
  ["Baron Zemo and Arnim Zola", "marvel"],
  ["Two-Face", "dc"],
  ["Batman (The Flash)", "dc"],
  ["Wolverine two-pack", "marvel"],
  ["Dormammu", "marvel"],
  ["Rogue", "marvel"],
  ["Spirit Spider", "marvel"],
  ["The Spot", "marvel"],
  ["Rat King", "pop"],
  ["Michael Myers", "pop"],
  ["Valak the Nun", "pop"],
  ["Wolverine retro card", "marvel"],
  ["Wolverine 2nd Edition", "marvel"],
  ["Wolverine 5th Edition", "marvel"],
  ["Gambit 10 inch", "marvel"],
  ["Gambit Marvel Select", "marvel"],
  ["Gambit", "marvel"],
  ["Ned Flanders", "pop"],
  ["A.I.M. two-pack", "marvel"],
  ["Quicksilver", "marvel"],
  ["Siryn", "marvel"],
  ["Havok", "marvel"],
  ["Rock Python", "marvel"],
  ["Scarlet Witch", "marvel"],
  ["Hallows' Eve", "marvel"],
  ["Deathstorm", "dc"],
  ["Batman", "dc"],
  ["X-Men '97 Gambit", "marvel"],
  ["Slash", "pop"],
  ["Metalhead", "pop"],
  ["Ronan", "marvel"],
  ["Speedball", "marvel"],
  ["Strong Guy", "marvel"],
  ["Spawn Deluxe", "spawn"],
  ["Angela", "spawn"],
  ["Gamerverse Hulk", "marvel"],
  ["Wolverine and Forge", "marvel"],
  ["Turtles Chopper Cycle", "pop"],
  ["Son Goku", "anime"],
  ["Peter Parker Velocity Suit", "marvel"],
  ["Miles Morales Bodega Suit", "marvel"],
  ["Tombstone", "marvel"],
  ["ALF", "pop"],
  ["Mystique", "marvel"],
  ["X-23 and Warpath", "marvel"],
  ["Marvel's Lizard", "marvel"],
  ["Daimon Hellstrom", "marvel"],
  ["The Gimp set", "pop"],
  ["Big Lebowski Little People", "pop"],
  ["Artist Series Joker", "dc"],
  ["Batman Adventures Continue", "dc"],
  ["Cyborg Spider-Woman", "marvel"],
  ["Winter Soldier", "marvel"],
  ["Pennywise", "pop"],
  ["Evil Ash", "pop"],
  ["Spawn Nitro Riders", "spawn"],
  ["Ghost Rider", "marvel"],
  ["Blade", "marvel"],
  ["Moon Knight", "marvel"],
  ["J. Jonah Jameson", "marvel"],
  ["Captain America vs Venom", "marvel"],
  ["Beast", "marvel"],
].map(([name, category]) => ({ name, category: category as Category }));

export const WALL_LINES: Record<Category, string> = {
  marvel: "Marvel wall, eye level.",
  dc: "DC side. Bring a bag.",
  spawn: "McFarlane corner.",
  anime: "Import shelf.",
  pop: "Movies, TV and horror.",
};

/** A zigzag of stops across the wall. */
export const WALL_STOPS = [3, 26, 6, 52, 31, 12, 60, 37, 41, 64, 20, 85];

export const WALL_COLS = 22;
export const WALL_ROWS = 4;

export const GRAILS = [3, 13, 64];

export type WorldKey = Category;

export interface World {
  k: WorldKey;
  hero: number;
  bg: string;
  fg: string;
  word: string;
  sfx: string;
}

export const WORLDS: World[] = [
  { k: "marvel", hero: 37, bg: "#ff2d6f", fg: "#0b0714", word: "MARVEL", sfx: "POW!" },
  { k: "dc", hero: 52, bg: "#1560ff", fg: "#ffffff", word: "DC", sfx: "WHAM!" },
  { k: "spawn", hero: 20, bg: "#1a0d22", fg: "#fff4df", word: "SPAWN", sfx: "KRAK!" },
  { k: "anime", hero: 64, bg: "#ff8a1f", fg: "#0b0714", word: "ANIME", sfx: "ZAP!" },
  { k: "pop", hero: 35, bg: "#19d7ff", fg: "#0b0714", word: "CULT", sfx: "BAM!" },
];

/** Burst slots around the hero: x and y as a share of the screen, depth in px. */
export const DECK_SLOTS: Array<[number, number, number]> = [
  [-0.22, -0.2, -220],
  [0.2, -0.26, -340],
  [0.27, 0.1, -160],
  [-0.26, 0.16, -300],
  [0.06, 0.32, -420],
  [-0.1, -0.36, -500],
  [0.34, -0.06, -560],
];

export const PHONE_SLOTS: Array<[number, number, number]> = [
  [-0.28, -0.09, -160],
  [0.28, -0.1, -220],
  [-0.3, 0.12, -300],
  [0.3, 0.12, -260],
];

/** Deterministic shuffle used to fill each universe's shelf. */
const shelfOrder = ITEMS.map((_, i) => i).sort(
  (a, b) => ((a * 37) % 89) - ((b * 37) % 89),
);

export const WORLD_ITEMS: Record<WorldKey, number[]> = Object.fromEntries(
  WORLDS.map((w) => [
    w.k,
    [w.hero, ...shelfOrder.filter((i) => ITEMS[i].category === w.k && i !== w.hero)],
  ]),
) as Record<WorldKey, number[]>;

export const FRAME_COUNTS: Record<string, number> = {
  door: 81,
  fall: 38,
  ink: 81,
  m1: 40,
  m2: 48,
  m3: 59,
  aisle: 67,
  slamclip: 81,
};

const BASE = "/sites/twilightcomix";

export const productImage = (i: number) =>
  `${BASE}/img/b${String(i).padStart(2, "0")}.webp`;

export const productThumb = (i: number) =>
  `${BASE}/img/t/b${String(i).padStart(2, "0")}.webp`;

const PRICE_BASE: Record<Category, number> = {
  marvel: 24.9,
  dc: 22.9,
  spawn: 27.9,
  anime: 34.9,
  pop: 19.9,
};

/** Stable demo price for a product, in euros. */
export const productPrice = (i: number) => {
  const item = ITEMS[i];
  if (!item) return 0;
  return Math.round((PRICE_BASE[item.category] + ((i * 7) % 5) * 1.5) * 100) / 100;
};

export const formatPrice = (value: number) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" }).format(value);

export const frameImage = (id: string, size: "d" | "m", frame: number) =>
  `${BASE}/frames/${id}/${size}/${String(frame).padStart(4, "0")}.webp`;
