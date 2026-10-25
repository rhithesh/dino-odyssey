# Dino Odyssey — Product Requirements Document (v1.3.0)

> Source of truth: code in this folder as of 2026-10-25 (incl. the 19-species roster and walk animation). Fully offline Chrome Side Panel game. Design rationale for the roster: `DINO_DESIGN_PLAN.md`.

## 1. Product overview

**Name:** No Internet: Dino Odyssey (short: Dino Odyssey)
**Tagline:** The offline dino game, reimagined.
**Form factor:** Chrome extension Side Panel (`sidepanel.html`). Click toolbar icon → opens side panel → play.
**Fantasy:** Classic Chrome dino runner evolved into 8 cinematic worlds, 3 boss fights, 19 collectible dinosaurs with their own perks, and a procedural chiptune soundtrack.
**Offline-first:** Zero network calls. All art procedurally drawn on canvas, all music synthesized via Web Audio. Works with no internet (title chip explicitly leans into this: "No internet? No problem." / "You're offline — perfect timing.").

## 2. Goals / non-goals

Goals (as implemented):
- Pick-up-and-play runner with one-button core (jump / hold for higher).
- Variety via 8 worlds that each bend one rule but keep the same run/dodge core.
- AAA-feel on tiny budget: cinematic intro, letterbox, banners, slow-mo, shake, flash, boss warnings.
- Replayability: 3-star per world, best score, coins, close-call combo, and a 19-species Dino Dex to unlock and equip.
- Zero assets to download.

Non-goals (not in build):
- No multiplayer, leaderboards, accounts.
- No backend, analytics, or remote config.
- No mobile app / no options menu beyond mute.

## 3. Target user & use case

Anyone staring at Chrome with bad wifi. Side-panel sized (narrow vertical ~280 logical px wide), keyboard + touch, 1-3 min runs.

## 4. Worlds / Levels (content spec)

Sequential unlock. `save.unlocked` gates. All distances in meters (1m = 10px scroll).

| # | Name | Tagline | Twist (banner) | Mode | BG / Weather | Ground / Flyer | Goal | Speed range | Gap | Boss |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | DESERT DAWN | Where it all began. | THE CLASSIC — learn to jump & duck | run | desert / dust | cactus / ptero | 800m | 190-265 | 1.0-1.9 | – |
| 2 | NEON RAIN | The city never sleeps... | HOVER DRONES — bob up & down | run | city / rain | barrier / drone (bob) | 1000m | 210-295 | 0.95-1.7 | – |
| 3 | FROZEN AURORA | Under northern lights... | FALLING ICICLES & BLIZZARDS | run | tundra / snow | ice / ptero + icicle fallers, gusts | 1100m | 215-300 | 1.0-1.8 | – |
| 4 | MAGMA CORE | Earth cracking open. | METEOR SHOWERS & LAVA PITS | run | volcano / embers | rock / bat + meteor fallers, pits | 1100m | 225-310 | 1.0-1.8 | MAGMA WYRM, 5HP, [low, high, rain, slam] |
| 5 | THE ABYSS | Dino learned to swim. | UNDERWATER — hold to swim up | swim | ocean / bubbles | kelp / jelly | 1000m | 170-235 | 0.9-1.6 | – |
| 6 | HAUNTED HOLLOW | Something follows... | DARKNESS — lightning reveals all | run | haunted / fog | tomb / ghost (phase, only solid when visible) + dark | 1200m | 220-305 | 1.0-1.8 | PHANTOM KING, 6HP, [high, low, rain, low, slam] |
| 7 | ZERO-G STATION | Gravity optional. | GRAVITY FLIP — tap to swap floor/ceiling | flip | space / stars | crystal / ufo | 1200m | 220-300 | 0.85-1.5 | – |
| 8 | EXTINCTION | 66M years in making. | REALITY GLITCH — every rule at once | mix | glitch / glitch | glitch / ptero + meteor | 1500m | 235-335 | 0.9-1.6 | THE EXTINCTION EVENT, 8HP, [low, high, rain, slam, low, high] |

Mix phases (World 8, by progress fraction): CLASSIC (run) → GRAVITY FLIP (flip) → METEOR STORM (run+fallers) → FLOOD (swim) → BLACKOUT (run+dark).

Tips per world shown on death screen (e.g. W1: hold SPACE higher, ↓ slam; W4: lava pits jump early, grab orbs to strike back).

## 4B. Playable Species Roster (19 dinosaurs, all implemented)

Each species has its own pixel art and exactly one perk. All species share the same hitbox (`12x17` standing / `21x9` ducking), so art never changes difficulty; only the perk does. Perk and fact copy is not shown in the UI — the table below is the only place effects are described. No pay-to-win: everything unlocks offline by clearing worlds and earning stars.

