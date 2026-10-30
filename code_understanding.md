# Codebase Guide

## What this project is

Dino Odyssey is a Chrome Manifest V3 side-panel extension. It is a vanilla DOM-and-canvas game: there is no React or runtime framework, and the game art, backgrounds, and music are generated in code. The extension works offline.

## Source layout

| Path | Responsibility |
| --- | --- |
| `manifest.json` | Chrome extension metadata, side-panel entry point, service worker, and permissions. |
| `sidepanel.html` | Static screen markup and the ordered list of classic-script entry points. |
| `sidepanel.css` | Tailwind entry point, global reset, custom animation keyframes, and retro-world theme overrides. Most layout and component styles are Tailwind utilities in markup and UI templates. |
| `src/background.ts` | MV3 service worker; configures toolbar-click behavior to open the side panel. |
| `src/js/sprites.ts` | Pixel-art rendering helpers, dinosaur sprites, and obstacle sprites. |
| `src/js/audio.ts` | Procedural music and sound effects using Web Audio. |
| `src/js/levels.ts` | World configuration: modes, palettes, pacing, twists, and bosses. |
| `src/js/dinos.ts` | Dinosaur roster, stats, unlock requirements, and power ratings. |
| `src/js/upgrades.ts` | Power-bar stats, costs, bonuses, and calculations. |
| `src/js/backgrounds.ts` | Procedural world scenery, ground, parallax layers, and world-card thumbnails. |
| `src/js/fx.ts` | Weather, particles, floating text, darkness, flashes, and other effects. |
| `src/js/game.ts` | Core game loop, player state/physics, phases, camera, rendering, and lifecycle. |
| `src/js/entities.ts` | Extends `Game` with obstacle spawning, collisions, pickups, and boss behavior. |
| `src/js/ui.ts` | Save data, screen navigation, HUD, world cards, dinosaur pages, input, and game callbacks. |
| `tailwind.config.cjs`, `tsconfig.json`, `scripts/` | Styling and TypeScript build configuration plus generated-output handling. |
| `dist/` | Generated, loadable extension. Do not edit by hand; it is recreated by the build. |

## Runtime architecture

The game scripts are emitted as **classic scripts**, not ES modules. They share a browser-global `DR` object. `src/globals.d.ts` declares that global for TypeScript; `sprites.ts` initializes it at runtime. Keep the script order in `sidepanel.html` intact:

1. `sprites` and `audio` provide foundational services.
2. `levels`, `dinos`, and `upgrades` register game data and calculations.
3. `backgrounds` and `fx` provide rendering systems.
4. `game` defines `DR.Game`.
5. `entities` augments `DR.Game.prototype` with gameplay systems.
6. `ui` creates the game instance and connects the DOM, input, saves, and callbacks.

At startup, the UI loads local save data, renders the title screen, and starts a demo run. Selecting a world loads its configuration into `Game`; the animation loop updates and renders gameplay. The game reports HUD changes and run completion through callbacks supplied by the UI. The UI then updates stars, scores, coins, unlocks, and screens.

## Save data and progression

- Game progress is stored in local storage under `dr_save`; the sound preference uses `dr_muted`.
- `dr_save.profile` (`{ name, dino, color, age }`) is set by the hatch screens in `ui.ts`, and the player's own dino (`id: 'mine'` in `dinos.ts`) takes its name and colors from it via `DR.setMyDino`. `dr_save.seen.tutorial` records that the World 1 training run (`tutUpdate` in `entities.ts`) is done. Saves from before onboarding are marked as already trained.
- World definitions are in `src/js/levels.ts`. The UI currently looks up a world with `LEVELS[id - 1]`, so keep IDs in array order.
- Dinosaur definitions and unlock rules are in `src/js/dinos.ts`; power-bar math is in `src/js/upgrades.ts`.
- `UNLOCK_ALL` in `src/js/ui.ts` is a development switch that currently makes every world playable. Set it to `false` to restore progression-based locks.
- `FORCE_ONBOARDING` in `src/js/ui.ts` is a development switch for testing the first launch: when `true`, every launch shows the hatch screens and runs the World 1 training once, without clearing progress. Set it to `false` for production.

## Styling

Tailwind scans `sidepanel.html` and `src/**/*.ts`. Static elements and dynamically created UI use utility classes directly. `sidepanel.css` keeps only global setup and styles that are awkward to express as utilities, such as keyframes and the retro palette override. Tailwind preflight is disabled to avoid changing the canvas and native-control behavior.

## Build and load in Chrome

```sh
npm install
npm run typecheck
npm run build
```

The build clears and recreates `dist/`, compiles TypeScript into JavaScript, processes Tailwind CSS, and copies the manifest, panel HTML, and icons. In `chrome://extensions`, use **Load unpacked** and select `dist/`.

The TypeScript setup is intentionally compatible with the existing global architecture (`module: "none"`). Strict checking is currently relaxed and `DR` is broadly typed as `any`; moving to ES modules or tightening types requires defining explicit interfaces and updating the script/runtime boundaries.

There is no automated gameplay test suite yet. `npm run typecheck` and `npm run build` verify compilation; gameplay changes should also be smoke-tested in the unpacked extension.
