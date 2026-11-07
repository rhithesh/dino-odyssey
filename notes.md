I committed the jump, coin-arc and coin-size changes as `3f84920`, "Two-step jump, fixed-step player physics, coin arcs on the real jump path".

## What I tried

**1. Measured your recording**
- I read the video frame by frame and tracked the green dino's height through 6 jumps.
- Peaks were 283, 342, 342, 366, 370 and 372 px, so almost every jump came out a different height.
- The recording also had uneven frame gaps, mixing 16ms and 33ms.

**2. Simulated the old physics**
- Jump height depended on how long you held the key: a tap reached about 75, a full hold about 125, and anything in between was possible.
- Because the game moved the dino by however much time had passed each frame, the frame rate shifted arcs by about 5%.
- That showed the instability came from the hold mechanic plus the frame rate.

**3. Rebuilt the jump (option B)**
- There are now only two heights. A tap gives a hop at 60% height. Holding past 0.1s gives the full jump.
- The jump is tuned by height and time to the top, and the dino falls faster than it rises.
- A held jump hangs briefly at the top, and the dino squashes and stretches on take-off and landing.
- Physics runs in steps of at most 1/240s, so arcs come out the same at any frame rate.

**4. Checked it headlessly**
- I ran the built game code at 30, 60 and 144 fps. Hops came out at about 71 and full jumps at about 119, matching within 1% across frame rates.

**5. Fixed the coin arcs**
- The old arcs were fixed shapes that matched neither jump height.
- Now each arc is calculated from the real hop or full-jump path for your species, Jump bars and run speed.
- I simulated jumps over the arcs at speeds 190–300: 5/5 coins when the jump is timed right.

**6. Made coins bigger**
- Coins went from 6px squares to 9px round coins, and the pickup area from 6px to 15px.
- With that change, jumps 60ms off still collect 5/5 coins, except full jumps at top speed, which get 4/5.

None of this has been played in the browser yet, only simulated.

## Where to tune it

| What you want to change | Where | Current |
|---|---|---|
| Hop height, as a fraction of a full jump | `src/js/game.ts:13` `HOP` | `.6` |
| How long to hold for a full jump | `src/js/game.ts:13` `HOLD_WIN` | `.1` s |
| How much faster the fall is than the rise | `src/js/game.ts:13` `FALL` | `1.45` |
| Full-jump height | `src/js/game.ts:234` the `120` in `H = 120 * …` | 120 |
| Time to reach the top (higher = floatier) | `src/js/game.ts:234` the `.34` in `T = .34 * …` | 0.34 s |
| Apex hang strength (lower = longer hang) | `src/js/game.ts:277` `g *= .6` | `.6` |
| Squash and stretch amount | `src/js/game.ts:569` `.12` / `.1` | 12% / 10% |
| What one Jump bar adds | `src/js/upgrades.ts:37` `jumpV += 8 * j` | +8 (about +2.7% height) |
| A species' base jump | `stats: { jumpV: … }` in `src/js/dinos.ts` | 600 (Ankylo 565) |
| Coin size | `src/js/sprites.ts:370` `COIN` | 9 px |
| Coin pickup area | `src/js/entities.ts:260` `w: 15, h: 15` (with `- 3` offsets) | 15 px |
| How wide a coin arc spreads | `src/js/entities.ts:152` the two `.7`s | 70% of the rise/fall |

Coin arcs follow the jump numbers automatically, so changing `HOP`, `FALL`, the height or the time moves the arcs with them. After any change, run `npm run build` and refresh `localhost:8000/sidepanel.html`.

---

# World 12 Indiranagar + Unicornosaurus

Branch `indiranagar-world`, pushed to origin. PR: https://github.com/rhithesh/dino-odyssey/pull/new/indiranagar-world

| Commit | What |
|---|---|
| `549ed7e` | Boss worlds clear through a warp gate; grand pennant finish line (your earlier work) |
| `adeb7e1` | World 12 street: blue sky, metro line with INDIRANAGAR station, 21 real shopfronts (Nothing, Starbucks, Truffles, Toit, Third Wave, Subko, Rameshwaram, Namdhari's, 403 Forbidden, …), tech-twitter billboards, raintrees and cables |
| `59d83df` | Traffic (autos, bikes, cars, same-direction lorries you can ride) plus potholes and speed humps that cost ¼ heart; partial hearts in the HUD |
| `5fcd376` | KFC Signal finish: zebra crossing, traffic cop on a pedestal, signal mast with countdown, and the Pizza Hut (Kannada) / SNITCH corner building with a palm |
| `ef2f75d` | Unicornosaurus: free pink unicorn with a stemmed daisy for an ear, sparkles on jump, drawn at 1.3× with the shared hitbox |

Indiranagar is always unlocked (`alwaysOpen`) and is in the title-demo rotation.

## Where to tune it

| What you want to change | Where | Current |
|---|---|---|
| World length, speed, obstacle gap | `src/js/levels.ts:99` | goal 1100, speed 205–290 |
| Chance a spawn is a pothole/hump | `src/js/entities.ts:25` | 20% |
| Chance a spawn is a vehicle | `src/js/entities.ts:26` | 62% |
| Vehicle sizes and speeds | `src/js/entities.ts:106` `VEH_CFG` | |
| Lorry speed vs. run speed | `src/js/entities.ts:112` `TRUCK_PACE` | `.55` |
| Hump bounce | `src/js/entities.ts:142` `vy = -170` | -170 |
| Heart cost of pothole/hump | `src/js/game.ts:14` `CHIP` | `.25` each |
| Signal goes amber / green | `src/js/game.ts:765` `d < 140` / `d < 60` | 140 / 60 px |
| Corner building size | `src/js/game.ts:20` `CORNER_W/H` | 132 × 128 |
| Shopfront baseline | `src/js/backgrounds.ts:366` `FP` | `GY - 16` |
| Unicorn draw size | `src/js/dinos.ts:22` `scale` | 1.3 |
| Sparkles on jump / double jump | `src/js/game.ts:225` / `:185` | 16 / 12 |

Checked with typecheck, build and headless renders only. Not yet played in the extension.