Data lives in `DR.DINOS` (`js/dinos.js`); defaults in `DR.DINO_BASE`. The equipped species is `save.dino`.

| # | Species | Era / fact | Unlock | Perk (value as built) |
|---|---|---|---|---|
| 1 | Compsognathus | Late Jurassic, 1 m. The original Chrome dino, tinted by each world's palette | Start | None |
| 2 | Hypsilophodon | Early Cretaceous, 2 m | 3★ | +5% run speed |
| 3 | Velociraptor | Late Cretaceous, feathered, sickle claw | Clear W1 | Recovers from hit slowdown 2× faster |
| 4 | Gallimimus | Late Cretaceous, ostrich-mimic, 60 km/h | 6★ | +8% top speed |
| 5 | Parasaurolophus | Late Cretaceous, hollow crest | Clear W2 | Close-call window 6 px → 9 px |
| 6 | Dilophosaurus | Early Jurassic, twin crests | 9★ | +22 px light radius in the dark |
| 7 | Pachycephalosaurus | Late Cretaceous, dome skull | Clear W3 | Headbutts 1 falling icicle/meteor per run |
| 8 | Iguanodon | Early Cretaceous, thumb spikes | 12★ | Coin magnet 3 px → 9 px |
| 9 | Carnotaurus | Late Cretaceous, bull horns | Clear W4 | Bounces off 1 lava pit per run, no damage |
| 10 | Allosaurus | Late Jurassic apex predator | 15★ | Combo builds every 5 dodges instead of 6 |
| 11 | Stegosaurus | Late Jurassic, plates + thagomizer | Clear W5 | Invincibility after a hit 1.6 s → 2.0 s |
| 12 | Ankylosaurus | Late Cretaceous, armored tank | 18★ | 4 hearts, but weaker jump (600 → 565) |
| 13 | Triceratops | Late Cretaceous, three horns | Clear W6 | Smashes 1 ground obstacle per run |
| 14 | Spinosaurus | Late Cretaceous, semi-aquatic sail | 20★ | Swim stroke 1250 → 1450 |
| 15 | Pteranodon* | Late Cretaceous flying reptile | 21★ | Floatier jumps (hold window 0.2 s → 0.3 s) |
| 16 | Microraptor | Early Cretaceous, four feathered wings | Clear W7 | Coyote 0.09 → 0.14 s, jump buffer 0.13 → 0.18 s |
| 17 | Tyrannosaurus Rex | Late Cretaceous, the king | Clear W8 | 2× score from boss hits |
| 18 | Mosasaurus* | Late Cretaceous sea lizard | 24★ | Sinks much slower when idle underwater |
| 19 | Brachiosaurus | Late Jurassic, 22 m sauropod | 3★ in every world | 2× coins, but only 1 heart |

`*` Not true Dinosauria; labeled in the Dex footer ("Not technically dinosaurs, but we let them in anyway.").

"Clear Wn" means at least 1★ in world n. Star gates use total stars across all worlds. Mosasaurus and Brachiosaurus both effectively need 24★.

### Art direction
- **Silhouette first.** Each species has one signature shape readable at side-panel size: crest, dome, plates, sail, frill, long neck, horns.
- **Own palette.** 6-colour ramp per species; no two share a dominant hue.
- **Auto outline.** A 1 px dark outline is added so every species reads on every world.
- **Body plans:** biped (13), quadruped (Stegosaurus, Ankylosaurus, Triceratops, Brachiosaurus), flipper-walker (Mosasaurus).

### Animation
- 4-frame **walk cycle** for every species, plus stand, jump (knee-up leap pose), 4 duck frames and a white hit-flash set.
- Dinosaur anatomy, not bird legs: drumstick thigh over the body, thick shin, backward ankle, wide clawed foot, ~10 px stride.
- Far-side leg is a darker shade half a cycle behind. Quadrupeds trot in diagonal pairs.
- Body dips 1 px when both feet are down. Leg speed follows ground speed (one frame per 9 px scrolled).
- Footfall feedback: dust puff on every heel strike; the six heavy species (T-Rex, Spinosaurus, Stegosaurus, Ankylosaurus, Triceratops, Brachiosaurus) also give a tiny camera thud.

