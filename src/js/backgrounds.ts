// Procedural parallax worlds. Each theme builds tileable layers once, then draws them per frame.
(function () {
  const { mk, rng } = DR.Sprites;
  const TAU = Math.PI * 2;
  const hex = h => { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; };
  const lerp = (a, b, t) => a + (b - a) * t;
  const mix = (c1, c2, t) => { const a = hex(c1), b = hex(c2); return '#' + [0, 1, 2].map(i => Math.round(lerp(a[i], b[i], t)).toString(16).padStart(2, '0')).join(''); };
  DR.color = { hex, mix };

  // Posterized + dithered vertical gradient (pixel-art sky).
  function sky(g, w, h, top, midc, bot, bands = 14) {
    for (let y = 0; y < h; y++) {
      const t = y / h, q = Math.floor(t * bands) / bands, frac = t * bands % 1;
      const c = v => (v = Math.min(1, v)) < .5 ? mix(top, midc, v * 2) : mix(midc, bot, (v - .5) * 2);
      g.fillStyle = c(q); g.fillRect(0, y, w, 1);
      if (frac > .6) { g.fillStyle = c(Math.min(1, q + 1 / bands)); for (let x = (y & 1); x < w; x += 2) g.fillRect(x, y, 1, 1); }
    }
  }
  // Tileable silhouette ridge: integer-cycle sines over width.
  function ridge(g, w, h, base, amp, color, seed, { step = 1, flat = 0, harmonics = [1, 2, 3, 5, 8] } = {}) {
    const R = rng(seed), ph = harmonics.map(() => R() * TAU), am = harmonics.map((k, i) => 1 / (i + 1));
    const tot = am.reduce((a, b) => a + b, 0);
    g.fillStyle = color;
    for (let x = 0; x < w; x += step) {
      let v = 0; harmonics.forEach((k, i) => v += am[i] * Math.sin(TAU * k * x / w + ph[i]));
      v /= tot; if (flat) v = Math.round(v * flat) / flat;
      const y = Math.round(base - (v * .5 + .5) * amp);
      g.fillRect(x, y, step, h - y);
    }
  }
  function disc(g, cx, cy, r, color) { g.fillStyle = color; for (let y = -r; y <= r; y++) { const hw = Math.round(Math.sqrt(r * r - y * y)); g.fillRect(cx - hw, cy + y, hw * 2, 1); } }

  // 3x5 pixel font for shop signs: 15 bits per glyph, rows top to bottom. NARROW glyphs are 1px wide.
  const GLYPH = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111',
    F: '111100110100100', G: '011100101101011', H: '101101111101101', I: '111010010010111', J: '001001001101010',
    K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101', O: '010101101101010',
    P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010',
    U: '101101101101111', V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010',
    Z: '111001010100111', 0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110',
    4: '101101111001001', 5: '111100110001110', 6: '011100111101111', 7: '111001010010010', 8: '111101111101111',
    9: '111101111001110', '#': '101111101111101', '-': '000000111000000',
  };
  const NARROW = { "'": '11000', '.': '00001', '!': '11101' };
  const textW = (s, k = 1) => { let w = 0; for (const ch of s) w += (ch === ' ' ? 2 : NARROW[ch] ? 1 : 3) + 1; return (w - 1) * k; };
  // dot: draw each lit cell as a single pixel on a k-pitch grid (dot-matrix look).
  function pxText(g, s, x, y, col, k = 1, dot = false) {
    g.fillStyle = col; x = Math.round(x); y = Math.round(y);
    for (const ch of s) {
      if (ch === ' ') { x += 3 * k; continue; }
      const gw = NARROW[ch] ? 1 : 3, bits = NARROW[ch] || GLYPH[ch] || GLYPH['#'];
      for (let i = 0; i < bits.length; i++) if (bits[i] === '1') g.fillRect(x + (i % gw) * k, y + (i / gw | 0) * k, dot ? k - 1 : k, dot ? k - 1 : k);
      x += (gw + 1) * k;
    }
  }
  DR.pxText = { draw: pxText, w: textW };

  // ---------------- Theme painters ----------------
  // Each returns { layers:[{img,speed}], sky:canvas, ground:canvas, extra(ctx,t,scroll), front(ctx,t,scroll) }
  const THEMES = {
    desert(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d');
      sky(g, W, H, P.skyTop, P.skyMid, P.skyBot);
      // banded sun
      const sx = W * .68 | 0, sy = GY - 70;
      disc(g, sx, sy, 34, mix(P.sun, P.skyBot, .5)); disc(g, sx, sy, 28, P.sun);
      g.fillStyle = mix(P.skyBot, P.sun, .3); [6, 12, 17, 21].forEach((o, i) => g.fillRect(sx - 34, sy + o, 68, 2 + i));
      const far = mk(LW, H), fg = far.getContext('2d'); ridge(fg, LW, H, GY - 30, 60, P.far, 1, { flat: 4, step: 2 });
      const mid = mk(LW, H), mg = mid.getContext('2d'); ridge(mg, LW, H, GY - 4, 34, P.mid, 2, { step: 1 });
      const near = mk(LW, H), ng = near.getContext('2d'); const R = rng(3);
      for (let i = 0; i < 9; i++) { const x = R() * LW | 0, hh = 8 + R() * 14 | 0; ng.fillStyle = P.near; ng.fillRect(x, GY - hh, 3, hh); ng.fillRect(x - 3, GY - hh + 4, 2, 5); ng.fillRect(x + 4, GY - hh + 6, 2, 4); }
      return { sky: s, layers: [{ img: far, speed: .08 }, { img: mid, speed: .25 }, { img: near, speed: .55 }] };
    },
    city(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot);
      disc(g, W * .25 | 0, 60, 16, P.sun); disc(g, (W * .25 | 0) + 6, 56, 14, P.skyTop);
      const bld = (seed, base, minH, maxH, col, winCols, neon) => {
        const c = mk(LW, H), cg = c.getContext('2d'), R = rng(seed);
        for (let x = 0; x < LW;) {
          const bw = 14 + R() * 26 | 0, bh = minH + R() * (maxH - minH) | 0, top = base - bh;
          cg.fillStyle = col; cg.fillRect(x, top, bw, H - top);
          if (R() < .4) cg.fillRect(x + bw / 2 - 1, top - 8, 2, 8);
          for (let wy = top + 4; wy < base - 4; wy += 5) for (let wx = x + 3; wx < x + bw - 3; wx += 4)
            if (R() < .35) { cg.fillStyle = winCols[R() * winCols.length | 0]; cg.fillRect(wx, wy, 2, 2); }
          if (neon && R() < .45) { cg.fillStyle = [P.line, P.accent2, P.accent][R() * 3 | 0]; const ny = top + 6 + R() * 20 | 0; cg.fillRect(x + 2, ny, bw - 4, 1); cg.fillRect(x + 2, ny + 6, bw - 4, 1); cg.fillRect(x + 2, ny, 1, 7); cg.fillRect(x + bw - 3, ny, 1, 7); }
          x += bw + (R() * 4 | 0);
        }
        return c;
      };
      const far = bld(5, GY, 60, 150, P.far, ['#3a2a6a', '#5a3a8a', '#ffb3f0'], false);
      const mid = bld(6, GY, 40, 110, P.mid, ['#ffe600', '#00f0ff', '#ff2a8a', '#ffffff'], true);
      const near = mk(LW, H), ng = near.getContext('2d');
      for (let x = 20; x < LW; x += 80) { ng.fillStyle = P.near; ng.fillRect(x, GY - 34, 2, 34); ng.fillRect(x, GY - 34, 8, 2); ng.fillStyle = P.accent; ng.fillRect(x + 6, GY - 32, 3, 1); }
      return {
        sky: s, layers: [{ img: far, speed: .1 }, { img: mid, speed: .3 }, { img: near, speed: .8 }],
        front(ctx, t, scroll) { // lamp light cones
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,230,0,.035)';
          for (let x = 20; x < LW * 2; x += 80) { const sx = ((x - scroll * .8) % LW + LW) % LW; ctx.beginPath(); ctx.moveTo(sx + 7, GY - 31); ctx.lineTo(sx - 6, GY); ctx.lineTo(sx + 22, GY); ctx.fill(); }
          ctx.globalCompositeOperation = 'source-over';
        },
      };
    },
    tundra(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot);
      const R0 = rng(9); for (let i = 0; i < 70; i++) { g.fillStyle = R0() < .2 ? '#fff' : 'rgba(255,255,255,.5)'; g.fillRect(R0() * W | 0, R0() * GY * .6 | 0, 1, 1); }
      const far = mk(LW, H), fg = far.getContext('2d');
      ridge(fg, LW, H, GY - 20, 110, P.far, 11, { step: 2, harmonics: [2, 3, 7, 11] });
      // snow caps: lighten top band of the ridge
      const id = fg.getImageData(0, 0, LW, H);
      for (let x = 0; x < LW; x++) { let y = 0; while (y < H && id.data[(y * LW + x) * 4 + 3] === 0) y++; fg.fillStyle = '#ffffff'; fg.fillRect(x, y, 1, 5 + (x * 7 % 4)); }
      const mid = mk(LW, H), mg = mid.getContext('2d'); ridge(mg, LW, H, GY - 4, 26, P.mid, 12, { step: 2 });
      const near = mk(LW, H), ng = near.getContext('2d'), R = rng(13);
      for (let i = 0; i < 26; i++) { const x = R() * LW | 0, th = 14 + R() * 22 | 0; for (let y = 0; y < th; y++) { const hw = Math.round((y / th) * 6) + ((y % 5) === 0 ? 1 : 0); ng.fillStyle = P.near; ng.fillRect(x - hw, GY - th + y, hw * 2 + 1, 1); } ng.fillStyle = '#fff'; ng.fillRect(x - 1, GY - th + 2, 3, 1); }
      return {
        sky: s, layers: [{ img: far, speed: .06 }, { img: mid, speed: .2 }, { img: near, speed: .5 }],
        extra(ctx, t) { // animated aurora ribbons
          ctx.globalCompositeOperation = 'lighter';
          for (let b = 0; b < 3; b++) for (let x = 0; x < W; x += 2) {
            const y = H * .16 + b * 18 + Math.sin(x * .02 + t * .6 + b) * 14 + Math.sin(x * .05 - t * .9) * 6;
            const a = (.06 + .05 * Math.sin(x * .03 + t + b * 2)) * (b === 1 ? 1.4 : 1);
            ctx.fillStyle = b === 2 ? `rgba(180,90,255,${a})` : `rgba(93,255,176,${a})`; ctx.fillRect(x, y, 2, 30 + b * 6);
          }
          ctx.globalCompositeOperation = 'source-over';
        },
      };
    },
    volcano(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot);
      // the volcano
      const vx = W * .6 | 0, vy = GY - 150;
      for (let y = vy; y < GY; y++) { const hw = 14 + (y - vy) * .9; g.fillStyle = '#1e0806'; g.fillRect(vx - hw, y, hw * 2, 1); }
      g.fillStyle = '#ff6a00'; g.fillRect(vx - 12, vy, 24, 3); g.fillStyle = '#ffd000'; g.fillRect(vx - 6, vy, 12, 1);
      const R0 = rng(21); g.fillStyle = '#ff4a00';
      for (let l = 0; l < 3; l++) { let x = vx - 6 + l * 6; for (let y = vy + 3; y < vy + 60 + l * 20; y++) { g.fillRect(x, y, 2, 1); x += R0() < .5 ? -1 : 1; } }
      const far = mk(LW, H), fg = far.getContext('2d'); ridge(fg, LW, H, GY - 10, 50, P.far, 22, { step: 2, harmonics: [3, 5, 9, 13] });
      const mid = mk(LW, H), mg = mid.getContext('2d'), R = rng(23);
      for (let x = 0; x < LW; x += 3) { const hh = 6 + Math.abs(Math.sin(x * .07) * 22) + R() * 6; mg.fillStyle = P.mid; mg.fillRect(x, GY - hh, 3, hh); }
      return {
        sky: s, layers: [{ img: far, speed: .1 }, { img: mid, speed: .35 }],
        extra(ctx, t) { // smoke plume + glow pulse
          for (let i = 0; i < 14; i++) {
            const k = (t * .15 + i / 14) % 1, x = vx + Math.sin(i * 3 + t * .3) * 8 + k * 50, y = vy - k * 140;
            ctx.fillStyle = `rgba(40,20,20,${.5 * (1 - k)})`; const r = 6 + k * 26; ctx.fillRect(x - r, y - r * .6, r * 2, r * 1.2);
          }
          ctx.fillStyle = `rgba(255,80,0,${.08 + .05 * Math.sin(t * 2)})`; ctx.fillRect(0, GY - 60, W, 60);
        },
      };
    },
    ocean(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyMid, P.skyTop, P.skyBot, 18);
      const far = mk(LW, H), fg = far.getContext('2d'); ridge(fg, LW, H, GY - 20, 120, P.far, 31, { step: 2, harmonics: [2, 3, 4, 9] });
      // carve arches
      fg.globalCompositeOperation = 'destination-out'; for (let x = 60; x < LW; x += 220) disc(fg, x, GY - 30, 22, '#000'); fg.globalCompositeOperation = 'source-over';
      const mid = mk(LW, H), mg = mid.getContext('2d'), R = rng(32);
      for (let i = 0; i < 18; i++) { // coral fans
        const x = R() * LW | 0, hh = 12 + R() * 26 | 0, col = ['#ff6bd6', '#ff8a5c', '#b07dff', '#3fd6a8'][R() * 4 | 0];
        mg.fillStyle = mix(col, P.mid, .55);
        for (let b = -2; b <= 2; b++) { let bx = x; for (let y = 0; y < hh - Math.abs(b) * 4; y++) { mg.fillRect(bx, GY - y, 2, 1); if (y % 3 === 0) bx += b > 0 ? 1 : b < 0 ? -1 : 0; } }
      }
      return {
        sky: s, layers: [{ img: far, speed: .08 }, { img: mid, speed: .3 }],
        extra(ctx, t) { // god rays + surface shimmer
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < 6; i++) {
            const x = ((i * 70 + t * 8) % (W + 120)) - 60, a = .035 + .02 * Math.sin(t + i);
            ctx.fillStyle = `rgba(160,230,255,${a})`; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 24, 0); ctx.lineTo(x + 90, GY); ctx.lineTo(x + 40, GY); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
          ctx.fillStyle = 'rgba(160,230,255,.35)'; for (let x = 0; x < W; x += 2) ctx.fillRect(x, 10 + Math.sin(x * .08 + t * 2) * 2, 2, 1);
        },
      };
    },
    haunted(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot);
      const mx = W * .7 | 0, my = 80; disc(g, mx, my, 34, 'rgba(243,239,208,.12)'); disc(g, mx, my, 26, P.sun);
      g.fillStyle = '#d8d2b0'; [[-8, -6, 5], [7, 4, 4], [-3, 10, 3], [10, -10, 2]].forEach(([a, b, r]) => disc(g, mx + a, my + b, r, '#d8d2b0'));
      const far = mk(LW, H), fg = far.getContext('2d'); ridge(fg, LW, H, GY - 10, 40, P.far, 41, { step: 2, harmonics: [1, 2, 5] });
      // castle on the hill
      fg.fillStyle = P.far; const cx = LW * .3 | 0, cy = GY - 50;
      [[0, 40, 10], [12, 60, 8], [22, 35, 16], [40, 70, 9], [51, 45, 12]].forEach(([dx, hh, ww]) => { fg.fillRect(cx + dx, cy - hh, ww, hh); for (let k = 0; k < ww; k += 3) fg.fillRect(cx + dx + k, cy - hh - 2, 2, 2); });
      fg.fillStyle = '#ffcf4a'; [[14, -48], [44, -60], [26, -24], [53, -30]].forEach(([dx, dy]) => fg.fillRect(cx + dx, cy + dy, 2, 3));
      const mid = mk(LW, H), mg = mid.getContext('2d'), R = rng(42);
      const tree = (x, base, hh) => {
        mg.fillStyle = P.mid; mg.fillRect(x, base - hh, 3, hh);
        const branch = (bx, by, len, dir, d) => { if (d > 3 || len < 2) return; let px = bx, py = by; for (let i = 0; i < len; i++) { px += dir; py -= (i % 2); mg.fillRect(px, py, 1 + Number(d < 2), 1); } branch(px, py, len * .6 | 0, dir, d + 1); branch(px, py, len * .5 | 0, -dir, d + 2); };
        for (let b = 0; b < 4; b++) branch(x + 1, base - hh + 4 + b * 6, 8 + R() * 8 | 0, b % 2 ? 1 : -1, 0);
      };
      for (let i = 0; i < 9; i++) tree(R() * LW | 0, GY, 30 + R() * 40 | 0);
      const near = mk(LW, H), ng = near.getContext('2d');
      for (let x = 0; x < LW; x += 6) { ng.fillStyle = P.near; ng.fillRect(x, GY - 14, 2, 14); ng.fillRect(x, GY - 16, 1, 2); } ng.fillRect(0, GY - 11, LW, 1); ng.fillRect(0, GY - 5, LW, 1);
      return { sky: s, layers: [{ img: far, speed: .07 }, { img: mid, speed: .25 }, { img: near, speed: .7 }] };
    },
    space(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot, 10);
      const R0 = rng(51);
      for (let i = 0; i < 8; i++) { const x = R0() * W, y = R0() * H; for (let k = 0; k < 120; k++) { const a = R0() * TAU, r = R0() * 50; g.fillStyle = `rgba(${i % 2 ? '122,42,255' : '255,60,180'},.05)`; g.fillRect(x + Math.cos(a) * r | 0, y + Math.sin(a) * r * .6 | 0, 3, 3); } }
      for (let i = 0; i < 160; i++) { g.fillStyle = R0() < .1 ? '#fff' : R0() < .5 ? 'rgba(200,220,255,.7)' : 'rgba(200,200,255,.35)'; g.fillRect(R0() * W | 0, R0() * H | 0, 1, 1); }
      // ringed planet
      const px = W * .3 | 0, py = H * .3 | 0;
      disc(g, px, py, 30, '#c46a3a'); g.fillStyle = '#e09a5a'; for (let y = -26; y < 28; y += 7) { const hw = Math.sqrt(900 - y * y) | 0; g.fillRect(px - hw, py + y, hw * 2, 2); }
      g.strokeStyle = '#ffd27d'; g.lineWidth = 2; g.beginPath(); g.ellipse(px, py, 52, 10, -.25, 0, TAU); g.stroke();
      const far = mk(LW, H), fg = far.getContext('2d'), R = rng(52);
      for (let i = 0; i < 12; i++) { const x = R() * LW | 0, y = 30 + R() * (GY - 120) | 0, r = 2 + R() * 6 | 0; disc(fg, x, y, r, P.far); fg.fillStyle = '#4a4270'; fg.fillRect(x - r + 1, y - r + 2, 2, 2); }
      return { sky: s, layers: [{ img: far, speed: .15 }] };
    },
    glitch(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot, 16);
      const R0 = rng(61); for (let i = 0; i < 80; i++) { g.fillStyle = 'rgba(255,255,255,.6)'; g.fillRect(R0() * W | 0, R0() * GY * .5 | 0, 1, 1); }
      // synthwave sun with cut stripes
      const sx = W / 2 | 0, sy = GY - 30;
      for (let y = -44; y <= 44; y++) { const hw = Math.sqrt(44 * 44 - y * y) | 0, t = (y + 44) / 88; if (y > 0 && (y % 8) < (y / 10)) continue; g.fillStyle = mix('#ffe600', '#ff2a6d', t); g.fillRect(sx - hw, sy + y, hw * 2, 1); }
      const far = mk(LW, H), fg = far.getContext('2d'); ridge(fg, LW, H, GY, 50, P.far, 62, { step: 2, harmonics: [2, 4, 7] });
      fg.globalCompositeOperation = 'source-atop'; fg.fillStyle = 'rgba(255,42,109,.6)'; for (let y = GY - 60; y < GY; y += 6) fg.fillRect(0, y, LW, 1); fg.globalCompositeOperation = 'source-over';
      return {
        sky: s, layers: [{ img: far, speed: .1 }],
        groundFx(ctx, t, scroll) { // perspective grid floor
          ctx.strokeStyle = 'rgba(255,42,109,.55)'; ctx.lineWidth = 1; ctx.beginPath();
          for (let i = 0; i < 9; i++) { const k = ((i / 8) + (scroll * .004 % (1 / 8))) ; const y = GY + Math.pow(k, 2) * (H - GY); ctx.moveTo(0, y | 0); ctx.lineTo(W, y | 0); }
          for (let i = -10; i <= 10; i++) { ctx.moveTo(W / 2 + i * 6, GY); ctx.lineTo(W / 2 + i * 60, H); }
          ctx.stroke();
        },
      };
    },
    // Server hall: racks, status LEDs, a vault door and a scanning light bar.
    vault(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot, 12);
      g.fillStyle = 'rgba(37,232,255,.10)'; for (let x = 24; x < W; x += 74) g.fillRect(x, 10, 30, 2);
      // ceiling truss + conduit run so the hall has a top
      g.fillStyle = '#0a1626'; g.fillRect(0, 0, W, 14);
      g.fillStyle = P.far; for (let x = 0; x < W; x += 46) g.fillRect(x, 0, 3, 12);
      g.fillStyle = 'rgba(37,232,255,.16)'; g.fillRect(0, 12, W, 1);
      g.fillStyle = P.far; g.fillRect(0, H * .26 | 0, W, 5);
      for (let x = 12; x < W; x += 58) { g.fillStyle = P.far; g.fillRect(x, (H * .26 | 0) + 5, 3, 10); g.fillStyle = 'rgba(255,45,111,.35)'; g.fillRect(x + 1, (H * .26 | 0) + 7, 1, 1); }
      const dx = W * .62 | 0, dy = GY - 96;
      g.fillStyle = 'rgba(8,20,36,.88)'; g.fillRect(dx, dy, 76, 96);
      g.strokeStyle = 'rgba(37,232,255,.3)'; g.lineWidth = 2; g.strokeRect(dx, dy, 76, 96);
      g.fillStyle = 'rgba(37,232,255,.45)'; g.fillRect(dx + 36, dy + 8, 4, 80); g.fillRect(dx + 8, dy + 46, 60, 4);
      g.fillStyle = 'rgba(255,45,111,.6)'; g.fillRect(dx + 34, dy + 44, 8, 8);
      const far = mk(LW, H), fg = far.getContext('2d'), R1 = rng(81);
      for (let x = 0; x < LW;) {
        const w = 16 + R1() * 26 | 0, h = 96 + R1() * 120 | 0;
        fg.fillStyle = P.far; fg.fillRect(x, GY - h, w, h);
        fg.fillStyle = 'rgba(37,232,255,.18)'; for (let y = GY - h + 5; y < GY - 6; y += 7) fg.fillRect(x + 2, y, w - 4, 1);
        x += w + 5 + (R1() * 9 | 0);
      }
      const mid = mk(LW, H), mg = mid.getContext('2d'), R2 = rng(82);
      for (let x = 0; x < LW;) {
        const w = 22 + R2() * 30 | 0, h = 138 + R2() * 110 | 0, top = GY - h;
        mg.fillStyle = P.mid; mg.fillRect(x, top, w, h);
        mg.fillStyle = 'rgba(0,0,0,.45)'; for (let y = top + 4; y < GY - 4; y += 5) mg.fillRect(x + 2, y, w - 4, 2);
        mg.fillStyle = R2() < .5 ? P.line : 'rgba(255,45,111,.75)';
        for (let y = top + 6; y < GY - 8; y += 9) if (R2() < .5) mg.fillRect(x + 3, y, 2, 2);
        mg.fillStyle = 'rgba(37,232,255,.35)'; mg.fillRect(x + w - 3, top + 3, 1, h - 6);
        x += w + 4 + (R2() * 8 | 0);
      }
      const near = mk(LW, H), ng = near.getContext('2d');
      const cy = GY - 250;
      ng.fillStyle = '#08121f'; ng.fillRect(0, cy, LW, 8);
      ng.fillStyle = 'rgba(37,232,255,.22)'; ng.fillRect(0, cy + 8, LW, 1);
      for (let x = 0; x < LW; x += 120) { ng.fillStyle = '#08121f'; ng.fillRect(x + 20, cy, 4, 250); }
      for (let x = 0; x < LW; x += 46) { ng.fillStyle = P.near; ng.fillRect(x, GY - 26, 3, 26); ng.fillRect(x, GY - 26, 16, 2); }
      ng.fillStyle = 'rgba(37,232,255,.25)'; for (let x = 6; x < LW; x += 46) ng.fillRect(x, GY - 24, 2, 1);
      return {
        sky: s, layers: [{ img: far, speed: .07 }, { img: mid, speed: .2 }, { img: near, speed: .55 }],
        extra(ctx, t, scroll) {
          const y = ((t * 26) % Math.max(40, GY - 30)) + 16;
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = 'rgba(37,232,255,.05)'; ctx.fillRect(0, y, W, 10);
          ctx.fillStyle = 'rgba(37,232,255,.35)'; ctx.fillRect(0, y + 4, W, 1);
          ctx.fillStyle = `rgba(255,45,111,${.10 + .06 * Math.sin(t * 3)})`; ctx.fillRect(dx, dy, 76, 96);
          ctx.globalCompositeOperation = 'source-over';
        },
      };
    },
    // Storm-lit beach: amber horizon, rolling sea, dark headlands, foam at the shoreline.
    shore(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot, 16);
      disc(g, W * .72 | 0, GY - 78, 20, P.sun);
      g.fillStyle = mix(P.skyBot, P.mid, .55); g.fillRect(0, GY - 44, W, 26);
      g.fillStyle = P.mid; g.fillRect(0, GY - 18, W, 18);
      const R0 = rng(91);
      for (let i = 0; i < 90; i++) { const x = R0() * W | 0, y = GY - 42 + R0() * 30 | 0; g.fillStyle = `rgba(255,255,255,${.04 + R0() * .1})`; g.fillRect(x, y, 2 + R0() * 7 | 0, 1); }
      const far = mk(LW, H), fg = far.getContext('2d');
      ridge(fg, LW, H, GY - 40, 30, P.far, 93, { step: 3, flat: 3, harmonics: [1, 3, 5] });
      const mid = mk(LW, H), mg = mid.getContext('2d'), R = rng(94);
      for (let i = 0; i < 14; i++) { const x = R() * LW | 0, w = 8 + R() * 16 | 0, h = 6 + R() * 12 | 0; mg.fillStyle = P.mid; mg.fillRect(x, GY - h, w, h); mg.fillStyle = 'rgba(255,255,255,.1)'; mg.fillRect(x, GY - h, w, 1); }
      const near = mk(LW, H), ng = near.getContext('2d'), R2 = rng(95);
      for (let i = 0; i < 26; i++) { const x = R2() * LW | 0, hh = 8 + R2() * 12 | 0; ng.fillStyle = P.near; for (let y = 0; y < hh; y++) { const w = Math.max(1, Math.round((hh - y) / 4)); ng.fillRect(x, GY - y, w, 1); } }
      return {
        sky: s, layers: [{ img: far, speed: .04 }, { img: mid, speed: .12 }, { img: near, speed: .4 }],
        extra(ctx, t, scroll) {
          ctx.globalCompositeOperation = 'lighter';
          const lap = .5 + .5 * Math.sin(t * 1.1);
          ctx.fillStyle = `rgba(190,240,255,${.10 + .10 * lap})`;
          for (let x = 0; x < W; x += 3) {
            const y = GY - 3 - Math.sin(x * .13 + t * 2) * 2 - lap * 3;
            ctx.fillRect(x, y, 3, 1);
          }
          ctx.globalCompositeOperation = 'source-over';
        },
      };
    },
    // Indiranagar, Bengaluru on a clear day: skyline and raintrees, the Purple Line viaduct with a passing train,
    // a wide strip of real 100 Feet Road / 12th Main shopfronts, then lamp posts, cable tangles and raintrees.
    indiranagar(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d'); sky(g, W, H, P.skyTop, P.skyMid, P.skyBot, 16);
      const sunX = W * .7 | 0, sunY = GY - 150;
      disc(g, sunX, sunY, 20, mix(P.sun, P.skyBot, .5)); disc(g, sunX, sunY, 15, P.sun);
      const R0 = rng(121);
      for (let i = 0; i < 8; i++) { // fair-weather clouds
        const cx = R0() * W | 0, cy = GY - 260 + R0() * 130 | 0, cw = 34 + R0() * 56 | 0;
        g.fillStyle = '#ffffff'; g.fillRect(cx + 8, cy - 4, cw - 18, 4); g.fillRect(cx, cy, cw, 4);
        g.fillStyle = mix(P.skyMid, '#ffffff', .55); g.fillRect(cx + 3, cy + 4, cw - 8, 1);
      }

      // Far: apartment blocks with water tanks, two cell towers, a raintree canopy band.
      const far = mk(LW, H), fg = far.getContext('2d'), R1 = rng(122), lit = mix(P.far, P.sun, .55);
      for (let x = 0; x < LW;) {
        const bw = 18 + R1() * 30 | 0, bh = 60 + R1() * 80 | 0, top = GY - bh;
        fg.fillStyle = P.far; fg.fillRect(x, top, bw, bh);
        if (R1() < .45) fg.fillRect(x + 3 + (R1() * (bw - 10) | 0), top - 5, 6, 5);
        fg.fillStyle = lit;
        for (let wy = top + 5; wy < GY - 12; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (R1() < .16) fg.fillRect(wx, wy, 2, 2);
        x += bw + 2 + (R1() * 10 | 0);
      }
      for (const tx of [130, 410]) {
        fg.fillStyle = P.far; fg.fillRect(tx, GY - 196, 2, 140); fg.fillRect(tx - 3, GY - 190, 8, 2); fg.fillRect(tx - 2, GY - 180, 6, 2);
        fg.fillStyle = '#ff5a4a'; fg.fillRect(tx, GY - 198, 2, 2);
      }
      ridge(fg, LW, H, GY - 18, 22, mix(P.far, '#1c2a22', .5), 123, { step: 2, harmonics: [3, 5, 8, 13] });

      // Metro: drawn live so the train can run along the deck. The station comes round once per SPAN.
      const DECK = GY - 108, PIER = 92, SPAN = PIER * 11, MS = .14, CARS = 6, CAR = 30, EVERY = 15;
      const conc = mix(P.far, '#c9c0d0', .45), concD = mix(P.far, '#000000', .1);
      const metro = {
        draw(ctx, t, scroll) {
          const R = (c, x, y, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), w, h); };
          const off = scroll * MS;
          for (let x = -(off % PIER); x < W + PIER; x += PIER) { R(concD, x, DECK + 6, 6, GY - DECK - 6); R(concD, x - 5, DECK + 6, 16, 3); }
          let sx = Math.round(((300 - off) % SPAN + SPAN) % SPAN); if (sx > W) sx -= SPAN;
          const station = sx > -170;
          if (station) R(mix(conc, P.skyBot, .25), sx, DECK - 22, 150, 22);
          R(conc, 0, DECK, W, 6); R(mix(conc, '#ffffff', .3), 0, DECK, W, 1); R(concD, 0, DECK + 5, W, 1);
          const tx = -CARS * (CAR + 2) + (t % EVERY) * 130;
          if (tx < W) for (let i = 0; i < CARS; i++) {
            const cx = tx + i * (CAR + 2), y = DECK - 14;
            if (cx > W || cx + CAR < 0) continue;
            R('#c9c3d6', cx, y + 10, CAR, 3); R('#7a3cc4', cx, y, CAR, 11); R('#5b2a99', cx, y, CAR, 2);
            R('#2a1b3d', cx + 2, y + 4, CAR - 4, 4);
            for (let w = 3; w < CAR - 4; w += 5) R('#ffeec2', cx + w, y + 5, 3, 2);
            if (i === CARS - 1) { R('#7a3cc4', cx + CAR, y + 2, 2, 9); R('#ffe9a0', cx + CAR, y + 7, 2, 2); }
          }
          R(conc, 0, DECK - 2, W, 2);
          if (station) {
            R(mix(P.mid, '#3a2a55', .4), sx - 4, DECK - 28, 158, 6); R(mix(conc, '#ffffff', .2), sx - 4, DECK - 28, 158, 1);
            for (let x = sx; x <= sx + 150; x += 25) R(conc, x, DECK - 22, 2, 20);
            R('#7a3cc4', sx + 30, DECK - 21, 90, 9);
            pxText(ctx, 'INDIRANAGAR', sx + 30 + (90 - textW('INDIRANAGAR')) / 2, DECK - 19, '#ffffff');
            R(concD, sx + 150, DECK + 6, 14, GY - DECK - 6); // stair tower down to CMH Road
            for (let y = DECK + 12; y < GY - 30; y += 8) R(conc, sx + 152, y, 10, 1);
          }
        },
      };

      // Shopfront strip: each entry is a real place, painted in street order. Wider than LW so it repeats less.
      const FP = GY - 16, shops = [], add = (w, paint, roof = null) => shops.push({ w, paint, roof });
      let sg, lastTop = 0;
      const F = (c, x, y, w, h) => { sg.fillStyle = c; sg.fillRect(x, y, w, h); };
      const block = (x, w, h, fac) => {
        const top = lastTop = FP - h;
        F(fac, x, top, w, h); F(mix(fac, '#000000', .25), x, top, w, 2); F(mix(fac, '#000000', .15), x + w - 2, top, 2, h);
        return top;
      };
      const sign = (x, y, w, bg, fg, text, k = 1) => { F(bg, x, y, w, 5 * k + 4); pxText(sg, text, x + (w - textW(text, k)) / 2, y + 2, fg, k); };
      const awning = (x, y, w, c1, c2) => { for (let i = 0; i < w; i += 2) F(i % 4 ? c2 : c1, x + i, y, 2, 4); for (let i = 0; i < w - 1; i += 4) F(c1, x + i + 1, y + 4, 2, 1); };
      const glass = (x, y, w, h, c) => { F('#2a2430', x - 1, y - 1, w + 2, h + 2); F(c, x, y, w, h); F('rgba(255,255,255,.3)', x + 1, y + 1, 1, h - 2); };
      const front = (x, w, c) => { glass(x + 3, FP - 15, w - 16, 11, c); F('#2a2026', x + w - 11, FP - 15, 7, 15); F(mix(c, '#000000', .3), x + w - 10, FP - 14, 5, 13); };
      const windows = (x, w, y0, y1, c) => {
        for (let y = y0; y < y1 - 6; y += 9) {
          F('rgba(0,0,0,.25)', x + 1, y - 2, w - 3, 1); // chajja ledge
          for (let wx = x + 3; wx < x + w - 7; wx += 7) { F('#2a2430', wx, y, 5, 6); F(c, wx + 1, y + 1, 3, 4); }
        }
      };
      const RF = rng(124), SHIRTS = ['#e8e4d8', '#3f6fd1', '#d1453f', '#f0c040', '#3fa36a', '#a04fc0', '#202020'];
      const folk = x => {
        F('#2a2026', x, FP - 2, 2, 2); F(SHIRTS[RF() * SHIRTS.length | 0], x, FP - 5, 2, 3);
        F(RF() < .5 ? '#b07a52' : '#8a5a3c', x, FP - 7, 2, 2); F('#1a1418', x, FP - 7, 2, 1);
      };
      const plant = x => { F('#7a4a2a', x, FP - 4, 5, 4); F('#3f7a3a', x - 1, FP - 10, 7, 6); F('#5aa04a', x, FP - 9, 2, 2); };
      const neon = (x, y, text, c) => {
        F(c.replace('rgb', 'rgba').replace(')', ',.18)'), x - 2, y - 2, textW(text) + 4, 9);
        pxText(sg, text, x, y, c);
      };
      const billboard = (text, bg, fg) => (x, w, top) => {
        const bw = textW(text) + 6, bx = x + (w - bw) / 2 | 0;
        F('#2a2430', bx + 3, top - 8, 1, 8); F('#2a2430', bx + bw - 4, top - 8, 1, 8);
        F('#2a2430', bx - 1, top - 19, bw + 2, 11); sign(bx, top - 18, bw, bg, fg, text);
      };
      const tank = (x, w, top) => { const tx = x + 3 + (RF() * (w - 12) | 0); F('#1d1c22', tx, top - 6, 7, 6); F('#34333c', tx + 1, top - 6, 2, 6); };

      // ---- 100 Feet Road ----
      add(88, x => { // Nothing flagship: white minimal box, dot-matrix name, phones on plinths
        const top = block(x, 88, 50, '#f1f1ef');
        pxText(sg, 'NOTHING', x + 3, top + 6, '#111111', 3, true); F('#e3322b', x + 84, top + 18, 2, 2);
        glass(x + 3, FP - 22, 82, 20, '#e9eef2');
        for (let i = 0; i < 4; i++) { const px = x + 11 + i * 19; F('#cfd4d8', px - 2, FP - 6, 9, 4); F('#ffffff', px, FP - 12, 4, 6); F('#111111', px + 1, FP - 11, 1, 1); }
      }, tank);
      add(56, x => { // Starbucks
        const top = block(x, 56, 44, '#e9e2d2');
        windows(x, 56, top + 5, FP - 36, '#ffd99a');
        disc(sg, x + 9, FP - 28, 6, '#1e6b47'); disc(sg, x + 9, FP - 28, 4, '#ffffff'); disc(sg, x + 9, FP - 28, 3, '#1e6b47');
        pxText(sg, 'STARBUCKS', x + 17, FP - 30, '#1e6b47');
        front(x, 56, '#ffcf8a');
      });
      add(46, x => { // Truffles: burgers and a queue
        const top = block(x, 46, 44, '#f2e8d8');
        windows(x, 46, top + 5, FP - 40, '#ffd99a');
        F('#e0a040', x + 37, FP - 39, 6, 2); F('#5a2e1a', x + 37, FP - 37, 6, 1); F('#4caf50', x + 37, FP - 36, 6, 1); F('#e0a040', x + 37, FP - 35, 6, 2);
        sign(x + 3, FP - 31, 40, '#c8232c', '#ffe2a0', 'TRUFFLES');
        front(x, 46, '#ffd28a'); folk(x + 4); folk(x + 8); folk(x + 13);
      }, billboard("WE'RE HIRING", '#ffffff', '#1a1a1a'));
      add(62, x => { // Nature's Basket: green awning, fruit crates out front
        const top = block(x, 62, 40, '#f4f1e6');
        windows(x, 62, top + 5, FP - 32, '#fff1c4');
        sign(x + 2, FP - 31, 58, '#2f7d3b', '#ffffff', "NATURE'S BASKET");
        awning(x + 2, FP - 22, 58, '#2f7d3b', '#e9f2d8');
        front(x, 62, '#f6f4dc');
        const fruit = ['#d1453f', '#f28a2a', '#7cc04a', '#f0d040'];
        for (let i = 0; i < 4; i++) { const cx = x + 4 + i * 10; F('#8a5a32', cx, FP - 5, 8, 5); F('#6a4224', cx, FP - 3, 8, 1); for (let j = 0; j < 4; j++) F(fruit[i], cx + j * 2, FP - 6 - (j % 2), 2, 2); }
      });
      add(66, x => { // Toit: brick brewpub, copper tanks behind the big window, queue on the footpath
        const top = block(x, 66, 56, '#8e3b2b');
        for (let y = top + 3; y < FP; y += 3) { F('#74301f', x, y, 64, 1); for (let bx = x + ((y / 3 | 0) % 2) * 3; bx < x + 64; bx += 6) F('#74301f', bx, y + 1, 1, 2); }
        sign(x + 12, top + 6, 42, '#1b1716', '#f2c14e', 'TOIT', 2);
        glass(x + 6, FP - 23, 32, 21, '#ffb45a');
        for (let i = 0; i < 3; i++) { const tx = x + 9 + i * 10; F('#b8692f', tx, FP - 19, 7, 17); F('#f0b070', tx + 1, FP - 18, 1, 15); F('#8a4a22', tx, FP - 19, 7, 1); F('#8a4a22', tx + 2, FP - 21, 3, 2); }
        F('#2a1a14', x + 46, FP - 17, 11, 17); F('#ffe6a0', x + 50, FP - 20, 3, 2);
        folk(x + 8); folk(x + 12); folk(x + 17); folk(x + 21); folk(x + 26);
      }, tank);
      add(46, x => { // Glen's Bakehouse: cupcake on the sign
        const top = block(x, 46, 40, '#efe0c4');
        windows(x, 46, top + 5, FP - 40, '#ffd99a');
        sign(x + 3, FP - 31, 40, '#7a1f2b', '#fff3e0', "GLEN'S");
        F('#8a4b2a', x + 37, FP - 36, 5, 3); F('#f29bb8', x + 36, FP - 39, 7, 3); F('#d0213b', x + 39, FP - 41, 1, 2);
        awning(x + 2, FP - 22, 42, '#7a1f2b', '#efe0c4');
        glass(x + 4, FP - 15, 24, 11, '#ffe6c4'); for (let i = 0; i < 5; i++) F(['#f29bb8', '#8a4b2a', '#fff3e0'][i % 3], x + 6 + i * 4, FP - 8, 3, 3);
        F('#5a2a1e', x + 32, FP - 15, 9, 15);
      });
      // ---- 12th Main ----
      add(52, x => { // Third Wave: glass front full of laptops
        const top = block(x, 52, 48, '#e8e1d3');
        windows(x, 52, top + 5, FP - 32, '#ffd99a');
        sign(x + 3, FP - 31, 46, '#3b2a20', '#f3e6cf', 'THIRD WAVE');
        glass(x + 3, FP - 19, 46, 17, '#f4c98a');
        for (let i = 0; i < 4; i++) { const px = x + 6 + i * 11; F('#2a2026', px, FP - 13, 2, 2); F('#2a2026', px - 1, FP - 11, 4, 4); F('#bfe4ff', px + 3, FP - 11, 2, 3); F('#6b4a2f', px - 2, FP - 7, 9, 1); }
      }, billboard('SERIES A', '#ffd23a', '#1a1a1a'));
      add(52, x => { // Blue Tokai upstairs, Bhane on the ground floor
        const top = block(x, 52, 60, '#e6e2dc');
        sign(x + 3, top + 5, 46, '#1f4fa0', '#ffffff', 'BLUE TOKAI');
        glass(x + 4, top + 17, 44, 12, '#ffd99a');
        for (let i = 0; i < 5; i++) { F('#2a2026', x + 7 + i * 8, top + 23, 2, 2); F('#2a2026', x + 6 + i * 8, top + 25, 4, 4); }
        F('#2a2430', x + 2, top + 30, 48, 1); for (let i = 0; i < 48; i += 4) F('#2a2430', x + 2 + i, top + 30, 1, 4);
        sign(x + 10, FP - 28, 32, '#111111', '#ffffff', 'BHANE');
        glass(x + 4, FP - 16, 44, 14, '#dfe3e6');
        for (let i = 0; i < 3; i++) { const mx = x + 10 + i * 13; F('#cfc6bd', mx, FP - 14, 2, 2); F('#3a3a40', mx - 1, FP - 12, 4, 6); F('#cfc6bd', mx, FP - 6, 1, 4); }
      });
      add(44, x => { // Subko: terracotta, arched door, warm inside
        block(x, 44, 38, '#b85a35');
        sign(x + 6, FP - 32, 32, '#3a1f14', '#f3dcc0', 'SUBKO');
        F('#2a1610', x + 16, FP - 18, 12, 18); F('#2a1610', x + 17, FP - 19, 10, 1); F('#ffb45a', x + 18, FP - 16, 8, 16);
        plant(x + 5); plant(x + 34);
      });
      add(50, x => { // Cafe Noir on the first floor, a medicals below
        const top = block(x, 50, 56, '#d8d0c4');
        sign(x + 3, top + 5, 44, '#111111', '#ffffff', 'CAFE NOIR');
        awning(x + 3, top + 15, 44, '#1d3f8a', '#f2f2f2');
        glass(x + 4, top + 21, 42, 10, '#ffd99a');
        sign(x + 6, FP - 28, 38, '#1e8a4a', '#ffffff', 'MEDICALS');
        front(x, 50, '#e8fff0');
      }, tank);
      add(54, x => { // The Pizza Bakery: oven glow
        const top = block(x, 54, 40, '#a8442f');
        windows(x, 54, top + 5, FP - 32, '#ffd99a');
        sign(x + 3, FP - 31, 48, '#f3e3c8', '#a8442f', 'PIZZA BAKERY');
        glass(x + 6, FP - 18, 22, 14, '#ff9a3a'); F('#ffd27a', x + 12, FP - 9, 10, 4); F('#fff1b0', x + 15, FP - 8, 4, 2);
        F('#3a1a12', x + 36, FP - 16, 9, 16);
      });
      add(42, x => { // Alpaca Chocolate Drink House
        block(x, 42, 36, '#5a3424');
        sign(x + 4, FP - 30, 34, '#f3e3c8', '#5a3424', 'ALPACA');
        front(x, 42, '#ffcf9a');
      }, billboard('#PEAKBENGALURU', '#1a1a1a', '#ffd23a'));
      add(36, x => { // Kura
        block(x, 36, 34, '#f2efe8');
        sign(x + 5, FP - 29, 26, '#2a2a2a', '#ffffff', 'KURA');
        front(x, 36, '#ffe2b0'); plant(x + 3);
      });
      add(44, x => { // Araku: wood slats and plants
        const top = block(x, 44, 40, '#6b4a2f');
        for (let vx = x + 3; vx < x + 41; vx += 3) F('#5a3d26', vx, top + 2, 1, FP - top - 2);
        sign(x + 5, FP - 31, 34, '#2e5a3a', '#f3e6cf', 'ARAKU');
        front(x, 44, '#ffd99a'); plant(x + 4);
      }, tank);
      add(46, x => { // Lavonne: pastel, pastry case
        const top = block(x, 46, 40, '#f3c6cf');
        windows(x, 46, top + 5, FP - 32, '#fff0d0');
        sign(x + 3, FP - 31, 40, '#7a2e48', '#fff0f4', 'LAVONNE');
        awning(x + 2, FP - 22, 42, '#7a2e48', '#fff0f4');
        front(x, 46, '#fff4e8'); for (let i = 0; i < 6; i++) F(['#f29bb8', '#e0a040', '#7a2e48'][i % 3], x + 5 + i * 4, FP - 8, 3, 2);
      });
      add(58, x => { // Rameshwaram Cafe: steel counter, crowd, steam
        const top = block(x, 58, 46, '#f6efe0');
        windows(x, 58, top + 5, FP - 34, '#ffe6a0');
        sign(x + 3, FP - 35, 52, '#ffd23a', '#9e1b1b', 'RAMESHWARAM');
        sign(x + 19, FP - 26, 20, '#9e1b1b', '#ffd23a', 'CAFE');
        F('#ffe0a0', x + 4, FP - 17, 50, 5); F('#b8c0c8', x + 4, FP - 12, 50, 4); F('#e2e8ee', x + 4, FP - 12, 50, 1);
        for (let i = 0; i < 6; i++) F('rgba(255,255,255,.55)', x + 8 + i * 8 + (i % 2), FP - 20 - (i % 3), 1, 2);
        for (let i = 0; i < 9; i++) folk(x + 4 + i * 6);
      });
      add(50, x => { // Namdhari's Fresh: veg stall
        const top = block(x, 50, 38, '#fff4e0');
        windows(x, 50, top + 5, FP - 32, '#ffe6a0');
        sign(x + 4, FP - 31, 42, '#e86b1f', '#ffffff', "NAMDHARI'S");
        front(x, 50, '#f6f4dc');
        for (let i = 0; i < 3; i++) { const cx = x + 4 + i * 10; F('#8a5a32', cx, FP - 5, 8, 5); for (let j = 0; j < 4; j++) F(['#3fa34a', '#7cc04a', '#d1453f'][i], cx + j * 2, FP - 6 - (j % 2), 2, 2); }
      });
      add(46, x => { // Quick-commerce dark store: shutter half up, delivery boxes stacked out front
        block(x, 46, 34, '#7c7684');
        sign(x + 2, FP - 30, 42, '#2a2430', '#ffe14a', 'DARK STORE');
        F('#a9a3b0', x + 4, FP - 20, 38, 12); for (let y = FP - 20; y < FP - 8; y += 2) F('#8a8494', x + 4, y, 38, 1);
        F('#1a1620', x + 4, FP - 8, 38, 8);
        const box = ['#6a2bd0', '#f4d21f', '#f26b1d'];
        for (let i = 0; i < 5; i++) F(box[i % 3], x + 6 + (i % 3) * 8 + (i > 2 ? 4 : 0), FP - 6 - (i > 2 ? 6 : 0), 7, 6);
      }, billboard('10 MIN DELIVERY', '#6a2bd0', '#ffffff'));
      add(40, x => { // Jimi's Beer Cafe: neon
        const top = block(x, 40, 38, '#2a2230');
        windows(x, 40, top + 5, FP - 30, '#ff6a5a');
        neon(x + (40 - textW("JIMI'S")) / 2 | 0, FP - 27, "JIMI'S", 'rgb(125,249,255)');
        F('#140f18', x + 15, FP - 16, 10, 16); F('rgb(125,249,255)', x + 15, FP - 17, 10, 1);
      });
      add(58, x => { // 403 Forbidden: red neon, a bouncer at the door
        const top = block(x, 58, 42, '#1d1a22');
        windows(x, 58, top + 5, FP - 32, '#ff4a6a');
        neon(x + (58 - textW('403 FORBIDDEN')) / 2 | 0, FP - 28, '403 FORBIDDEN', 'rgb(255,59,74)');
        F('#100c14', x + 22, FP - 16, 12, 16); F('rgb(255,59,74)', x + 22, FP - 17, 12, 1);
        F('#111111', x + 36, FP - 6, 3, 6); F('#8a5a3c', x + 36, FP - 8, 3, 2);
      }, tank);

      const GAP = 3, SW = shops.reduce((a, b) => a + b.w + GAP, 0);
      const strip = mk(SW, H); sg = strip.getContext('2d');
      let sx0 = 0; const at = [];
      for (const sh of shops) {
        at.push(sx0);
        sh.paint(sx0);
        if (sh.roof) sh.roof(sx0, sh.w, lastTop);
        sx0 += sh.w + GAP;
      }
      // Footpath slabs along the whole strip, plus street-name boards where the road changes.
      F('#8c8494', 0, FP, SW, 4); F('#a8a0b0', 0, FP, SW, 1); for (let x = 0; x < SW; x += 9) F('#6e6878', x, FP + 1, 1, 3);
      for (let x = 0; x < SW; x += 12) { F('#16141a', x, FP + 4, 6, 2); F('#e8c23a', x + 6, FP + 4, 6, 2); } // painted kerb
      F(P.ground, 0, FP + 6, SW, GY - FP - 6); F('rgba(0,0,0,.18)', 0, FP + 6, SW, 2); // far lane of the road
      const street = (x, text) => { const bw = textW(text) + 4; F('#3a3540', x, FP - 34, 1, 34); sign(x - bw / 2 | 0, FP - 44, bw, '#1e6b3a', '#ffffff', text); };
      street(at[2] - 2, '100 FT RD'); street(at[6] - 2, '12TH MAIN');

      // Near: lamp posts linked by sagging cable bundles, raintrees.
      const near = mk(LW, H), ng = near.getContext('2d'), R3 = rng(125);
      const N = (c, x, y, w, h) => { ng.fillStyle = c; ng.fillRect(x, y, w, h); };
      const poles = [100, 250, 400, 530];
      for (let i = 0; i < poles.length; i++) {
        const a = poles[i] + 1, b = (i + 1 < poles.length ? poles[i + 1] : poles[0] + LW) + 1;
        for (let k = 0; k < 4; k++) {
          const y0 = GY - 118 + k * 3, sag = 6 + k * 2 + R3() * 5;
          for (let x = a; x <= b; x++) { const u = (x - a) / (b - a); N('#1a1520', x % LW, Math.round(y0 + sag * 4 * u * (1 - u)), 1, 1); }
        }
        // cable tangle at the pole
        for (let k = 0; k < 14; k++) N('#1a1520', poles[i] - 4 + (R3() * 10 | 0), GY - 120 + (R3() * 14 | 0), 2 + (R3() * 3 | 0), 1);
      }
      for (const x of poles) {
        const base = GY - 10; // poles stand on the kerb
        N('#3a3540', x, GY - 122, 2, 112); N('#4e4856', x, GY - 122, 1, 112); N('#2a2430', x - 1, base - 3, 4, 3);
        N('#3a3540', x, GY - 80, 10, 2); N('#2a2430', x + 6, GY - 78, 5, 2); N('#ffe6a0', x + 7, GY - 76, 3, 1);
      }
      const leaf = '#1f3a2a', leafLit = '#2f5a3a';
      for (const tx of [30, 330]) {
        N('#2b201c', tx, GY - 92, 4, 82); N('#3a2c26', tx, GY - 92, 1, 82);
        for (let k = 0; k < 20; k++) { const by = GY - 92 - k; N('#2b201c', tx - k, by, 2, 1); N('#2b201c', tx + 3 + k, by + 2, 2, 1); }
        for (let j = 0; j < 16; j++) disc(ng, tx - 34 + (R3() * 72 | 0), GY - 140 + (R3() * 34 | 0), 7 + (R3() * 9 | 0), leaf);
        for (let j = 0; j < 30; j++) N(leafLit, tx - 34 + (R3() * 72 | 0), GY - 150 + (R3() * 40 | 0), 2, 2);
      }

      const lampX = (p, scroll) => ((p - scroll * .55) % LW + LW) % LW;
      return {
        sky: s,
        layers: [{ img: far, speed: .06 }, metro, { img: strip, speed: .3 }, { img: near, speed: .55 }],
        front(ctx, t, scroll) { // lamp light cones
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,214,140,.05)';
          for (const p of poles) for (const sx of [lampX(p, scroll), lampX(p, scroll) - LW]) {
            if (sx < -30 || sx > W + 10) continue;
            ctx.beginPath(); ctx.moveTo(sx + 8, GY - 75); ctx.lineTo(sx - 8, GY); ctx.lineTo(sx + 26, GY); ctx.fill();
          }
          ctx.globalCompositeOperation = 'source-over';
        },
        groundFx(ctx, t, scroll) { // lamp reflections on the wet road
          ctx.fillStyle = 'rgba(255,214,140,.14)';
          for (const p of poles) for (const sx of [lampX(p, scroll), lampX(p, scroll) - LW]) {
            if (sx < -10 || sx > W + 10) continue;
            for (let y = GY + 5, i = 0; y < GY + 22; y += 3, i++) ctx.fillRect(Math.round(sx + 7 + Math.sin(t * 3 + i) * .8), y, 3 - (i > 3 ? 1 : 0), 1);
          }
        },
      };
    },
    // The Chrome "no internet" page: flat paper sky, pixel clouds, one thin horizon.
    retro(P, W, H, GY, LW) {
      const s = mk(W, H), g = s.getContext('2d');
      g.fillStyle = P.skyTop; g.fillRect(0, 0, W, H);
      g.fillStyle = mix(P.skyTop, P.far, .55); g.fillRect(0, GY - 30, W, 30);
      const far = mk(LW, H), fg = far.getContext('2d');
      ridge(fg, LW, H, GY - 2, 22, P.far, 71, { step: 3, flat: 3, harmonics: [1, 2, 3] });
      const mid = mk(LW, H), mg = mid.getContext('2d');
      ridge(mg, LW, H, GY, 10, P.mid, 72, { step: 2, flat: 2, harmonics: [2, 3, 5] });
      return {
        sky: s,
        layers: [{ img: far, speed: .05 }, { img: mid, speed: .12 }],
        extra(ctx, t, scroll) { // drifting pixel clouds
          const cloud = (x, y, k) => {
            ctx.fillStyle = 'rgba(200,200,200,.9)';
            ctx.fillRect(x + 5 * k, y, 7 * k, 2 * k);
            ctx.fillRect(x + 2 * k, y + 2 * k, 12 * k, 2 * k);
            ctx.fillRect(x, y + 4 * k, 16 * k, 2 * k);
          };
          for (let i = 0; i < 4; i++) {
            const span = W + 220;
            const x = (((i * 173 + 40 - scroll * .09) % span) + span) % span - 110;
            if (x > -70 && x < W + 20) cloud(x, H * (.11 + (i % 3) * .085), i === 2 ? 2 : 1);
          }
        },
      };
    },
  };

  // Ground strip (tileable, from GY to bottom).
  function groundTile(L, W, H, GY, LW) {
    const P = L.palette, gh = H - GY, c = mk(LW, gh), g = c.getContext('2d'), R = rng(L.id * 7);
    if (L.bg === 'retro') {
      // white floor, one 2px horizon line and a few pebbles — like the offline page
      g.fillStyle = P.ground; g.fillRect(0, 0, LW, gh);
      g.fillStyle = P.line; g.fillRect(0, 0, LW, 2);
      for (let i = 0; i < 10; i++) { const x = R() * LW | 0; g.fillRect(x, 2, 1 + (R() * 2 | 0), 1); }
      for (let i = 0; i < 30; i++) { const x = R() * LW | 0, y = 5 + R() * Math.min(12, Math.max(1, gh - 6)) | 0; g.fillRect(x, y, 1 + (R() * 3 | 0), 1); }
      return c;
    }
    sky(g, LW, gh, P.ground, mix(P.ground, P.groundDark, .5), P.groundDark, 6);
    g.fillStyle = P.line; g.fillRect(0, 0, LW, 2);
    for (let i = 0; i < LW / 3; i++) { g.fillStyle = R() < .5 ? P.groundDark : P.line; g.fillRect(R() * LW | 0, 4 + R() * gh | 0, 1 + (R() * 3 | 0), 1); }
    if (L.bg === 'volcano') { g.fillStyle = P.lava; for (let i = 0; i < 18; i++) { let x = R() * LW | 0, y = 3; for (let k = 0; k < 20; k++) { g.fillRect(x, y, 1, 1); y++; x += R() < .5 ? -1 : 1; } } }
    if (L.bg === 'city') { g.fillStyle = 'rgba(255,42,138,.25)'; for (let x = 0; x < LW; x += 40) g.fillRect(x, 8, 18, 2); g.fillStyle = 'rgba(0,240,255,.12)'; g.fillRect(0, 3, LW, 2); }
    if (L.bg === 'space') { g.fillStyle = P.groundDark; for (let x = 0; x < LW; x += 24) g.fillRect(x, 2, 1, gh); g.fillStyle = P.accent; for (let x = 12; x < LW; x += 48) g.fillRect(x, 5, 3, 1); }
    if (L.bg === 'glitch') { g.clearRect(0, 2, LW, gh); g.fillStyle = P.ground; g.fillRect(0, 2, LW, gh); }
    if (L.bg === 'vault') {
      g.clearRect(0, 2, LW, gh); g.fillStyle = P.ground; g.fillRect(0, 2, LW, gh);
      g.fillStyle = 'rgba(0,0,0,.5)'; for (let x = 0; x < LW; x += 34) g.fillRect(x, 2, 1, gh);
      g.fillStyle = 'rgba(37,232,255,.10)'; for (let x = 12; x < LW; x += 34) g.fillRect(x, 8, 12, 1);
      g.fillStyle = P.accent2; for (let x = 26; x < LW; x += 34) g.fillRect(x, 6, 1, 1);
    }
    if (L.bg === 'indiranagar') {
      g.clearRect(0, 0, LW, gh); g.fillStyle = P.ground; g.fillRect(0, 0, LW, gh);
      g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(0, 0, LW, 1);
      g.fillStyle = 'rgba(0,0,0,.22)'; for (let i = 0; i < 26; i++) g.fillRect(R() * LW | 0, 6 + R() * (gh - 8) | 0, 8 + R() * 22 | 0, 3 + R() * 4 | 0); // patch repairs
      g.fillStyle = 'rgba(232,228,216,.7)'; const ly = Math.min(gh - 4, 20); for (let x = 4; x < LW; x += 26) g.fillRect(x, ly, 14, 2); // lane dashes
    }
    if (L.bg === 'shore') {
      g.clearRect(0, 2, LW, gh); g.fillStyle = P.ground; g.fillRect(0, 2, LW, gh);
      g.fillStyle = 'rgba(255,255,255,.35)'; g.fillRect(0, 2, LW, 1);
      g.fillStyle = P.groundDark; for (let x = 0; x < LW; x += 26) if (R() < .5) g.fillRect(x + (R() * 20 | 0), 6 + (R() * 6 | 0), 2, 1);
    }
    return c;
  }

  DR.Backgrounds = {
    build(L, W, H, GY) {
      const LW = W * 2;
      const t = THEMES[L.bg](L.palette, W, H, GY, LW);
      t.ground = groundTile(L, W, H, GY, LW); t.LW = LW; t.W = W; t.H = H; t.GY = GY;
      return t;
    },
    draw(ctx, B, scroll, time) {
      ctx.drawImage(B.sky, 0, 0);
      if (B.extra) B.extra(ctx, time, scroll);
      for (const l of B.layers) {
        if (l.draw) { l.draw(ctx, time, scroll); continue; } // live layer (e.g. a moving train)
        const lw = l.img.width, x = -((scroll * l.speed) % lw);
        ctx.drawImage(l.img, Math.floor(x), 0); ctx.drawImage(l.img, Math.floor(x) + lw - 1, 0);
      }
      if (B.front) B.front(ctx, time, scroll);
    },
    drawGround(ctx, B, scroll, time) {
      const x = -(scroll % B.LW);
      ctx.drawImage(B.ground, Math.floor(x), B.GY); ctx.drawImage(B.ground, Math.floor(x) + B.LW - 1, B.GY);
      if (B.groundFx) { ctx.save(); ctx.beginPath(); ctx.rect(0, B.GY + 2, B.W, B.H - B.GY); ctx.clip(); B.groundFx(ctx, time, scroll); ctx.restore(); }
    },
    // Small static preview for level cards.
    thumb(L, w, h) {
      const B = this.build(L, w, h, Math.round(h * .78));
      const c = mk(w, h), g = c.getContext('2d');
      this.draw(g, B, 40, 1); this.drawGround(g, B, 40, 1);
      return c;
    },
  };
})();
