// World definitions: palettes, twists, pacing, music and bosses.
// mode: run | swim | flip | mix.  Distances in strides (1 stride = 10px).
DR.LEVELS = [
  {
    id: 1, name: 'DESERT DAWN', tagline: 'Where it all began.', twist: 'THE CLASSIC — learn to jump & duck',
    mode: 'run', bg: 'desert', weather: 'dust', ground: 'cactus', flyer: 'ptero',
    goal: 800, speed: [190, 265], gap: [1.0, 1.9], flyerFrom: .35,
    palette: { skyTop: '#2b1b4a', skyMid: '#c8536b', skyBot: '#ffb86b', sun: '#fff1b8', far: '#7a3554', mid: '#a5483a', near: '#5e2a2f', ground: '#e3a466', groundDark: '#b9774a', line: '#5a2d1f', dino: '#2b2024', dinoEye: '#fff6e0', obstacle: '#2e5d3a', flyer: '#3c2233', accent: '#ffcf4a', accent2: '#ff6b3d', grade: 'rgba(255,140,60,.06)' },
    music: { bpm: 118, root: 57, scale: 'major', prog: [0, 4, 5, 3], lead: 'square', seed: 11 },
    tips: ['Hold SPACE for a higher jump.', 'Press ↓ mid-air to slam down fast.'],
  },
  {
    id: 2, name: 'NEON RAIN', tagline: 'The city never sleeps. Neither do its drones.', twist: 'HOVER DRONES — they bob up & down',
    mode: 'run', bg: 'city', weather: 'rain', ground: 'barrier', flyer: 'drone', droneBob: true,
    goal: 1000, speed: [210, 295], gap: [.95, 1.7], flyerFrom: .1,
    palette: { skyTop: '#07041a', skyMid: '#2a0c4a', skyBot: '#6a1a6a', sun: '#ffd6f5', far: '#1a1238', mid: '#24164a', near: '#120a26', ground: '#161124', groundDark: '#0d0a18', line: '#ff2a8a', dino: '#7df9ff', dinoEye: '#07041a', obstacle: '#2a2340', flyer: '#c3c3d9', accent: '#ffe600', accent2: '#00f0ff', grade: 'rgba(255,0,180,.06)' },
    music: { bpm: 124, root: 50, scale: 'minor', prog: [0, 5, 2, 6], lead: 'sawtooth', arp: 'square', drive: true, echo: true, seed: 22 },
    tips: ['Watch the drone\'s rhythm before you commit.'],
  },
  {
    id: 3, name: 'FROZEN AURORA', tagline: 'Under the northern lights, the ice remembers.', twist: 'FALLING ICICLES & BLIZZARDS',
    mode: 'run', bg: 'tundra', weather: 'snow', ground: 'ice', flyer: 'ptero', fallers: 'icicle', gusts: true,
    goal: 1100, speed: [215, 300], gap: [1.0, 1.8], flyerFrom: .2,
    palette: { skyTop: '#04122a', skyMid: '#14456b', skyBot: '#5d93b5', sun: '#e8f6ff', aurora: '#5dffb0', far: '#b9d6ee', mid: '#7aa2c4', near: '#2c4f6e', ground: '#eef8ff', groundDark: '#b5d3ea', line: '#8fb8d8', dino: '#1d3550', dinoEye: '#e8f6ff', obstacle: '#8fdcff', flyer: '#f5fbff', accent: '#ffffff', accent2: '#c9f0ff', grade: 'rgba(120,200,255,.05)' },
    music: { bpm: 100, root: 55, scale: 'lydian', prog: [0, 4, 5, 1], lead: 'triangle', pad: true, echo: true, seed: 33 },
    tips: ['A red marker shows where an icicle will land.'],
  },
  {
    id: 4, name: 'MAGMA CORE', tagline: 'The earth is cracking open.', twist: 'METEOR SHOWERS & LAVA PITS',
    mode: 'run', bg: 'volcano', weather: 'embers', ground: 'rock', flyer: 'bat', fallers: 'meteor', pits: true,
    goal: 1100, speed: [225, 310], gap: [1.0, 1.8], flyerFrom: .2,
    boss: { name: 'MAGMA WYRM', kind: 'wyrm', hp: 5, attacks: ['low', 'high', 'rain', 'slam'] },
    palette: { skyTop: '#140303', skyMid: '#4a0d06', skyBot: '#a8320c', sun: '#ffb347', far: '#2a0a08', mid: '#3d0f0a', near: '#1a0505', ground: '#2e1a16', groundDark: '#1c0e0b', line: '#ff5a1f', dino: '#f2e6d8', dinoEye: '#1a0505', obstacle: '#4a2c26', flyer: '#1a0505', accent: '#ff6a00', accent2: '#ffd000', lava: '#ff4a00', grade: 'rgba(255,60,0,.08)' },
    music: { bpm: 138, root: 52, scale: 'phrygian', prog: [0, 1, 0, 6], lead: 'sawtooth', drive: true, seed: 44 },
    tips: ['Lava pits glow — jump them early.', 'Grab the boss\'s glowing orbs to strike back!'],
  },
  {
    id: 5, name: 'THE ABYSS', tagline: 'Dinosaurs can\'t swim. This one learned.', twist: 'UNDERWATER — hold to swim up',
    mode: 'swim', bg: 'ocean', weather: 'bubbles', ground: 'kelp', flyer: 'jelly',
    goal: 1000, speed: [170, 235], gap: [.9, 1.6], flyerFrom: 0,
    palette: { skyTop: '#020a1c', skyMid: '#06305a', skyBot: '#0b4f7a', sun: '#9fe8ff', far: '#06284a', mid: '#0b3a5c', near: '#04192e', ground: '#c9b483', groundDark: '#8f7c52', line: '#e6d6a5', dino: '#ffb347', dinoEye: '#02101f', obstacle: '#1fa37a', flyer: '#ff9ee8', accent: '#7df9ff', accent2: '#ff6bd6', grade: 'rgba(0,120,255,.08)' },
    music: { bpm: 92, root: 53, scale: 'dorian', prog: [0, 3, 4, 2], lead: 'sine', pad: true, echo: true, leadEarly: true, seed: 55 },
    tips: ['Tap to rise, release to sink.', 'Mines don\'t move. Jellyfish do.'],
  },
  {
    id: 6, name: 'HAUNTED HOLLOW', tagline: 'Something follows in the dark.', twist: 'DARKNESS — lightning reveals all',
    mode: 'run', bg: 'haunted', weather: 'fog', ground: 'tomb', flyer: 'ghost', dark: true, ghostPhase: true,
    goal: 1200, speed: [220, 305], gap: [1.0, 1.8], flyerFrom: .15,
    boss: { name: 'THE PHANTOM KING', kind: 'phantom', hp: 6, attacks: ['high', 'low', 'rain', 'low', 'slam'] },
    palette: { skyTop: '#07030f', skyMid: '#1d0d2c', skyBot: '#3a1a4a', sun: '#f3efd0', far: '#1f0f2e', mid: '#140a1f', near: '#08040e', ground: '#2a2236', groundDark: '#17121f', line: '#6a4a8a', dino: '#c9f2a5', dinoEye: '#0a0414', obstacle: '#8c86a3', flyer: '#e8e4ff', accent: '#b44dff', accent2: '#ff8a00', grade: 'rgba(120,0,255,.07)' },
    music: { bpm: 112, root: 48, scale: 'harmonic', prog: [0, 5, 3, 4], lead: 'square', echo: true, seed: 66 },
    tips: ['Ghosts are only solid while visible.', 'Lightning flashes give you a peek ahead.'],
  },
  {
    id: 7, name: 'ZERO-G STATION', tagline: 'Gravity is optional up here.', twist: 'GRAVITY FLIP — tap to swap floor & ceiling',
    mode: 'flip', bg: 'space', weather: 'stars', ground: 'crystal', flyer: 'ufo',
    goal: 1200, speed: [220, 300], gap: [.85, 1.5], flyerFrom: .3,
    palette: { skyTop: '#000004', skyMid: '#0a0620', skyBot: '#1d0f40', sun: '#ffd27d', nebula: '#7a2aff', far: '#2a2350', mid: '#3a3f55', near: '#1c1f2e', ground: '#3a3f55', groundDark: '#22263a', line: '#00f0ff', dino: '#e6ecff', dinoEye: '#00a8c0', obstacle: '#ff3df2', flyer: '#9aa3c7', accent: '#00f0ff', accent2: '#ffe600', grade: 'rgba(100,50,255,.06)' },
    music: { bpm: 128, root: 54, scale: 'lydian', prog: [0, 2, 4, 5], lead: 'square', arp: 'sawtooth', pad: true, seed: 77 },
    tips: ['You can only flip while touching a surface.'],
  },
  {
    id: 8, name: 'EXTINCTION', tagline: '66 million years in the making.', twist: 'REALITY GLITCH — every rule, all at once',
    mode: 'mix', bg: 'glitch', weather: 'glitch', ground: 'glitch', flyer: 'ptero', fallers: 'meteor',
    goal: 1500, speed: [235, 335], gap: [.9, 1.6], flyerFrom: 0,
    boss: { name: 'THE EXTINCTION EVENT', kind: 'meteor', hp: 8, attacks: ['low', 'high', 'rain', 'slam', 'low', 'high'] },
    palette: { skyTop: '#0a0014', skyMid: '#3a0050', skyBot: '#ff2a6d', sun: '#ffe600', far: '#2a0040', mid: '#1a0030', near: '#0d0018', ground: '#0a0012', groundDark: '#050008', line: '#ff2a6d', dino: '#f4f1ea', dinoEye: '#ff2a6d', obstacle: '#00f0ff', flyer: '#00f0ff', accent: '#ff2a6d', accent2: '#ffe600', grade: 'rgba(255,0,120,.07)' },
    music: { bpm: 146, root: 45, scale: 'minor', prog: [0, 5, 6, 4], lead: 'sawtooth', drive: true, echo: true, seed: 88 },
    tips: ['The rules change every few hundred strides. Read the banner!'],
  },
  {
    id: 9, name: 'CYBER VAULT', tagline: 'The grid is awake.', twist: 'LASER GRID — low beams need a jump, high beams a duck',
    mode: 'run', bg: 'vault', weather: 'sparks', ground: 'plate', flyer: 'sentinel', lasers: true,
    goal: 1100, speed: [215, 300], gap: [1.05, 1.8], flyerFrom: .45,
    palette: { skyTop: '#03040f', skyMid: '#081428', skyBot: '#0d2f4a', sun: '#9df6ff', far: '#0a1830', mid: '#0e2340', near: '#050b18', ground: '#0b1522', groundDark: '#060c15', line: '#25e8ff', dino: '#e8fbff', dinoEye: '#08a0c0', obstacle: '#16324a', flyer: '#7ff0ff', accent: '#25e8ff', accent2: '#ff2d6f', grade: 'rgba(0,180,255,.05)' },
    music: { bpm: 132, root: 50, scale: 'minor', prog: [0, 5, 6, 4], lead: 'square', arp: 'sawtooth', drive: true, echo: true, seed: 101 },
    tips: ['Low beams: jump. High beams: duck.', 'The emitters glow before they fire — read the beat.'],
  },
  {
    id: 10, name: 'TIDAL SHORE', tagline: 'The sea wants it back.', twist: 'TSUNAMI — get to high ground',
    mode: 'run', bg: 'shore', weather: 'dust', ground: 'rock', flyer: 'gull', tide: true,
    goal: 1050, speed: [205, 290], gap: [1.05, 1.85], flyerFrom: .35,
    palette: { skyTop: '#071a2b', skyMid: '#12405c', skyBot: '#e08a4a', sun: '#ffd9a0', far: '#123f58', mid: '#0d2f45', near: '#08202f', ground: '#e6c48c', groundDark: '#b98f57', line: '#8a6538', dino: '#2e2a24', dinoEye: '#fff6e0', obstacle: '#6b4a2a', flyer: '#f4f7fb', accent: '#7df9ff', accent2: '#ffcf4a', grade: 'rgba(255,150,80,.05)' },
    music: { bpm: 108, root: 55, scale: 'dorian', prog: [0, 3, 5, 4], lead: 'triangle', pad: true, echo: true, seed: 102 },
    tips: ['When the siren sounds, jump onto the rock shelf.', 'Standing on wet sand when the wave hits costs a heart.'],
  },
  {
    id: 11, name: 'NO INTERNET', tagline: 'The one that started it all. Still offline.', twist: 'RETRO MODE — the original dino, exactly as you remember',
    mode: 'run', bg: 'retro', weather: 'none', ground: 'chrome', flyer: 'ptero', retro: true, alwaysOpen: true,
    goal: 900, speed: [200, 285], gap: [1.05, 1.95], flyerFrom: .3,
    palette: { skyTop: '#f7f7f7', skyMid: '#f7f7f7', skyBot: '#f7f7f7', sun: '#f7f7f7', far: '#e6e6e6', mid: '#dcdcdc', near: '#cfcfcf', ground: '#f7f7f7', groundDark: '#9a9a9a', line: '#535353', dino: '#535353', dinoEye: '#f7f7f7', obstacle: '#535353', flyer: '#535353', accent: '#535353', accent2: '#7a7a7a', grade: 'rgba(0,0,0,0)' },
    music: { bpm: 126, root: 60, scale: 'major', prog: [0, 4, 5, 3], lead: 'square', seed: 99 },
    tips: ['↑ jump, ↓ duck. Cacti hurt. Pterodactyls hurt more.', 'The real one: paper-white sky, no mercy.'],
  },
  {
    // traffic: oncoming autos, delivery bikes, cabs and rideable lorries (see addVehicle). Barricades are metro work.
    id: 12, name: 'INDIRANAGAR', tagline: '100 Feet Road. Peak hour. Clear skies.', twist: 'PEAK TRAFFIC — autos, bikes, cars & trucks',
    mode: 'run', bg: 'indiranagar', weather: 'none', ground: 'barrier', flyer: 'kite', traffic: true, roadHazards: true, alwaysOpen: true,
    goal: 1100, speed: [205, 290], gap: [1.0, 1.8], flyerFrom: .35,
    palette: { skyTop: '#2f6fd0', skyMid: '#5f9fe6', skyBot: '#b8dcff', sun: '#fff6d0', far: '#8a9bb8', mid: '#6e7f9c', near: '#2b1f2a', ground: '#3d3a42', groundDark: '#2a272e', line: '#e8c23a', dino: '#1e1a24', dinoEye: '#fff1d6', obstacle: '#e8e4d8', flyer: '#2b1f2a', accent: '#ffd23f', accent2: '#3fbf6f', grade: 'rgba(0,0,0,0)' },
    music: { bpm: 122, root: 55, scale: 'major', prog: [0, 5, 3, 4], lead: 'square', arp: 'triangle', echo: true, seed: 112 },
    tips: ['A horn means something fast is coming. Watch the right edge.', 'Lorries are slow and flat on top. Land on one and ride it.', 'Delivery bikes travel in pairs.', 'Potholes and speed humps cost a quarter heart. Hop them.', 'Some say there is a white auto. Very rare.'],
  },
];

