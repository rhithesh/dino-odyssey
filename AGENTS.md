# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project

Dino Odyssey is a Chrome Manifest V3 side-panel extension: a vanilla DOM-and-canvas offline dino game with 11 worlds, bosses, procedural art, and chiptune music. There is no React or other runtime framework, and no network access is needed.

Read these before larger changes:
- `README.md`: user-facing overview, controls, worlds, and build/install steps.
- `code_understanding.md`: source layout, runtime architecture, and save/progression notes.
- `PRD.md`, `TRD.md`, `DINO_DESIGN_PLAN.md`: product and design intent. Treat them as background, not as a spec to rewrite.

## Commands

```sh
npm install          # first time only
npm run typecheck    # tsc --noEmit over src/
npm run build        # clean dist/, compile TS, Tailwind CSS, copy static files
```

There is no automated test suite. Verification is:
1. `npm run typecheck` passes.
2. `npm run build` passes.
3. For gameplay, UI, or audio changes, load `dist/` as an unpacked extension in `chrome://extensions` and smoke-test the affected screen or world.

## Architecture rules

- **Classic scripts, not ES modules.** `tsconfig.json` uses `module: "none"`. Source files share a browser-global `DR` object, declared in `src/globals.d.ts` and initialized in `src/js/sprites.ts`.
- **Script order matters.** `sidepanel.html` loads scripts in a fixed order: `sprites`/`audio` → `levels`/`dinos`/`upgrades` → `backgrounds`/`fx` → `game` → `entities` → `ui`. Do not reorder them, and do not add an `import`/`export` that would break this model.
- **`DR` is broadly typed as `any`.** Strict checking is off (`strict: false`, `noImplicitAny: false`). Do not tighten types casually. Doing so would need explicit interfaces and changes at the script boundaries.
- **World IDs are array indexes.** `ui.ts` looks up worlds with `LEVELS[id - 1]`. Keep `src/js/levels.ts` in ID order, and do not reorder or remove entries without updating that lookup.
- **Save data lives in localStorage.** Progress is under `dr_save`, and the sound preference is under `dr_muted`. Changing the save shape needs a migration or a defensive default so existing saves still load.
- **`UNLOCK_ALL` in `src/js/ui.ts` is a dev switch** that unlocks every world. Leave it as is unless the user asks to change progression. The README explains how to restore normal locks.

## Files not to edit

- `dist/` is generated and git-ignored. Never hand-edit it. Change `src/`, `sidepanel.html`, `sidepanel.css`, or `manifest.json`, then rebuild.
- `node_modules/` and `package-lock.json` change only through npm.

## Styling

- Tailwind scans `sidepanel.html` and `src/**/*.ts`. Prefer utility classes in markup and in dynamically built UI.
- `sidepanel.css` holds only global setup, keyframes, and the retro palette override. Add styles there only when a utility is awkward.
- Tailwind preflight is disabled on purpose, so do not enable it. It would change canvas and native-control behavior.

## Conventions

- Match the surrounding code's naming, formatting, and comment density. Add comments only where behavior is not obvious.
- Keep changes scoped to the request. Do not refactor the global architecture as a side effect.
- Keep the Dino Dex data in `src/js/dinos.ts` and power-bar math in `src/js/upgrades.ts`. Do not duplicate those rules in UI code.
- Every species shares the same hitbox. Skins must not change difficulty. Only starting bars differ.

## Git

- Recent history uses short imperative subjects, for example `Two-step jump, fixed-step player physics, coin arcs on the real jump path`.
- Do not commit or push unless the user asks.
- Do not delete `.DS_Store` or other untracked user files.