### Dino Dex (UI)
- Opened from the title ("DINO DEX · n NEW" badge when something is unseen) and from a link at the top of the worlds screen.
- Grid of cards: animated sprite for the equipped/hovered card, name, era and POWER ★. Locked cards show a black silhouette and the unlock hint (`CLEAR WORLD 5`, `EARN 12 ★`, `3★ EVERY WORLD`).
- Tap an unlocked card to equip; it is saved immediately and the title demo switches to it. Equipped card shows an EQUIPPED tag.
- Results screen shows a "NEW DINO UNLOCKED" card (with "+n more" when several unlock at once).
- The equipped species shows on the title ("PLAYING AS …"), the level intro card, and the level-select thumbnails.
- Perk saves show a callout in-run: `BONK!`, `HOT HOP!`, `SMASH!`.

## 4C. Coins and Power Bars

Every dino has **4 power meters of 10 bars**. Each dino starts with its own bars (its strengths); each coin purchase adds **one bar**, and each next bar costs more.

**Earning.** Every coin collected is banked at the end of the run, win or lose. Clearing a world adds `15 + 5 per star`, `+30` on boss worlds.

**Dino page.** Opened from the title's **DINO UPGRADES** button (equipped dino), by tapping any card in the **Dino Dex** (equipped dino is always listed first), or from UPGRADES on the results / game-over screens. Shows the dino as a large revolving 3D pixel figure (still walking; drag to spin it), name, **POWER ★** rating, era, **EQUIP**, and the 4 meters. White bars = starting bars, gold = bought, green dots = milestone bars. Locked dinos show a silhouette and unlock hint; bars can't be bought yet.

| Bar | Each bar | Milestones |
|---|---|---|
| ⇡ JUMP | +8 jump power (10 bars ≈ 28% higher jump) | — |
| ♥ TOUGHNESS | +0.08 s invincibility, faster hit recovery | +1 heart at 5 bars, +1 more at 10 |
| ⚡ AGILITY | More forgiving jump timing, faster fast-fall | **Double Jump** at 5 bars (stronger with more bars) |
| ≫ DASH | Longer dash (0.33 → 0.6 s), shorter cooldown (7.1 → 3.5 s) | Dash unlocks at 1 bar (SHIFT / D / →) |

**Bar price:** next bar at meter level n costs `40 + 25·n` coins (40, 65, 90 … 265), +20% per power star above 1.

**Starting bars [jump, tough, agile, dash]** (later dinos start fuller, each with its own strengths):

| ★ | Dinos |
|---|---|
| 1 | Compsognathus 2/2/3/0 · Hypsilophodon 2/1/4/0 · Velociraptor 2/1/4/1 |
| 2 | Gallimimus 3/2/4/3 · Parasaurolophus 3/3/3/2 · Dilophosaurus 3/3/3/3 · Pachycephalosaurus 2/5/2/2 |
| 3 | Iguanodon 3/4/3/3 · Carnotaurus 4/3/4/4 · Allosaurus 4/4/4/3 · Stegosaurus 2/6/2/3 |
| 4 | Ankylosaurus 1/8/2/2 · Triceratops 3/6/3/5 · Spinosaurus 4/5/4/4 · Pteranodon 7/2/5/3 · Microraptor 4/2/7/5 |
| 5 | T-Rex 5/7/4/6 · Mosasaurus 4/5/6/6 · Brachiosaurus 6/4/4/6 |

Bars stack on top of the species perk (e.g. Ankylosaurus 4 hearts + Toughness bonus). Star rules are unchanged; the title demo ignores bars.

## 5. Core mechanics