// ENDLESS: one rule set (run, no finish line). The scenery rotates through the
// classic run worlds every ENDLESS_SEG strides; speed and spawn density ramp to max
// over the first ENDLESS_BASE.goal strides.
DR.ENDLESS_CYCLE = [1, 2, 3, 4, 6, 9, 11];
DR.ENDLESS_SEG = 250;
DR.ENDLESS_BASE = {
  endless: true, mode: 'run', goal: 2000, speed: [200, 300], gap: [1.0, 1.7], flyerFrom: .25,
  boss: null, tide: false, alwaysOpen: false,
};
DR.endlessLevel = (i) => {
  const w = DR.LEVELS.find(l => l.id === DR.ENDLESS_CYCLE[i % DR.ENDLESS_CYCLE.length]);
  return Object.assign({}, w, DR.ENDLESS_BASE, { id: w.id, name: w.name, twist: w.twist, tagline: w.tagline, tips: w.tips, retro: !!w.retro, endlessSeg: i });
};
DR.ENDLESS_TIPS = [
  'Shields block one hit — grab them before a rough patch.',
  'Magnet pulls every coin in reach. Coins bank even when you crash.',
  'Double score doubles every point for a few seconds.',
  'Every 250 m the scenery changes. The rules do not.',
];

// Phases for the final world: each segment swaps the twist.
DR.MIX_PHASES = [
  { mode: 'run', label: 'CLASSIC' },
  { mode: 'flip', label: 'GRAVITY FLIP' },
  { mode: 'run', label: 'METEOR STORM', fallers: true },
  { mode: 'swim', label: 'FLOOD' },
  { mode: 'run', label: 'BLACKOUT', dark: true },
];
