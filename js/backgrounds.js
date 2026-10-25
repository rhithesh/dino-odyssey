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
        const branch = (bx, by, len, dir, d) => { if (d > 3 || len < 2) return; let px = bx, py = by; for (let i = 0; i < len; i++) { px += dir; py -= (i % 2); mg.fillRect(px, py, 1 + (d < 2), 1); } branch(px, py, len * .6 | 0, dir, d + 1); branch(px, py, len * .5 | 0, -dir, d + 2); };
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
        const x = -((scroll * l.speed) % B.LW);
        ctx.drawImage(l.img, Math.floor(x), 0); ctx.drawImage(l.img, Math.floor(x) + B.LW - 1, 0);
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
