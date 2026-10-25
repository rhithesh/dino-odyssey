# Dino Odyssey — Technical Requirements Document (As-Built, v1.3.0)

## 1. System overview

MV3 Chrome extension, no build step, no dependencies. Static files only.

```
manifest.json
background.js
sidepanel.html
sidepanel.css
js/sprites.js → js/audio.js → js/levels.js → js/dinos.js → js/upgrades.js → js/backgrounds.js → js/fx.js → js/game.js → js/entities.js → js/ui.js
icons/icon{16,32,48,128}.png
```

Namespace: `window.DR`. No modules/bundler; script order matters (sprites defines `DR`, `rng`, `mk` used by all later files; `dinos.js` needs `DR.LEVELS` for its unlock check, and `ui.js` needs both).

## 2. Platform / manifest

- `manifest_version: 3`, `minimum_chrome_version 116` (sidePanel API).
- `permissions: ["sidePanel"]`, `side_panel.default_path: sidepanel.html`.
- `background.service_worker: background.js` — only sets `chrome.sidePanel.setPanelBehavior({openPanelOnActionClick:true})` onInstalled/onStartup.
- `action.default_icon` + `icons`. No content scripts, no host permissions, no CSP override, no network.

## 3. Rendering architecture

- Single `<canvas id="game">` fullscreen in panel. Logical width fixed `W=280`; height `H = max(300, 280*rect.h/rect.w)` recalculated on resize with DPR scaling (`canvas.width = rect.w*dpr`). `ctx.imageSmoothingEnabled=false`, `pixelated` CSS.
- Camera in `Game.render()`: `setTransform(k,0,0,k,0,0)` where `k=canvas.width/W`; zoom about (player.x, ground-focus) + random shake offset. Order: sky → extra → parallax layers → ground (+groundFx) → ceiling → pits → entities → finish → boss → player → particles → weather → gust overlay → dark mask → texts → post (grade+vignette+flash) → glitch slices → warning/letterbox/intro/banner/win overlays.
- `resize()` preserves world: shifts player/obstacles/coins/boss by GY delta, rebuilds backgrounds/FX preserving particles.
- Thumbs: `Backgrounds.thumb(L,200,56)` builds temp world; `ui.js` draws the equipped species on it for level cards.

## 4. Game loop & state machine

`Game(canvas, hooks{hud,hurt,end})` — `requestAnimationFrame(frame)`, `dt=min(0.033, delta)`, hitstop freeze, slow-mo factor `slow→1 at 2/s`.

Phases: `demo | intro (3.5s) | play | bossIntro | boss | win | dead`.
- `intro`: speed ramp 1.2s→ease 2.3s, player slides -40→50, countdown sfx at 2.0/2.5/3.0, then `play` + twist banner.
- `play`: `dist += speed*dt/10`, `score += dist*mult`, spawn, goal→ `bossIntro` or finish flag → `win`.
- `bossIntro`: lazy boss alloc + approach lerp, siren, at 3.3s → `boss` + boss music.
- `win`: zoom→1.12, player auto-run, at 3s → `end({won:true})`.
- `dead`: tumble physics, at 2s → `end({won:false})`.
- `demo`: title-screen autopilot (lookahead `speed*0.2+14`, auto-jump/duck, loop dist at 90% goal).

`load(L, {demo, quick, dino})` picks the species: `this.dino` (data), `this.st = {...DR.DINO_BASE, ...dino.stats}`, `this.perks = {faller, lava, breaker}` (per-run charges), `hearts = maxHearts = st.hearts`.

Player struct: `{x,y,vy,g,onGround,duck,inv,coyote,buf,hold,rot,dead}` + `keys{jump,duck}`. `live()` true in play/boss/bossIntro/demo and !dead.

## 5. Physics (game.js `updatePlayer`)

