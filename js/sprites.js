// Pixel-art sprites: string maps rendered into offscreen canvases, plus procedural generators.
window.DR = window.DR || {};

(function () {
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // Render a string map. Chars map to colors; ' ' and '.' are transparent.
  function spr(rows, colors) {
    const w = Math.max(...rows.map(r => r.length)), h = rows.length;
    const c = mk(w, h), g = c.getContext('2d');
    rows.forEach((r, y) => {
      for (let x = 0; x < r.length; x++) {
        const col = colors[r[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    return c;
  }

  // Seeded RNG (mulberry32) so procedural art is stable.
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ---------------- Dino ----------------
  const DINO_BODY = [
    '           ######## ',
    '          ##o#######',
    '          ##########',
    '          ##########',
    '          ##########',
    '          #####     ',
    '          ########  ',
    '#        #####      ',
    '#       ######      ',
    '##     ########     ',
    '###   ######## ##   ',
    '##############  #   ',
    ' #############      ',
    '  ###########       ',
    '   #########        ',
    '    #######         ',
  ];
  const LEGS = {
    stand: ['     ###  ##', '     ##    #', '     #     #', '     ##    ##'],
    runA:  ['     ###  ##', '      ##   #', '           #', '           ##'],
    runB:  ['     ###  ##', '     ##   # ', '     #      ', '     ##     '],
  };
  const DINO_DUCK = [
    ['                   ######## ', '#      ############o########', '##   ######################', '########################   ', ' ###################       ', '  ##########  ###          ', '   ###   ##                ', '   ##     #                ', '          ##               '],
    ['                   ######## ', '#      ############o########', '##   ######################', '########################   ', ' ###################       ', '  ##########  ###          ', '   ###   ##                ', '   #     ##                ', '   ##                      '],
  ];

  function dino(body, eye) {
    const c = { '#': body, 'o': eye };
    return {
      stand: spr(DINO_BODY.concat(LEGS.stand), c),
      run: [spr(DINO_BODY.concat(LEGS.runA), c), spr(DINO_BODY.concat(LEGS.runB), c)],
      duck: DINO_DUCK.map(d => spr(d, c)),
      jump: spr(DINO_BODY.concat(LEGS.stand), c),
    };
  }

  // ---------------- Species (DR.DINOS) ----------------
  // Walk cycle: every leg loops FWD (heel strike) → UNDER (planted) → BACK (push-off) → LIFT (knee up, swinging).
  // Theropod anatomy, not chicken: a big drumstick thigh painted over the body with a dark muscle contour (e),
  // a thick shin, a backward-bending ankle and a wide foot with a bone-colored claw (w).
  // The top OVERLAP rows sit on the body. Far-side legs run half a cycle behind, all in the dark shade, behind the body.
  const POSE = {
    biped: {
      fwd: ['   ###       ', '  e#####     ', '  e######    ', '   e#####    ', '      ####   ', '       ###   ', '       ###   ', '       #####w'],
      under: ['   ###       ', '  e#####     ', '  e######    ', '   e####     ', '    ####     ', '   ###       ', '   ###       ', '   #####w    '],
      back: ['   ###       ', '  e#####     ', '  e######    ', '  e####      ', ' ####        ', '###          ', '###          ', '####w        '],
      lift: ['   ###       ', '  e#####     ', '  e#######   ', '    e######  ', '     #####   ', '    ####     ', '   #####w    ', '             '],
    },
    quad: {
      fwd: ['  ###   ', ' e#####  ', '   ####  ', '   ####  ', '    #### ', '    ####w'],
      under: ['  ###   ', ' e#####  ', '  ####   ', '  ####   ', '  ####   ', '  ####w  '],
      back: ['  ###   ', ' e####   ', ' ####    ', ' ####    ', '####     ', '####w    '],
      lift: ['  ###   ', ' e#####  ', '   ####  ', '   ####  ', '  ####w  ', '         '],
    },
  };
  const CYCLE = ['fwd', 'under', 'back', 'lift'];
  const WALK_FRAMES = 4;
  // Merge legs [{ pose, x, far }] into the body map; `top` = body row where the pose starts.
  // Only the pose rows in keepRows are used: dropping a shin row on double-support frames dips the body 1px (the bob).
  function withLegs(body, legs, keepRows, overlap) {
    const out = body.map(r => r.split(''));
    const top = body.length - overlap;
    for (let i = overlap; i < keepRows.length; i++) out.push([]);
    for (const L of legs) {
      keepRows.forEach((r, i) => {
        const row = L.pose[r] || '', line = out[top + i];
        for (let c = 0; c < row.length; c++) {
          const ch = row[c]; if (ch === ' ') continue;
          const x = L.x + c; if (x < 0) continue;
          const filled = line[x] && line[x] !== ' ';
          if (L.far && filled) continue; // far leg stays behind the body
          if (ch === 'e' && !filled && i < overlap) continue; // muscle contour only shows where it crosses the body
          while (line.length < x) line.push(' ');
          line[x] = L.far ? 'd' : ch === 'e' ? 'd' : ch;
        }
      });
    }
    return out.map(r => Array.from({ length: r.length }, (_, i) => r[i] || ' ').join(''));
  }
  // frame: 0..3 walk cycle, or 'stand' | 'jump'. duck: crouched legs (shin rows skipped).
  function legsOn(D, body, frame, duck) {
    const quad = D.plan === 'quad', P = POSE[quad ? 'quad' : 'biped'];
    let a, b; // a = near leg (biped) / near-back + far-front pair (quad); b = the opposite phase
    if (frame === 'stand') { a = 'under'; b = 'under'; }
    else if (frame === 'jump') { a = 'lift'; b = 'back'; }
    else { a = CYCLE[frame]; b = CYCLE[(frame + 2) % 4]; }
    const low = frame === 'stand' || frame === 0 || frame === 2;
    if (quad) {
      const rows = duck ? [0, 1, 4, 5] : low ? [0, 1, 2, 4, 5] : [0, 1, 2, 3, 4, 5];
      const bx = D.bx - 2, fx = D.fx - 2;
      return withLegs(body, [
        { pose: P[b], x: bx + 2, far: true }, { pose: P[a], x: fx + 2, far: true },
        { pose: P[a], x: bx }, { pose: P[b], x: fx },
      ], rows, 2);
    }
    let rows = duck ? [0, 1, 2, 3, 6, 7] : low ? [0, 1, 2, 3, 4, 6, 7] : [0, 1, 2, 3, 4, 5, 6, 7];
    if (D.tall && !duck) rows = [0, 1, 2, 3, 4, 5, ...rows.slice(5)];
    const x = (duck ? 6 : D.lx + 3) - 5;
    return withLegs(body, [{ pose: P[b], x: frame === 'stand' ? x + 4 : x, far: true }, { pose: P[a], x }], rows, 3);
  }
  // Render a map with a 1px dark outline so every species reads on every world.
  function sprOutlined(rows, colors, outline) {
    const w = Math.max(...rows.map(r => r.length)) + 2, h = rows.length + 2;
    const c = mk(w, h), g = c.getContext('2d');
    const on = (x, y) => y >= 1 && y <= rows.length && !!colors[(rows[y - 1] || '')[x - 1]];
    g.fillStyle = outline;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (on(x, y)) continue;
      if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) g.fillRect(x, y, 1, 1);
    }
    rows.forEach((r, y) => { for (let x = 0; x < r.length; x++) { const col = colors[r[x]]; if (col) { g.fillStyle = col; g.fillRect(x + 1, y + 1, 1, 1); } } });
    c.ax = 1; c.ay = 1;
    return c;
  }
  function species(D, colors, outline = 'rgba(8,6,14,.85)') {
    const make = (body, frame, duck) => {
      const rows = legsOn(D, body, frame, duck);
      const s = outline ? sprOutlined(rows, colors, outline) : Object.assign(spr(rows, colors), { ax: 0, ay: 0 });
      s.ax += duck ? (D.dox ?? D.ox) : D.ox;
      return s;
    };
    const cyc = Array.from({ length: WALK_FRAMES }, (_, i) => i);
    return {
      stand: make(D.body, 'stand'),
      run: cyc.map(i => make(D.body, i)),
      duck: cyc.map(i => make(D.duck, i, true)),
      jump: make(D.body, 'jump'),
    };
  }
  // Darker (or lighter, for very dark colors) shade used for far-side legs.
  function shade(hex) {
    const n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    const lum = (r * 299 + g * 587 + b * 114) / 1000, k = lum < 70 ? 1.6 : .62;
    const f = v => Math.max(0, Math.min(255, Math.round(lum < 70 ? v * k + 18 : v * k)));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  // The classic Chrome dino, rebuilt on the same walk cycle (no outline, tinted by the world palette).
  const CLASSIC = { body: DINO_BODY, duck: DINO_DUCK[0].slice(0, 6), lx: 5, ox: 0 };
  const dinoCache = {};
  function dinoOf(id, P) {
    const D = (DR.DINOS || []).find(d => d.id === id) || (DR.DINOS || [])[0];
    if (!D || D.classic) {
      const key = 'classic' + P.dino + P.dinoEye;
      return dinoCache[key] || (dinoCache[key] = {
        dino: species(CLASSIC, { '#': P.dino, o: P.dinoEye, d: shade(P.dino), w: P.dino }, null),
        hurt: species(CLASSIC, { '#': '#ffffff', o: '#ff3b5c', d: '#d8d8e0', w: '#ffffff' }, null),
      });
    }
    if (dinoCache[D.id]) return dinoCache[D.id];
    const white = {}; for (const k in D.colors) white[k] = k === 'o' ? '#ff3b5c' : k === 'd' ? '#d8d8e0' : '#ffffff';
    return (dinoCache[D.id] = { dino: species(D, D.colors), hurt: species(D, white) });
  }

  // ---------------- Flyers ----------------
  const FLY = {
    ptero: [
      ['     #          ', '     ##         ', '     ###        ', '  ## ####       ', ' ##o######      ', '############### ', '    ########### ', '      ######    '],
      ['                ', '                ', '                ', '  ##            ', ' ##o####        ', '################', '     ########## ', '      ######    ', '      ####      ', '      ###       ', '      ##        '],
    ],
    drone: [
      ['####      ####', ' ##        ## ', '  #   ##   #  ', '  ##########  ', ' ###oooooo### ', '  ##########  ', '    #    #    ', '   ##    ##   '],
      ['  ##      ##  ', '####      ####', '  #   ##   #  ', '  ##########  ', ' ###oooooo### ', '  ##########  ', '    #    #    ', '   ##    ##   '],
    ],
    jelly: [
      ['   ######   ', '  ########  ', ' ##o####o## ', ' ########## ', '############', ' + + + + +  ', ' +  + +  +  ', '  + +  + +  ', '  +  +  +   ', '   +    +   '],
      ['   ######   ', '  ########  ', ' ##o####o## ', ' ########## ', '############', '  + + + + + ', '  +  + +  + ', ' + +  + +   ', ' +  +  +    ', '+    +      '],
    ],
    ghost: [
      ['    ####    ', '  ########  ', ' ########## ', ' ##oo##oo## ', ' ##oo##oo## ', ' ########## ', ' ####++#### ', ' ########## ', ' ########## ', ' ########## ', ' ## ### ### ', ' #   #   #  '],
      ['    ####    ', '  ########  ', ' ########## ', ' ##oo##oo## ', ' ##oo##oo## ', ' ########## ', ' ####++#### ', ' ########## ', ' ########## ', ' ########## ', '### ### ##  ', ' #   #   #  '],
    ],
    ufo: [
      ['      ####      ', '     #oooo#     ', '    ########    ', '  ############  ', '################', '#+##+##+##+##+##', '  ############  ', '     +    +     '],
      ['      ####      ', '     #oooo#     ', '    ########    ', '  ############  ', '################', '##+##+##+##+##+#', '  ############  ', '    +      +    '],
    ],
    bat: [
      ['#             #', '##    # #    ##', '###   ###   ###', '#### #o#o# ####', ' #############', '  ###########  ', '   #  ###  #   ', '        #      '],
      ['               ', '      # #      ', '      ###      ', '  ## #o#o# ##  ', ' #############', '###  #####  ###', '#     ###     #', '       #       '],
    ],
  };

  // ---------------- Ground obstacle generators ----------------
  const CACTUS_S = ['   ##   ', '  ####  ', '  #### #', '# #### #', '# #### #', '# #### #', '# ######', '######  ', '  ####  ', '  ####  ', '  ####  ', '  ####  ', '  ####  ', '  ####  '];
  const CACTUS_L = ['     ##     ', '    ####    ', '    ####    ', '    ####  # ', ' #  ####  ##', '##  ####  ##', '##  ####  ##', '##  ####  ##', '##  ####  ##', '##  #######', '##  ######  ', '#######     ', ' ######     ', '    ####    ', '    ####    ', '    ####    ', '    ####    ', '    ####    ', '    ####    ', '    ####    ', '    ####    '];

  // The authentic offline-page cactus: fat trunk, two arms at different heights.
  const CHROME_S = ['   ###   ', '   ###   ', '   ###   ', '#  ###  #', '#  ###  #', '#  ###  #', '######  #', '   ######', '   ###   ', '   ###   ', '   ###   ', '   ###   ', '   ###   ', '   ###   '];
  const CHROME_L = ['    #####    ', '    #####    ', '    #####    ', '    #####    ', '#   #####   #', '#   #####   #', '#   #####   #', '#   #####   #', '#########   #', '    #########', '    #####    ', '    #####    ', '    #####    ', '    #####    ', '    #####    ', '    #####    ', '    #####    ', '    #####    ', '    #####    ', '    #####    '];

  function genGround(kind, size, P, seed) {
    const R = rng(seed);
    const big = size === 'L';
    switch (kind) {
      case 'cactus': return spr(big ? CACTUS_L : CACTUS_S, { '#': P.obstacle });
      case 'chrome': return spr(big ? CHROME_L : CHROME_S, { '#': P.obstacle });
      case 'barrier': {
        const w = big ? 14 : 10, h = big ? 20 : 13, c = mk(w, h), g = c.getContext('2d');
        g.fillStyle = P.obstacle; g.fillRect(1, 2, 2, h - 2); g.fillRect(w - 3, 2, 2, h - 2);
        for (let y = 3; y < h - 3; y += 5) {
          g.fillStyle = '#111'; g.fillRect(0, y, w, 3);
          g.fillStyle = P.accent; for (let x = 0; x < w; x += 4) g.fillRect(x + (y % 2), y, 2, 3);
        }
        g.fillStyle = P.accent2; g.fillRect(w / 2 - 1, 0, 2, 2);
        return c;
      }
      case 'ice': {
        const w = big ? 16 : 10, h = big ? 22 : 14, c = mk(w, h), g = c.getContext('2d');
        const spikes = big ? 3 : 2;
        for (let s = 0; s < spikes; s++) {
          const cx = Math.round((s + .5) * w / spikes), sh = Math.round(h * (s === 1 || spikes === 2 && s === 0 ? 1 : .7));
          for (let y = 0; y < sh; y++) {
            const half = Math.max(1, Math.round((y / sh) * (w / spikes / 2 + 1)));
            g.fillStyle = P.obstacle; g.fillRect(cx - half, h - sh + y, half * 2, 1);
            g.fillStyle = 'rgba(255,255,255,.7)'; g.fillRect(cx - half, h - sh + y, 1, 1);
          }
        }
        return c;
      }
      case 'rock': {
        const w = big ? 16 : 11, h = big ? 18 : 11, c = mk(w, h), g = c.getContext('2d');
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const dx = (x - w / 2) / (w / 2), dy = (y - h) / h;
          if (dx * dx + dy * dy * 1.1 < 1 + (R() - .5) * .15) { g.fillStyle = P.obstacle; g.fillRect(x, y, 1, 1); }
        }
        g.fillStyle = P.accent;
        let x = Math.floor(w / 2), y = Math.floor(h * .35);
        for (let i = 0; i < h; i++) { g.fillRect(x, y, 1, 1); y++; x += Math.round((R() - .5) * 2); if (y >= h) break; }
        g.fillStyle = P.accent2; g.fillRect(Math.floor(w * .3), h - 2, 2, 1);
        return c;
      }
      case 'kelp': {
        const w = 10, h = big ? 54 : 34, c = mk(w, h), g = c.getContext('2d');
        for (let s = 0; s < 2; s++) for (let y = 0; y < h - s * 8; y++) {
          const x = Math.round(3 + s * 3 + Math.sin(y * .25 + s) * 1.6);
          g.fillStyle = P.obstacle; g.fillRect(x, h - 1 - y, 2, 1);
          if (y % 6 === 3) { g.fillStyle = P.accent; g.fillRect(x + (s ? 2 : -2), h - 1 - y, 2, 1); }
        }
        return c;
      }
      case 'tomb': {
        const w = big ? 13 : 10, h = big ? 18 : 13, c = mk(w, h), g = c.getContext('2d');
        g.fillStyle = P.obstacle; g.fillRect(1, 3, w - 2, h - 3); g.fillRect(2, 1, w - 4, 2); g.fillRect(3, 0, w - 6, 1);
        g.fillStyle = 'rgba(0,0,0,.45)'; const cx = Math.floor(w / 2);
        g.fillRect(cx, 3, 1, 6); g.fillRect(cx - 2, 5, 5, 1);
        g.fillStyle = P.accent; g.fillRect(0, h - 2, w, 2);
        if (big) { g.fillStyle = '#ff8a00'; g.fillRect(w - 5, h - 6, 4, 4); g.fillStyle = '#ffe066'; g.fillRect(w - 4, h - 5, 1, 1); g.fillRect(w - 2, h - 5, 1, 1); }
        return c;
      }
      case 'crystal': {
        const w = big ? 14 : 9, h = big ? 22 : 13, c = mk(w, h), g = c.getContext('2d');
        const shards = big ? [[4, 1], [8, .75], [11, .5]] : [[3, 1], [6, .6]];
        shards.forEach(([cx, f]) => {
          const sh = Math.round(h * f);
          for (let y = 0; y < sh; y++) {
            const half = y < 3 ? Math.ceil(y / 1.5) : 2;
            g.fillStyle = P.obstacle; g.fillRect(cx - half, h - sh + y, half * 2, 1);
            g.fillStyle = P.accent; g.fillRect(cx - half, h - sh + y, 1, 1);
          }
        });
        return c;
      }
      case 'glitch': default: {
        const w = big ? 14 : 10, h = big ? 22 : 14, c = mk(w, h), g = c.getContext('2d');
        const cols = [P.obstacle, P.accent, P.accent2, '#ffffff'];
        for (let y = 0; y < h; y++) {
          const off = R() < .15 ? Math.round((R() - .5) * 4) : 0;
          for (let x = 1; x < w - 1; x++) if (R() > .08) { g.fillStyle = R() < .8 ? P.obstacle : cols[(R() * 4) | 0]; g.fillRect(x + off, y, 1, 1); }
        }
        return c;
      }
    }
  }

  // ---------------- Bosses (procedural, low-res) ----------------
  function genBoss(kind, P) {
    const W = 64, H = 64, c = mk(W, H), g = c.getContext('2d');
    const R = rng(kind.length * 991);
    const disc = (cx, cy, r, col, jag = 0) => {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
        if (x * x + y * y <= r * r * (1 + (R() - .5) * jag)) { g.fillStyle = col; g.fillRect(cx + x, cy + y, 1, 1); }
    };
    if (kind === 'meteor') {
      disc(34, 34, 24, '#3a2a28', .25); disc(32, 32, 20, '#5a3f36', .2);
      for (let i = 0; i < 9; i++) disc(18 + R() * 30 | 0, 18 + R() * 30 | 0, 2 + R() * 3 | 0, '#2a1d1c');
      g.fillStyle = '#ff6a00'; for (let i = 0; i < 40; i++) g.fillRect(12 + R() * 42 | 0, 12 + R() * 42 | 0, 1, 1);
      // angry face
      g.fillStyle = '#ffde59'; g.fillRect(20, 27, 7, 4); g.fillRect(37, 27, 7, 4);
      g.fillStyle = '#ff2200'; g.fillRect(23, 28, 2, 2); g.fillRect(40, 28, 2, 2);
      g.fillStyle = '#1a0f0e'; g.fillRect(18, 24, 10, 2); g.fillRect(36, 24, 10, 2);
      g.fillStyle = '#ffde59'; g.fillRect(24, 40, 16, 3); g.fillStyle = '#1a0f0e'; for (let x = 25; x < 40; x += 3) g.fillRect(x, 40, 1, 3);
    } else if (kind === 'phantom') {
      g.fillStyle = '#e8e4ff';
      for (let y = 6; y < 56; y++) {
        const half = y < 26 ? Math.round(Math.sqrt(Math.max(0, 400 - (y - 26) ** 2))) : 20 - Math.max(0, (y - 44));
        g.fillRect(32 - half, y, half * 2, 1);
      }
      for (let x = 12; x < 52; x += 8) { g.fillStyle = '#e8e4ff'; g.fillRect(x, 56, 4, 4 + (x % 16 === 12 ? 3 : 0)); }
      g.fillStyle = '#1a0830'; g.fillRect(20, 20, 9, 10); g.fillRect(36, 20, 9, 10);
      g.fillStyle = '#b44dff'; g.fillRect(23, 24, 3, 3); g.fillRect(39, 24, 3, 3);
      g.fillStyle = '#1a0830'; g.fillRect(24, 36, 17, 8); g.fillStyle = '#e8e4ff'; for (let x = 26; x < 40; x += 4) g.fillRect(x, 36, 2, 3);
      g.fillStyle = '#ffd400'; g.fillRect(16, 2, 32, 4); for (let x = 16; x < 48; x += 8) g.fillRect(x, -1, 4, 4); g.fillStyle = '#ff2a6d'; g.fillRect(30, 3, 4, 2);
    } else { // wyrm — magma dragon head
      g.fillStyle = '#4a0f0a';
      for (let y = 10; y < 54; y++) { const half = Math.round(22 - Math.abs(y - 32) * .45); g.fillRect(10, y, half * 2 + 8, 1); }
      g.fillStyle = '#7a1b10'; for (let y = 14; y < 50; y++) g.fillRect(14, y, 34 - Math.abs(y - 32) * .6, 1);
      g.fillStyle = '#2a0805'; g.fillRect(2, 36, 30, 10); // jaw
      g.fillStyle = '#ff9a1f'; for (let i = 0; i < 6; i++) { g.fillRect(4 + i * 5, 36, 2, 3); g.fillRect(6 + i * 5, 43, 2, 3); }
      g.fillStyle = '#ffea00'; g.fillRect(18, 22, 8, 5); g.fillStyle = '#000'; g.fillRect(21, 22, 2, 5);
      g.fillStyle = '#ff5a1f'; g.fillRect(30, 4, 4, 12); g.fillRect(40, 8, 4, 10); g.fillRect(48, 14, 4, 8);
      g.fillStyle = '#ff3d00'; for (let i = 0; i < 30; i++) g.fillRect(14 + R() * 36 | 0, 16 + R() * 32 | 0, 1, 1);
    }
    return c;
  }

  // ---------------- Small pickups ----------------
  function coinFrames() {
    const widths = [6, 4, 2, 4];
    return widths.map(w => {
      const c = mk(6, 6), g = c.getContext('2d'), x0 = (6 - w) / 2;
      g.fillStyle = '#b37a00'; g.fillRect(x0, 0, w, 6);
      g.fillStyle = '#ffc400'; g.fillRect(x0, 1, w, 4); if (w > 2) g.fillRect(x0 + 1, 0, w - 2, 6);
      g.fillStyle = '#fff6b0'; g.fillRect(x0 + (w > 2 ? 1 : 0), 1, 1, 2);
      return c;
    });
  }
  const HEART = spr([' ## ## ', '#######', '###o###', ' ##### ', '  ###  ', '   #   '], { '#': '#ff3b5c', 'o': '#ffd0d8' });

  // Build every sprite needed for a level palette (cached per level).
  const cache = {};
  DR.Sprites = {
    spr, rng, mk,
    // Level art is cached per world; the player sprite is swapped in per equipped species.
    forLevel(L, dinoId) {
      const d = dinoOf(dinoId, L.palette);
      return Object.assign({}, this.level(L), { dino: d.dino, dinoHurt: d.hurt });
    },
    dinoOf,
    level(L) {
      if (cache[L.id]) return cache[L.id];
      const P = L.palette;
      const s = {
        flyer: (FLY[L.flyer] || FLY.ptero).map(f => spr(f, { '#': P.flyer || P.obstacle, 'o': P.accent, '+': P.accent2 })),
        ground: { S: [0, 1, 2].map(i => genGround(L.ground, 'S', P, L.id * 100 + i)), L: [0, 1].map(i => genGround(L.ground, 'L', P, L.id * 200 + i)) },
        coin: coinFrames(),
        heart: HEART,
        boss: L.boss ? genBoss(L.boss.kind, P) : null,
      };
      return (cache[L.id] = s);
    },
    // Variant flyers used by mixed levels.
    flyerOf(kind, P) { return (FLY[kind] || FLY.ptero).map(f => spr(f, { '#': P.flyer || P.obstacle, 'o': P.accent, '+': P.accent2 })); },
    groundOf(kind, P, seed) { return { S: [0, 1].map(i => genGround(kind, 'S', P, seed + i)), L: [genGround(kind, 'L', P, seed + 7)] }; },
  };
})();
