# Dino Odyssey: landing page

The marketing site for Dino Odyssey, built with Next.js 16, Tailwind CSS 4 and framer-motion.

```sh
cd landing
npm install
npm run dev      # http://localhost:3000
npm run build    # production build
```

`predev` and `prebuild` run `npm run sync-game`. That builds the game's web bundle in the repo root (`npm run build:web`) and copies it to `public/play/`, so the **Play in browser** section embeds the real game. `public/play/` is generated and git-ignored.

## Where things live

| Path | What |
| --- | --- |
| `app/page.tsx` | Section order |
| `components/` | One file per section (Hero, Worlds, Bosses, Hatch, Dex, Features, Demo, Finale) |
| `lib/content.ts` | Copy, world and boss data, perk lines, and `LINKS` for the store buttons |
| `public/media/v/` | Gameplay clips (H.264 MP4) |
| `public/media/p/` | Poster frames for each clip |
| `public/media/dinos/` | 4-frame run-cycle sprite strips exported from the game, plus `dinos.json` |
| `app/fonts/` | ByteBounce and Priestacy, copied from the game's `fonts/` |

All footage is real gameplay. It was captured from the `www/` build with a frame-stepped clock and the game's own title-screen autopilot, so clips run at a steady 30 fps.

## Before launch

- Set the real Chrome Web Store and App Store URLs in `LINKS` (`lib/content.ts`). They point at `#play` for now.
- Add `metadataBase` in `app/layout.tsx` once the domain is known, so the Open Graph image resolves.