Every tunable below is read from `this.st` (species stats); values shown are `DINO_BASE` defaults.
- run: `g=2600` (×0.42 while holding+ascending, ×3.2 if duck held in air), `vy=-st.jumpV` (600) jump, hold window `st.hold` (0.2s), fast pit check via `pitUnder`. Ground `y=GY`. Duck box 21×9 vs stand 12×17.
- swim: `vy=clamp(vy+(base+thrust+sink)*dt,-220,260)`; thrust `-st.swimThrust` (1250), sink +1200, `base` = 560 while a key is held else `st.sinkIdle` (560; Mosasaurus 200); clamp SURF+18..GY.
- flip: `vy+=2300*g*dt`; floor GY (g=1) / ceiling CY=GY-150 (g=-1);Coyote 0.08s. `ceilA` lerps for ceiling draw.
- Shared: jump buffer `st.buffer` (0.13s), coyote `st.coyote` (~0.09s, 0.08 in flip), landing dust burst, i-frames decay.

Speed target = `lerp(speed[0]·st.speedMul, speed[1]·st.speedMul·st.maxSpeedMul, prog) × penalty`; `penalty` recovers at `st.penaltyRec` (0.4/s).

Damage: ignore if inv/demo/intro/win; hearts--, hits++, streak=0, inv=`st.inv` (1.6), hitstop 0.09, shake 9, penalty 0.8 (recovers 0.4/s), red flash, burst, `hurt()` hook for heart pop anim; 0 hearts → `die()` (slow 0.35, white flash, stopMusic, death sfx).

## 6. Content data (levels.js)

`DR.LEVELS[8]` fields: `id,name,tagline,twist,mode,bg,weather,ground,flyer,goal,speed[2],gap[2],flyerFrom,palette{skyTop,skyMid,skyBot,sun,far,mid,near,ground,groundDark,line,dino,dinoEye,obstacle,flyer,accent,accent2,grade,(lava|aurora|nebula)},music{bpm,root,scale,prog,lead,(arp|pad|echo|drive|bass|bossScale|leadEarly),seed},tips[],(boss{name,kind,hp,attacks[]}|fallers|pits|gusts|dark|ghostPhase|droneBob)`.
`DR.MIX_PHASES[5]` for W8. Balancing: speed lerp by `dist/goal`, spawn gap lerp `gap[1]→gap[0]` × (0.85+r*0.45) × max(speed,140).

## 7. Spawning / entities (entities.js mixed into `Game.prototype`)

`spawnUpdate`: heart pity (4.5% if `hearts < maxHearts`). `spawnRun` (fallers 24% → pits 42% → flyer if d>flyerFrom 66% → ground clusters), `spawnSwim` (kelp gate / mines / jelly / kelp+wave), `spawnFlip` (ceil/floor singles, split pairs, mid UFO).
Helpers: `addGround/addKelp/addFlyer/addFaller/addCoinArc(5)/Line/Wave`. Faller uses projectile math: `ft=sqrt(2*(GY+24)/1000)`, `trigX=landX+speed*ft`; warning triangle when on-screen, then becomes ice shard / lava crater ground (cached via `Sprites.groundOf`).
`hitbox()` per kind (phase-ghost null when alpha<0.45, faller null until y>-10, etc). `updateEntities`: scroll `sp=speed*dt + vx*dt`, bob/phase/mine sine, faller gravity 1000, coin magnet (`st.magnet` px, default 3) + collect (`10 × st.coinMul × mult`), heart collect (capped at `maxHearts`), graze tracking (`minD`, `passed`, `grazed`) → `closeCall()` if minD < `st.close` (6).
Species perks in `updateEntities`, checked before `damage()` and only when `inv <= 0 && !demo`: faller hit with `perks.faller > 0` → consume charge, `BONK!`; ground hit with `perks.breaker > 0` → consume charge, particle burst, obstacle removed, `SMASH!`. Lava pit contact in `updatePlayer` with `perks.lava > 0` → bounce `vy=-720`, `HOT HOP!`. All three use `Game.perkFx(text,color)` (floating text, ring, burst, small hitstop). Boss hits score `250 × st.bossMul × mult`.
Boss API: `bossIntroUpdate/bossUpdate/bossAttack(low|high|rain|slam)/spawnOrb/fireShot/updateShot(homing 420px/s)/bossHit/bossTick` — orb every 3rd attack (`sinceOrb>=2`), attack interval `lerp(1.15,1.9,hp/max)`, rain = 3 delayed `setTimeout` meteors guarded by phase check, slam = dip to GY-34 + shockwave `{kind:shock,w:18,h:11,vx:120}`. Death: filter proj/shock/faller/orb, 1.9s jitter+explosions → `gone` + `win()`.