- **Hearts:** 3 per run by default (Ankylosaurus 4, Brachiosaurus 1). Any hit -1, i-frames 1.6s (Stegosaurus 2.0s), knock penalty (speed ×0.8 recovering). Heart pickup rare (~4.5% spawn when below max hearts, +1, never above the species' max).
- **Win:** reach goal distance → finish flag (or bossIntro → boss → win). Run timer, score, coins tracked.
- **Lose:** hearts 0 → death tumble → EXTINCT screen with % progress + random tip.
- **Score:** distance × combo multiplier + coins (10×mult) + close calls (25×mult) + boss hits (250×mult).
- **Combo:** streak increments per clean dodge; mult = 1 + floor(streak/6)*0.5, cap 4.5x. Afterimage trail at ≥2x. Slow-mo to 0.55x on close call.
- **Close call:** passing with <6px gap (9px for Parasaurolophus) → text (CLOSE!/WHOA!/NICE!), sfx, burst.
- **Coins:** arcs/lines/waves over/around obstacles. Magnet radius +3px around player box.
- **Stars (per world):** ★ clear + ★ 70% coins + ★ no damage = 24 total. Shown on level cards + result. Total stars gate species #2, 4, 6, 8, 10, 12, 14, 15, 18.
- **Persistence:** `localStorage dr_save { unlocked, stars{}, best{}, last, dino, dinos[], dexNew[], coins, bars{dinoId:{jump,tough,agile,dash}} }` (bars = bought on top of starting bars), `dr_muted`. `dinos[]` = species already announced, `dexNew[]` = unlocked but not yet seen in the Dex. Saves from v1.0/1.1 migrate silently (already-earned species are not re-announced). An equipped species that is no longer unlocked falls back to Compsognathus.

Modes:
- **run:** classic gravity 2600, variable jump (hold ≤0.2s = 0.42x gravity), ↓ in air = 3.2x slam, coyote 0.09s, jump buffer 0.13s, duck shrinks hitbox.
- **swim:** thrust -1250 up when held, sink +1200 with ↓, clamped vy [-220,260], bounded between surface (SURF) and ground. Jellyfish bob, mines static + sine.
- **flip:** gravity 2300 × g (±1), tap flips g, ceiling at CY. Can only flip when onGround. Both floor/ceiling obstacles.
- **mix:** swaps mode/dark/fallers live, clears field, glitch flash + banner.

Hazards:
- Ground obstacles (S/L variants, ceil variants in flip), flyers (low/mid/high heights, drone bob, ghost phase alpha), fallers (icicle/meteor with ground warning marker → becomes persistent ground shard/crater), mines, lava pits (instant damage + bounce if touched), boss projectiles (low/high), boss rain (timed meteors), boss slam (ground shockwave traveling).

Boss loop (W4/W6/W8):
bossIntro (siren + WARNING stripes + slide-in) → boss (dodge pattern, orbs every 3rd attack) → grab orb auto-fires homing shot → hit = stun 0.9s + flash → HP 0 = 1.9s death anim → explosion → win. Boss bobs + drifts, ambient particles.

## 6. Controls

- SPACE / ↑ / W / tap / ▲ pad: jump / swim-up / flip (context). Hold = higher (run). Press again in the air for Double Jump when owned.
- SHIFT / D / → / ≫ pad: Dash (when owned).
- ↓ / S / ▼ pad: duck / fast-fall / sink.
- P / ESC / pauseBtn: pause. M: mute. Enter: confirm on menus.
- Side panel focus required; blur/hidden tab auto-pauses with "Click to focus" hint.

## 7. UX / Screens

Title (logo, offline chip, PLAY/CONTINUE, LEVELS, SOUND, HOW TO, animated demo behind) → LEVELS (scroll cards with live canvas thumb + stars + BEST + BOSS tag + lock) + DINO DEX (see 4B) from title and worlds screens → HOW TO → Game HUD (hearts — 1 to 4 depending on species —, score, coins, progress bar/flag OR boss bar, combo, twist tag, pause) → PAUSE (resume/restart/worlds) → RESULT (title slam, staggered stars with sfx, stats rows, species-unlock toast if triggered, NEXT/REPLAY/WORLDS) → OVER (stats + tip + TRY AGAIN/WORLDS). Touch pads only in-game. Cinematic intro (WORLD card 0-2.1s, 3-2-1 count, GO banner), boss warning, win card, letterbox bars that close on intros/boss/win/dead.

## 8. Audio (product view)

Per-world bpm/root/scale/prog/lead/arp/pad/echo/drive. Boss = same cfg 1.12x faster + harmonic boss scale. 20+ SFX (jump, flip, swim, coin, heart, close, hit, death, warn, siren, orb, bosshit, shoot, boom, thunder, count, go, win, star, glitch, click, land). Mute persists.

## 9. Acceptance (v1.2.0)

- Loads unpacked, icon opens side panel, playable offline.
- All 8 worlds completable, bosses killable, stars/best persist.
- 60fps-ish on side-panel size, no external requests.
- 19 species defined in `DR.DINOS`, all unlockable via world-clear + star gates; equip persists via `save.dino`.
- Every species renders all frames (stand, 4 walk, jump, 4 duck, hurt) without error in all 8 worlds.
- Perks verified in-run: Carnotaurus lava bounce (first pit only), Pachycephalosaurus faller block, Ankylosaurus 4 hearts, Brachiosaurus 1 heart, Stegosaurus 2.0 s i-frames, Microraptor coyote, Allosaurus combo. Triceratops smash and the remaining stat perks are wired but not individually exercised.
- Power bars verified: buying a bar and the rising price, refund of earlier one-off powers, per-dino bars, Agility 5 → Double Jump, Dash from 1 bar, Toughness 5 → +1 heart, 3D page, Dex → page → back, Equip, Dash invincibility/cooldown, double jump once per airtime.
- Not verified: real hand-played balance, audio by ear, motion feel of the walk cycle in live Chrome.
