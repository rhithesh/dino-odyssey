# Dino Roster: Design & Build Plan

Implements PRD §4B (Playable Species Roster): 19 dinosaurs, each with its own pixel art and one passive ability, unlocked by clearing worlds and earning stars.

## 1. Art direction

- **Same language as the game.** These are hand-drawn string-map pixel sprites rendered by `spr()`, with no image files. Each dino is a little bigger than the obstacles, about 20–26 px.
- **Silhouette first.** At 1× in a narrow side panel, a species is recognised by its outline, not its detail. Every dino has one signature shape:

| Species | Signature shape | Body plan |
|---|---|---|
| Compsognathus | the original Chrome dino (homage, tinted by the world palette) | biped |
| Hypsilophodon | small beak, slim body, very long tail | biped |
| Velociraptor | feathered tail fan, sickle claw | biped |
| Gallimimus | long neck, ostrich beak | biped |
| Parasaurolophus | long tube crest sweeping backward | biped |
| Dilophosaurus | twin head crests, neck frill | biped |
| Pachycephalosaurus | huge dome with spike ring | biped |
| Iguanodon | bulky body, thumb spike | biped |
| Carnotaurus | bull horns, tiny arms | biped |
| Allosaurus | eyebrow horns, striped back | biped |
| Stegosaurus | back plates, thagomizer tail | quadruped |
| Ankylosaurus | low armoured shell, tail club | quadruped |
| Triceratops | frill, three horns | quadruped |
| Spinosaurus | striped sail, crocodile snout | biped |
| Pteranodon | head crest, folded wings | biped (wing-walk) |
| Microraptor | iridescent feathers on arms and legs | biped |
| Tyrannosaurus Rex | giant head, teeth, tiny arms | biped |
| Mosasaurus* | eel body, flippers, toothy jaw | flipper-walk |
| Brachiosaurus | neck rising straight up | quadruped |

- **Colour ramps.** Each species has its own 6-colour ramp: `#` body, `d` dark (stripes and far-side legs), `b` belly, `c` accent (crest, sail, plates), `o` eye and `w` bone/teeth/claws. The colours are picked so no two species share a dominant hue.
- **Readability on every world.** An automatic 1 px dark outline is added around each sprite, so a brown T-Rex still reads against the volcano and a pale Brachio against the tundra.
- **Animation.** A 4-frame walk cycle (heel strike → planted → push-off → knee lift), plus stand, jump and four duck frames.
  - Legs are generated, not hand-drawn per species, with theropod anatomy rather than chicken legs: a big drumstick thigh painted over the body (shaded on its back edge), a 3–4 px shin, a backward-bending ankle and a wide foot with a bone-coloured claw. The stride is about 10 px.
  - Bipeds: the far leg (dark shade, tucked behind the body) runs half a cycle behind the near leg.
  - Quadrupeds trot in diagonal pairs (near-back with far-front).
  - Body bob: the sprite dips 1 px when both feet are down and rises as a leg passes under.
  - Frames advance by distance scrolled (every 9 px), so leg speed matches ground speed.
  - Every heel strike kicks up dust; the six heavy species also give the camera a tiny thud.
  - Compsognathus (the classic Chrome dino) uses the same cycle.
  - The hurt flash (white with a red eye) is generated from the same maps.

## 2. Gameplay rules (from the PRD)

- **Same hitbox for every species** (12×17 standing, 21×9 ducking), so the art never changes difficulty. Each sprite carries an `ox` anchor so its torso sits over the hitbox.
- **One small passive per species**, implemented by reading `this.dino` stats at the exact tuning points (jump velocity, coyote/buffer time, i-frames, magnet radius, and so on). There is no physics fork.

## 3. Data and code

- `js/dinos.js` holds `DR.DINOS[]`, one entry per species: `{ id, name, era, fact, plan, colors, body, duck, lx, unlock, perk, stats }`.
- `DR.Sprites.dinoOf(dinoId, palette)` builds and caches the frames. The `forLevel(L, dinoId)` cache key becomes `level:dino`.
- `game.load(L, {dino})` merges the base stats with the species overrides into `this.stats`, which the passives read.
- Save data gains `dino` (equipped) and `dinos[]` (seen unlocks). Unlocks are derived from `stars` / `totalStars`, so existing saves migrate automatically.

## 4. UI

- **DINO DEX screen**, opened from the title and the worlds screen.
  - A grid of cards, each with an animated sprite preview, name, era, fact and perk.
  - Locked cards show a black silhouette and a hint such as `Clear W4` or `12★`.
  - Clicking a card equips it.
- **Unlock toast** on the results screen ("NEW DINO: Velociraptor").
- The title demo and the level-card thumbnails use the equipped dino.
- The intro card shows the dino's name under the world name.

## 5. Verification

1. Render a sprite sheet of all 19 species × all frames on light and dark backgrounds, and inspect it.
2. Play-test the passives in the preview: hearts (Ankylosaurus 4, Brachiosaurus 1), jump, swim and magnet.
3. Run `node --check` on every file.
