// Site copy and game data. World and dino facts mirror src/js/levels.ts and src/js/dinos.ts in the game.
import dinos from "@/public/media/dinos.json";

// Where the call-to-action buttons point. Swap in the store URLs once the game is listed.
export const LINKS = {
  chrome: "#play",
  ios: "#play",
  source: "#play",
};

export type Mode = "run" | "swim" | "flip" | "mix";

export type World = {
  id: number;
  slug: string;
  name: string;
  tagline: string;
  twist: string;
  detail: string;
  mode: Mode;
  accent: string;
  accent2: string;
  sky: [string, string, string];
  boss?: string;
};

export const WORLDS: World[] = [
  { id: 1, slug: "w01", name: "Desert Dawn", tagline: "Where it all began.", twist: "The Classic", detail: "Cacti, pterodactyls and a sunrise over the dunes. Learn the two-step jump: tap to hop, hold for the full leap.", mode: "run", accent: "#ffcf4a", accent2: "#ff6b3d", sky: ["#2b1b4a", "#c8536b", "#ffb86b"] },
  { id: 2, slug: "w02", name: "Neon Rain", tagline: "The city never sleeps. Neither do its drones.", twist: "Hover Drones", detail: "Rain-slick rooftops and security drones that bob up and down. Read the rhythm before you commit.", mode: "run", accent: "#ffe600", accent2: "#00f0ff", sky: ["#07041a", "#2a0c4a", "#6a1a6a"] },
  { id: 3, slug: "w03", name: "Frozen Aurora", tagline: "Under the northern lights, the ice remembers.", twist: "Icicles & Penguin Parades", detail: "Falling icicles, blizzards, igloos, and the locals walking the other way. Penguins, polar bears and woolly mammoths.", mode: "run", accent: "#ffffff", accent2: "#5dffb0", sky: ["#04122a", "#14456b", "#5d93b5"] },
  { id: 4, slug: "w04", name: "Magma Core", tagline: "The earth is cracking open.", twist: "Meteors & Lava Pits", detail: "Meteor showers rain from a cracking sky and lava pits split the ground. At the end, the Magma Wyrm waits.", mode: "run", accent: "#ff6a00", accent2: "#ffd000", sky: ["#140303", "#4a0d06", "#a8320c"], boss: "Magma Wyrm" },
  { id: 5, slug: "w05", name: "The Abyss", tagline: "Dinosaurs can't swim. This one learned.", twist: "Underwater", detail: "Hold to swim up, let go to sink. Mines stay put. Jellyfish don't.", mode: "swim", accent: "#7df9ff", accent2: "#ff6bd6", sky: ["#020a1c", "#06305a", "#0b4f7a"] },
  { id: 6, slug: "w06", name: "Haunted Hollow", tagline: "Something follows in the dark.", twist: "Darkness & Lightning", detail: "A lantern's worth of light, ghosts that are only solid while visible, and lightning that shows you what's ahead.", mode: "run", accent: "#b44dff", accent2: "#ff8a00", sky: ["#07030f", "#1d0d2c", "#3a1a4a"], boss: "The Phantom King" },
  { id: 7, slug: "w07", name: "Zero-G Station", tagline: "Gravity is optional up here.", twist: "Gravity Flip", detail: "Tap to swap floor and ceiling. You can only flip while touching a surface, so plan two moves ahead.", mode: "flip", accent: "#00f0ff", accent2: "#ffe600", sky: ["#000004", "#0a0620", "#1d0f40"] },
  { id: 8, slug: "w08", name: "Extinction", tagline: "66 million years in the making.", twist: "Reality Glitch", detail: "Every rule, all at once. Classic, gravity flip, meteor storm, flood and blackout, swapping mid-run.", mode: "mix", accent: "#ff2a6d", accent2: "#ffe600", sky: ["#0a0014", "#3a0050", "#ff2a6d"], boss: "The Extinction Event" },
  { id: 9, slug: "w09", name: "Cyber Vault", tagline: "The grid is awake.", twist: "Laser Grid", detail: "Pulsing laser fences. Jump the low beams, duck the high ones, and watch the emitters glow before they fire.", mode: "run", accent: "#25e8ff", accent2: "#ff2d6f", sky: ["#03040f", "#081428", "#0d2f4a"] },
  { id: 10, slug: "w10", name: "Tidal Shore", tagline: "The sea wants it back.", twist: "Tsunami", detail: "A siren, then a wall of water. Get onto the rock shelf or lose a heart to the wave.", mode: "run", accent: "#7df9ff", accent2: "#ffcf4a", sky: ["#071a2b", "#12405c", "#e08a4a"] },
  { id: 11, slug: "w11", name: "No Internet", tagline: "The one that started it all. Still offline.", twist: "Retro Mode", detail: "Paper-white sky, pixel clouds, cacti and pterodactyls. A love letter to the offline page. Open from the start.", mode: "run", accent: "#e9e9e9", accent2: "#9a9a9a", sky: ["#f7f7f7", "#f7f7f7", "#e6e6e6"] },
  { id: 12, slug: "w12", name: "Indiranagar", tagline: "100 Feet Road. Peak hour. Clear skies.", twist: "Peak Traffic", detail: "Oncoming autos, delivery bikes in pairs, cabs and slow lorries you can ride on top of. Potholes cost a quarter heart.", mode: "run", accent: "#ffd23f", accent2: "#3fbf6f", sky: ["#2f6fd0", "#5f9fe6", "#b8dcff"] },
];

