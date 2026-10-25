// World definitions: palettes, twists, pacing, music and bosses.
// mode: run | swim | flip | mix.  Distances in meters (1m = 10px).
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
    tips: ['The rules change every few hundred meters. Read the banner!'],
  },
];

// Phases for the final world: each segment swaps the twist.
DR.MIX_PHASES = [
  { mode: 'run', label: 'CLASSIC' },
  { mode: 'flip', label: 'GRAVITY FLIP' },
  { mode: 'run', label: 'METEOR STORM', fallers: true },
  { mode: 'swim', label: 'FLOOD' },
  { mode: 'run', label: 'BLACKOUT', dark: true },
];
