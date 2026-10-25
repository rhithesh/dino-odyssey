# Dino Odyssey — the offline dino game, reimagined

A Chrome side-panel extension: 11 cinematic worlds, 3 bosses, procedural chiptune music. No network needed.

## Install
1. Open `chrome://extensions` and turn on **Developer mode**.
2. Click **Load unpacked** and pick this folder.
3. Pin the extension, then click its icon. The game opens in the side panel.

> **Build note:** all 11 worlds are unlocked by default while the campaign is still being developed. Set `UNLOCK_ALL = false` at the top of `js/ui.js` to restore normal progression for production.

## Controls
Space / ↑ / tap: jump (hold for higher) · ↓: duck / fast-fall · P / Esc: pause · M: mute

## Worlds
1. Desert Dawn: the classic
2. Neon Rain: bobbing drones
3. Frozen Aurora: falling icicles and blizzards
4. Magma Core: meteors and lava pits, **boss: Magma Wyrm**
5. The Abyss: underwater swimming
6. Haunted Hollow: darkness and lightning, phasing ghosts, **boss: Phantom King**
7. Zero-G Station: tap to flip gravity
8. Extinction: the rules glitch every phase, **final boss: The Extinction Event**
9. Cyber Vault: pulsing laser fences — jump the low beams, duck the high ones
10. Tidal Shore: a tsunami every few seconds; jump onto the raised rock shelf to stay dry
11. No Internet: the real offline dino game, recreated — paper-white sky, pixel clouds, classic cacti, pterodactyls. **Unlocked from the start.**

## Dino Dex

19 playable species (Compsognathus to T-Rex), each with its own pixel art and its own strengths. Every species shares the same hitbox, so skins never change difficulty; only the starting bars do. You unlock them by clearing worlds and earning ★. Equip one from **DINO DEX** on the title screen or the worlds screen. The design is described in `DINO_DESIGN_PLAN.md`; the data is in `js/dinos.js`.

## Coins and power bars

Coins you collect are banked even if you crash, and a cleared world pays a bonus. Tap **DINO UPGRADES** on the title (or any dino in the Dino Dex) to open that dino's page: watch it spin in 3D, equip it, and fill its 4 power meters (10 bars each): **Jump**, **Toughness** (+1 heart at 5 and 10 bars), **Agility** (Double Jump at 5 bars) and **Dash** (Shift, D or →). Every dino starts with its own bars; later dinos start fuller. Each coin purchase adds one bar, and each next bar costs a bit more.