export const MODE_LABEL: Record<Mode, string> = { run: "RUN", swim: "SWIM", flip: "FLIP", mix: "ALL RULES" };

export type Boss = { slug: string; name: string; world: string; worldId: number; hp: number; attacks: string; blurb: string; accent: string };

export const BOSSES: Boss[] = [
  { slug: "boss04", name: "Magma Wyrm", world: "Magma Core", worldId: 4, hp: 5, attacks: "Fireballs · Meteor rain · Ground slam", blurb: "It rises out of the volcano at the end of the run and spits fire low and high. Grab the glowing orbs and throw the light back at it.", accent: "#ff6a00" },
  { slug: "boss06", name: "The Phantom King", world: "Haunted Hollow", worldId: 6, hp: 6, attacks: "Spirit bolts · Grave rain · Slam", blurb: "In a world you can barely see, the king of the hollow hunts by lantern-light. Every orb you grab is a flash it can't hide from.", accent: "#b44dff" },
  { slug: "boss08", name: "The Extinction Event", world: "Extinction", worldId: 8, hp: 8, attacks: "Every attack, faster", blurb: "The rock that ended the dinosaurs, back for a rematch. Eight hits. Every pattern you've learned, all at once.", accent: "#ff2a6d" },
];

export const DANCES = ["Stomp Hop", "Moonwalk", "Spin", "Duck & Pop", "Shimmy"];

// One plain-language line per species perk (from the stats each dino overrides in dinos.ts).
const PERKS: Record<string, string> = {
  mine: "Hatched from your own name",
  compy: "The original. Pure skill",
  unicorn: "Throws sparkles on every jump",
  hypsi: "Runs 5% faster",
  raptor: "Recovers speed twice as fast",
  galli: "Higher top speed",
  para: "Wider close-call window",
  dilo: "Brighter light in the dark",
  pachy: "Headbutts one falling hazard",
  iguano: "Triple-range coin magnet",
  carno: "Survives one lava pit",
  allo: "Builds combos faster",
  stego: "Longer invincibility after a hit",
  ankylo: "An extra heart, a heavier jump",
  trike: "Charges through one obstacle",
  spino: "Strongest swimmer",
  ptera: "Floatier, longer jumps",
  micro: "Extra-forgiving jump timing",
  trex: "Double points on boss hits",
  mosa: "Barely sinks underwater",
  brachio: "Double coins, but one heart",
};

export type Dino = { id: string; name: string; short: string; era: string; tier: number; hint: string; w: number; h: number; n: number; perk: string; sparkle: boolean };

export const DINOS: Dino[] = (dinos as Omit<Dino, "perk">[])
  .filter((d) => d.id !== "mine")
  .map((d) => ({ ...d, perk: PERKS[d.id] ?? "" }));

export const MY_COLORS = [
  { name: "Mint", body: "#5fd39a", accent: "#ffcf4a" },
  { name: "Sky", body: "#5aa8ff", accent: "#ff6b3d" },
  { name: "Sunset", body: "#ff8a3d", accent: "#7df9ff" },
  { name: "Grape", body: "#a97cff", accent: "#ffd23f" },
  { name: "Bubblegum", body: "#ff7ab8", accent: "#7df9a8" },
];

// Same rule as DR.dinoNameFor in src/js/dinos.ts: the name up to the end of its first syllable, plus SAURUS.
export function dinoNameFor(name: string) {
  const s = String(name || "").toUpperCase().replace(/[^A-Z]/g, "");
  const suf = "SAURUS";
  if (!s) return "DINO" + suf;
  const vowel = (i: number) => "AEIOU".includes(s[i]) || (s[i] === "Y" && i > 0);
  let i = 0;
  while (i < s.length && !vowel(i)) i++;
  const v = i;
  while (i < s.length && vowel(i)) i++;
  const c = i;
  while (i < s.length && !vowel(i)) i++;
  const stem = s.slice(0, Math.min(6, c === i && v < s.length ? v + 1 : i));
  return stem + (stem.endsWith(suf[0]) ? suf.slice(1) : suf);
}