## 8. Backgrounds (backgrounds.js)

`build(L,W,H,GY)`: `LW=W*2` tileable layers. Helpers `sky()` (14-band posterize+dither), `ridge()` (integer-cycle sines, seedable, flat quantize), `disc()`. Per theme painters (desert/city/tundra/volcano/ocean/haunted/space/glitch/**retro**/**vault**/**shore**) returning `{sky,layers[{img,speed}],ground,extra?,front?,groundFx?}`. `draw` wraps with modulo; `drawGround` + `groundTile()` (seeded texture + theme accents: volcano lava cracks, city neon, space panel lines; `L.bg==='retro'` early-returns a white floor with a 2px horizon and pebbles). Extras: aurora ribbons (additive), volcano smoke+glow, ocean god-rays, city lamp cones, glitch grid floor, retro pixel clouds. Colors via `DR.color.mix`.

## 9. Sprites (sprites.js)

String-map `spr(rows,colors)`; seeded `rng` mulberry32; `mk(w,h)` canvas factory.

**World art** is cached per level (`Sprites.level(L)`): flyers 2-frame ptero/drone/jelly/ghost/ufo/bat/**sentinel**/**gull** mapped `{ #:flyer, o:accent, +:accent2 }`; ground generators `genGround(kind,size,P,seed)` (cactus, barrier, ice, rock, kelp, tomb, crystal, glitch, **chrome**, **plate**); 64×64 bosses `genBoss` (wyrm/phantom/meteor, procedural craters/face/crown); 4-frame coin squash; heart. `flyerOf/groundOf` give variants for the mixed final world.

**Player art** is separate: `Sprites.forLevel(L, dinoId)` = `{...level(L), dino, dinoHurt}` where the dino set comes from `Sprites.dinoOf(id, palette)`, cached per species (classic Compsognathus cached per palette because it is world-tinted). Each set is `{stand, run[4], duck[4], jump}`; `dinoHurt` is the same set recolored white with a red eye (`d` → `#d8d8e0`).

Species build pipeline (`species(D, colors, outline)`):
1. `D.body` / `D.duck` string maps hold only the upper body (no legs). Chars: `#` body, `d` dark, `b` belly, `c` accent, `o` eye, `w` bone/claw, `e` thigh contour.
2. `legsOn(D, body, frame, duck)` appends legs from the `POSE` tables (`biped`: 8-row poses, `quad`: 6-row poses; each pose is one of `fwd | under | back | lift`). Near leg uses phase `CYCLE[frame]`, far leg `CYCLE[(frame+2)%4]`. Quadrupeds place a back and front leg pair per side (`D.bx`, `D.fx`) so diagonals move together.
3. `withLegs` merges poses over the last 2–3 body rows (the thigh), draws far legs only where the body is empty, and drops a shin row on double-support frames (0, 2, stand) to produce the 1 px body bob. Tall species (`D.tall`) keep one extra row.
4. `sprOutlined` adds a 1 px outline (`rgba(8,6,14,.85)`) and returns a canvas with anchor `ax, ay` (outline offset plus `D.ox`), so the torso lines up with the shared hitbox. Draw code subtracts `ax` and adds `ay`. The classic dino is built with no outline.
5. Jump uses `lift`/`back`; quadrupeds use the same legs, so no separate pose art.

`shade(hex)` derives the far-leg tint for the classic dino from the world's `P.dino`.

## 10. FX / weather (fx.js)

`FX(W,H,GY)`: `parts[] {x,y,vx,vy,life,max,size,color,grav,drag,glow,shape,ring?}`, `texts[]`, `weather[]`, `flash,flashColor,wind,glitch`, offscreen `dark` + precomputed `vig` radial.
`burst(n, angle/spread/speed/life/size/color/grav/drag/vx/glow/shrink)`, `ring`, `text`, `doFlash`. `setWeather` counts: rain90/snow110/dust40/embers60/bubbles40/fog7/stars50/glitch30. Per-kind `upd/drawWeather` (rain splash bursts, snow wind, dust scroll, embers rise, bubbles rise, fog drift, stars parallax, glitch 0/1 text). `update` integrates + decays flash/glitch. `drawDark(amount,lights)` punches radial holes via destination-out. `post(grade, vig=1)` applies palette grade + vignette (alpha-scaled; retro world passes `0.1`) + flash.

## 10B. Species data (dinos.js)

`DR.DINO_BASE` = `{hearts:3, jumpV:600, hold:.2, coyote:.09, buffer:.13, inv:1.6, magnet:3, close:6, comboDiv:6, swimThrust:1250, sinkIdle:560, speedMul:1, maxSpeedMul:1, penaltyRec:.4, light:0, coinMul:1, bossMul:1, fallerShield:0, lavaShield:0, breaker:0}`.

`DR.DINOS[19]` entries: `{id, name, short, era, unlock, stats, colors, body, duck, lx|bx|fx, ox, plan?, tall?, claw?, classic?}` (no user-facing perk/fact strings). `stats` overrides `DINO_BASE` (e.g. Ankylosaurus `{hearts:4, jumpV:565}`, Brachiosaurus `{coinMul:2, hearts:1}`, Carnotaurus `{lavaShield:1}`). `plan` is `quad`, `flipper` (Mosasaurus) or omitted for biped.

Unlock rules (`unlock`): `{start}`, `{world:n}` (≥1★ in world n), `{stars:n}` (total stars), `{allStars}` (3★ in all 8 worlds). `DR.dinoUnlocked(D, save)` evaluates them from `save.stars`, so unlocks are derived, never stored. `DR.dinoHint(D)` returns the lock label.

Perk wiring (single point each): `st.jumpV/hold` in `tryAction`; `st.coyote/buffer` in `press` and `updatePlayer`; `st.inv` in `damage`; `st.comboDiv` in `mult`; `st.light` added to both darkness light radii in `render`; `st.speedMul/maxSpeedMul/penaltyRec` in `update`; `st.swimThrust/sinkIdle` in swim physics; `st.magnet/close/coinMul/bossMul` and the three charge perks in `entities.js`; `st.hearts` in `load`.

## 10C. Coins and power bars (upgrades.js, ui.js, game.js)

**Data.** `DR.STATS[4]` = `jump | tough | agile | dash` (`{id, icon, name, hint}`), `DR.MAX_BARS = 10`. Starting bars per dino in a private table `B` (`[jump, tough, agile, dash]`), exposed via `DR.baseBars(id)`. `DR.barsOf(save, id)` = `min(10, base + save.bars[id][stat])`. `DR.barCost(n, id)` = `(40 + 25n) × (1 + .2·rank)` rounded to 5. `DR.winBonus(stars, boss)`.

**Effects** (`DR.applyBars(st, bars)`, returns a copy): jump `jumpV += 8j`; tough `inv += .08t`, `penaltyRec += .04t`, `hearts += (t≥5) + (t≥10)`; agile `coyote += .006a`, `buffer += .008a`, `fall += .15a`, and at `a ≥ 5` `air = 1`, `airPow = .8 + .02a`; dash at `d ≥ 1` `dashLvl = 1`, `dashDur = .3 + .03d`, `dashCd = 7.5 − .4d`.

**Power stars.** `DR.DINO_TIER` (id → 1..5), `dinoRank = tier − 1` (bar prices), `DR.powerStars(id)` (UI). No hidden per-tier stat bonuses any more; strength lives entirely in the starting bars.

**Stat build in `Game.load(L, {dino, up})`:** `DINO_BASE` ← species `stats` ← `applyBars(up)` where `up = barsOf(save, dino)`; skipped in demo.

**Moves.** Double jump in `press()` (run mode, airborne, `coyote ≤ 0`, `p.air > 0`, `airT > .06`, `GY − y > 24`; `vy = −jumpV · airPow`), refills on landing. `dash()` (phase `play|boss`, no active dash or cooldown): `p.dash`, `p.dashCd`, `inv ≥ .12` while active, speed target ×1.7 with fast smoothing, trail/sparks/shimmer. Overlap while invincible sets `o.grazed` (no combo).

**Banking.** Each coin adds `coinMul × (1 + coinBonus)` to `game.bank`; `end()` returns `bank`; `ui.onEnd` adds `bank + winBonus` to `save.coins` on win and death.

**Persistence.** `save.coins`, `save.bars = {dinoId: {jump?, tough?, agile?, dash?}}` (bought counts). Earlier `save.skills` one-off powers are refunded at their price and removed; `save.up` is dropped.

**UI.** `scrDino`: `openDino(id, from)` / `buildDino(flash)` / `closeDino()`. Hero `#dpCanvas` (300×190) is a 3D turntable: the current walk frame is extruded into a slab (copies stacked along depth, inner copies = body colours ×0.62 with the outline stripped), sorted back-to-front by `z·cos(a)`, scaled horizontally by `cos(a)`; auto-spins, drag to spin. Each stat renders a `.meter` of 10 `<i>` (`base` white, `on` gold, `mark` milestone dot), a `n/10` count, hint and price button (🪙 cost / MAX). Dex lists the equipped dino first; cards open the page. The Dash pad appears when the equipped dino has ≥1 Dash bar (the old `#dashTag` HUD pill was removed).

## 11. Audio (audio.js)

Lazy `AudioContext` on first input (autoplay policy). Graph: sources → musicBus(0.32)/sfxBus(0.55) → master(0.8/mute) → compressor → destination. `noiseBuf` 1s white.
`compose(cfg,boss)`: scales {major,minor,dorian,phrygian,lydian,harmonic}, prog→chords via `deg()`, 4×16-step seeded phrases (density by 16th position, random walk ±3), bpm (boss×1.12). Scheduler: `setInterval 25ms`, lookahead 0.12s, 16th=`60/bpm/4`: kick (0/8 + drive/boss extras), snare noise (4/12), hats, bass (0 + 4/6 drive), arp 16ths, lead (after 64 steps unless leadEarly/boss) + echo, pad on bar starts. `stopMusic(fade)` ramps. SFX: `tone/noise/kick` one-shots, 20+ cases. Mute → `localStorage dr_muted`, `setTargetAtTime`. `duck/suspend/resume` for pause.

## 12. UI / persistence (ui.js + sidepanel.html/css)

DOM: canvas + veil + hud (hearts/score/coins/pause/progress/flag/bossBar/combo) + touch pads + 7 screens (title, levels, help, pause, result, over, **dex**). `save = {unlocked:1,stars{},best{},last:1} ∪ dr_save`, plus `dino` (equipped id), `dinos[]` (announced) and `dexNew[]` (unseen). On load: missing `dinos` is seeded from currently unlocked species (silent migration), an invalid or locked `dino` resets to `compy`. `persist()`. HUD diff-cached (`hudCache`, including `maxHearts` so the heart row resizes per species) to avoid DOM churn; bossBar swaps progress. Screens via `show(id)`; HUD visible only when `id===null||scrPause`, touch only in-game. The world and Dex lists are full-bleed (`padding: 60px 0`, grids capped at 520px) so the cards occupy the panel edge-to-edge; the frosted backdrop (canvas `blur(13px) brightness(.6)` + `#veil` scrim at 50%) shows only in the vertical gaps between cards, never as side strips.
`startLevel(id,quick)`: init audio, `game.load(L,{quick,dino:save.dino})`. `buildLevels()`: thumb + equipped-species composite, lock filter, stars/best, link to the Dex. `onEnd`: stars calc `1 + (coins>=70% ?1:0) + (hits==0?1:0)`, unlock next world, `claimUnlocks()` (newly unlocked species → `dinos[]`/`dexNew[]`, unlock card with sprite on the result screen), result anim (450ms+380ms stagger + star sfx), EXTINCT tip random.
Input: keydown/up (SPACE/↑/W jump, ↓/S duck, P/ESC pause, M mute, Enter confirm), canvas pointerdown jump, pads with down class, pauseBtn stopPropagation, blur/hidden auto-pause, online/offline chip update. First pointerdown unlocks audio + starts title music.
Dex: `openDex(from)` / `buildDex()` / `closeDex()`; `dinoCard(D,w,h,frame,locked)` draws a species on a small canvas (locked = `source-in` black silhouette). A `requestAnimationFrame` loop animates only the equipped or hovered card (4 frames at 110 ms). Equip → save, rebuild, restart the title demo. Esc closes. All buttons via `on(id,fn)` with click sfx.

## 13. Performance / tuning notes

- Logical 280px + integer-ish pixel rects keep fill-rate low; DPR scaling only.
- Per-frame allocs minimal except weather/particles (capped ~hundreds); backgrounds pre-rendered, drawn 2× for wrap.
- Difficulty purely via speed/gap/flyerFrom/density + mode; W8 longest (1500m) + fastest (335).
- Walk cycle cadence: `STEP_PX = 9` world px per frame (`runFrame = floor(scroll/9) % 4`). Footfall dust fires when the frame changes to 0 or 2 while grounded in run mode; heavy species (`ankylo, stego, trike, brachio, trex, spino`) get larger puffs and `shake ≥ 0.8`. Sprite sets are built once per species and cached, so there is no per-frame allocation.
- Known fragilities: `setTimeout` in win/boss-rain/intro tied to live `fx/phase` guards; `drawGlitch` self-drawImage feedback; `ridge` getImageData snow-cap pass on tundra only at build.

## 14. Verification

- `node --check js/*.js` passes (no imports to check). In this environment node lives at `/opt/homebrew/bin/node`.
- Species: render a zoomed frame sheet of all 19 (stand, 4 walk, duck) on dark and light backgrounds and inspect; smoke-run every species through a level for 5 s of simulated frames with no exceptions; assert per-perk state (hearts, `st`, `perks`) after forced collisions; check the unlock card by calling `game.end(true)` on a world. Note: in the automated preview the tab is hidden, so `requestAnimationFrame` does not run and the game loop must be stepped manually (`update(1/60,1/60)` then `render()`). Manual: `python3 -m http.server` + load as unpacked extension, open side panel, play W1→W8, kill bosses via orbs, confirm stars persist after reload.


## 16. Retro world (World 11, `L.retro`)

Rebuilds the Chrome offline page rather than a cinematic theme. Data: `id:9, bg:'retro', weather:'none', ground:'chrome', retro:true`, palette all `#f7f7f7` paper with `#535353` ink (`dino`, `obstacle`, `flyer`, `line`, `accent`). Art: `THEMES.retro` (flat fill, two very light `ridge()` layers at parallax .05/.12, pixel clouds in `extra()` scrolling at .09), `CHROME_S/CHROME_L` string maps in `sprites.js` (fat trunk, arms at two heights) served by `genGround('chrome')`.

Light-background guards, all keyed off `L.retro`:
- `ui.js` toggles `document.body.retro` in `startLevel()` and `startDemo()`; `sidepanel.css` recolours score/coins/hearts/progress/flag/combo/twist chip/pause button/touch pads to `#535353`.
- `drawIntro()` swaps `#fff` copy for `#535353`; `drawBanner()` uses a `rgba(247,247,247,.94)` bar with `#6b6b6b` sub-text; `post()` vignette 0.1.
- `drawPlayer()` skips the white hurt sprite in favour of a 0.3-alpha blink, draws the normal sprite while dead (white death sprite would vanish), and adds a 2px soft shadow for pale species.

`js/ui.js` also carries `const UNLOCK_ALL = true;` — a build-time switch that short-circuits `levelOpen()` so every world is playable while the campaign is being developed. Set it to `false` for production and the `save.unlocked` rules take over again (the frontier-only progression code is untouched).

World 11 is `alwaysOpen: true`. `ui.js` centralises the check in `levelOpen(L) = L.alwaysOpen || L.id <= save.unlocked`, used by `buildLevels()` for the lock state (and the click guard). Progress only advances for the frontier world (`if (r.level === save.unlocked) save.unlocked = r.level + 1`), so clearing the retro world cannot unlock the campaign. The title backdrop pool excludes `alwaysOpen` levels because its light palette would fight the light-on-dark menu. Stars from World 11 still count toward totals and `{allStars}`.

Also hardened two latent bugs surfaced while testing: `frame()` clamps `dt` to `[0, .033]` (a backwards clock used to produce negative scroll and a negative sprite index), and `drawPlayer()` wraps the walk frame modulo positively.

## 17. Cyber Vault (World 9, `L.lasers`)

`spawnRun()` gets first refusal: `L.lasers && dist/goal > .12 && r < .34` → `addLaser(x)`. Each fence is `{kind:'laser', w:34-56, h:8|12, y:GY-9|GY-23, period:1.6-1.9, warn:.42, fire:.5, t}`. `updateEntities` derives phase from `((t % period)+period)%period`: off → charging (last .22 s, `o.charge`) → firing. `hitbox()` returns `null` unless `o.on`, so an idle beam is walk-through and takes no streak/close-call bookkeeping. Heights alternate (`this.laserFlip`, 15% chance to repeat) so the world reads as jump-duck-jump. Drawing: two emitter caps always visible, dashed centre line while charging, additive core + bloom while firing; a `laser` SFX plays on the off→on edge while on screen.

## 18. Tidal Shore (World 10, `L.tide`)

`tideUpdate(dt)` runs from `updateTwists` during `play` with a small state machine (`idle → warn → rise → hold → fall`), `tideLevel` 0→1, `waterY = GY - tideLevel*46`, and a 7-11 s idle gap. On `warn` it fires the banner + `wave` SFX, clears the lane, and calls `addPlat(p.x + speed*1.9)` — a `{kind:'plat', y:GY-58..63, w:560, h:20}` shelf plus a coin line. `spawnUpdate()` returns early whenever `tidePhase !== 'idle'`, so nothing blocks the run-up to the shelf; normal spawning resumes 1.2 s after the water drops.

Platform physics live in `updatePlayer` (`this.L.tide` only): the pre-integration `prevY` is compared against the shelf top and, when falling through it, the player snaps to `o.y`, keeps `onGround`, and records `p.floor` (defaults to `GY` each frame) so shadows, land dust and footfall puffs stay on the shelf. Walking past the end simply drops them back to the sand. Water hurts once per surge (`tideHit`, and only above `tideLevel > .55`) via `damage('tide')` with a splash burst; standing on a 58 px shelf stays dry because the peak is 46 px.

## 19. Save migration

The retro finale moved from world 9 to world 11 to make room for the two new worlds. `ui.js` runs a one-time `save.v` migration: existing `stars[9]` / `best[9]` move to slot 11, `last === 9` becomes 11, then `v = 2`. `save.unlocked` needs no change — a player who had cleared Extinction already points at world 9, which is now Cyber Vault.
