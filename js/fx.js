// Particles, weather, floating text, and cinematic post-processing.
(function () {
  const { mk } = DR.Sprites;
  const R = Math.random;

  class FX {
    constructor(W, H, GY) {
      this.W = W; this.H = H; this.GY = GY;
      this.parts = []; this.texts = []; this.weather = []; this.kind = 'none';
      this.flash = 0; this.flashColor = '#fff'; this.wind = 0; this.glitch = 0;
      this.dark = mk(W, H); this.dg = this.dark.getContext('2d');
      // precomputed vignette
      this.vig = mk(W, H); const v = this.vig.getContext('2d');
      const grd = v.createRadialGradient(W / 2, H * .55, Math.min(W, H) * .25, W / 2, H * .55, Math.max(W, H) * .75);
      grd.addColorStop(0, 'rgba(0,0,0,0)'); grd.addColorStop(1, 'rgba(0,0,0,.65)');
      v.fillStyle = grd; v.fillRect(0, 0, W, H);
    }

    // ---------- particles ----------
    burst(x, y, n, o = {}) {
      for (let i = 0; i < n; i++) {
        const a = (o.angle ?? -Math.PI / 2) + (R() - .5) * (o.spread ?? Math.PI * 2), sp = (o.speed ?? 120) * (.4 + R() * .8);
        const life = (o.life ?? .6) * (.6 + R() * .6);
        this.parts.push({ x, y, vx: Math.cos(a) * sp + (o.vx || 0), vy: Math.sin(a) * sp, life, max: life, size: o.size ?? 2, color: Array.isArray(o.color) ? o.color[(R() * o.color.length) | 0] : (o.color || '#fff'), grav: o.grav ?? 300, drag: o.drag ?? .98, glow: o.glow, shape: o.shape });
      }
    }
    ring(x, y, color, maxR = 40, life = .4) { this.parts.push({ x, y, ring: true, r: 2, maxR, color, life, max: life }); }
    text(x, y, str, color = '#ffcf4a', size = 9, life = .9) { this.texts.push({ x, y, str, color, size, life, max: life }); }
    doFlash(a = .8, color = '#fff') { this.flash = Math.max(this.flash, a); this.flashColor = color; }

    // ---------- weather ----------
    setWeather(kind) {
      this.kind = kind; this.weather = [];
      const n = { rain: 90, snow: 110, dust: 40, embers: 60, bubbles: 40, fog: 7, stars: 50, glitch: 30 }[kind] || 0;
      for (let i = 0; i < n; i++) this.weather.push(this.spawnW(true));
    }
    spawnW(init) {
      const W = this.W, H = this.H, k = this.kind;
      const p = { x: R() * W * 1.2, y: init ? R() * H : -10, s: R() };
      if (k === 'embers' || k === 'bubbles') p.y = init ? R() * H : H + 5;
      if (k === 'fog') { p.y = this.GY - 40 + R() * 60; p.w = 80 + R() * 120; p.x = R() * W * 1.5 - 60; }
      if (k === 'stars' || k === 'dust') { p.x = init ? R() * W : W + 10; p.y = R() * H; }
      return p;
    }
    updWeather(dt, speed) {
      const W = this.W, H = this.H, k = this.kind;
      for (let i = 0; i < this.weather.length; i++) {
        const p = this.weather[i];
        switch (k) {
          case 'rain': p.x -= (120 + speed * .6) * dt; p.y += (420 + p.s * 200) * dt;
            if (p.y > this.GY + p.s * 20) { if (R() < .3) this.burst(p.x, this.GY + p.s * 6, 2, { speed: 40, life: .2, color: 'rgba(170,200,255,.8)', size: 1, grav: 400 }); Object.assign(p, this.spawnW(false)); } break;
          case 'snow': p.x += (-speed * .25 - 20 + Math.sin(p.y * .05 + p.s * 9) * 15 + this.wind * 4) * dt * (.5 + p.s); p.y += (25 + p.s * 40) * dt; if (p.y > H || p.x < -10) Object.assign(p, this.spawnW(false)); break;
          case 'dust': p.x -= (speed * 1.2 + p.s * 80) * dt; p.y += Math.sin(p.x * .05) * .2; if (p.x < -10) Object.assign(p, this.spawnW(false)); break;
          case 'embers': p.y -= (30 + p.s * 60) * dt; p.x += (Math.sin(p.y * .04 + p.s * 6) * 20 - speed * .2) * dt; if (p.y < -5 || p.x < -5) Object.assign(p, this.spawnW(false)); break;
          case 'bubbles': p.y -= (25 + p.s * 50) * dt; p.x += (Math.sin(p.y * .06 + p.s * 5) * 12 - speed * .3) * dt; if (p.y < 10 || p.x < -5) { Object.assign(p, this.spawnW(false)); p.x = R() * W * 1.3; } break;
          case 'fog': p.x -= (speed * .15 + 6 + p.s * 10) * dt; if (p.x + p.w < 0) { p.x = W + R() * 40; } break;
          case 'stars': p.x -= (speed * (1.5 + p.s * 3)) * dt; if (p.x < -30) Object.assign(p, this.spawnW(false)); break;
          case 'glitch': p.y += (60 + p.s * 120) * dt; if (p.y > H) Object.assign(p, this.spawnW(false)); break;
        }
      }
    }
    drawWeather(ctx, t) {
      const k = this.kind;
      for (const p of this.weather) {
        switch (k) {
          case 'rain': ctx.strokeStyle = `rgba(170,200,255,${.25 + p.s * .35})`; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(p.x + 4, p.y - 10 - p.s * 6); ctx.stroke(); break;
          case 'snow': ctx.fillStyle = `rgba(255,255,255,${.5 + p.s * .5})`; ctx.fillRect(p.x, p.y, p.s > .7 ? 2 : 1, p.s > .7 ? 2 : 1); break;
          case 'dust': ctx.fillStyle = `rgba(255,220,170,${.2 + p.s * .3})`; ctx.fillRect(p.x, p.y, 2 + p.s * 4, 1); break;
          case 'embers': ctx.fillStyle = p.s > .5 ? '#ffd000' : '#ff5a00'; ctx.globalAlpha = .5 + .5 * Math.sin(t * 8 + p.s * 20); ctx.fillRect(p.x, p.y, 1 + (p.s > .8), 1 + (p.s > .8)); ctx.globalAlpha = 1; break;
          case 'bubbles': ctx.strokeStyle = 'rgba(180,240,255,.5)'; ctx.lineWidth = .8; ctx.beginPath(); ctx.arc(p.x, p.y, 1 + p.s * 2.5, 0, 6.3); ctx.stroke(); break;
          case 'fog': ctx.fillStyle = 'rgba(190,170,220,.07)'; ctx.fillRect(p.x, p.y, p.w, 18 + p.s * 20); ctx.fillRect(p.x + 10, p.y + 4, p.w - 20, 10); break;
          case 'stars': ctx.fillStyle = `rgba(200,220,255,${.2 + p.s * .5})`; ctx.fillRect(p.x, p.y, 3 + p.s * 14, 1); break;
          case 'glitch': ctx.fillStyle = p.s > .5 ? 'rgba(0,240,255,.35)' : 'rgba(255,42,109,.35)'; ctx.fillText(p.s > .5 ? '1' : '0', p.x, p.y); break;
        }
      }
    }

    // ---------- update / draw ----------
    update(dt, speed) {
      for (let i = this.parts.length - 1; i >= 0; i--) {
        const p = this.parts[i]; p.life -= dt;
        if (p.life <= 0) { this.parts.splice(i, 1); continue; }
        if (p.ring) { p.r += (p.maxR - p.r) * Math.min(1, dt * 10); continue; }
        p.vy += p.grav * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt;
      }
      for (let i = this.texts.length - 1; i >= 0; i--) { const t = this.texts[i]; t.life -= dt; t.y -= 22 * dt; if (t.life <= 0) this.texts.splice(i, 1); }
      this.updWeather(dt, speed);
      this.flash = Math.max(0, this.flash - dt * 3);
      this.glitch = Math.max(0, this.glitch - dt);
    }
    drawParts(ctx) {
      for (const p of this.parts) {
        const a = Math.max(0, p.life / p.max);
        if (p.ring) { ctx.strokeStyle = p.color; ctx.globalAlpha = a; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, 6.3); ctx.stroke(); continue; }
        ctx.globalAlpha = Math.min(1, a * 1.5); ctx.fillStyle = p.color;
        if (p.glow) ctx.globalCompositeOperation = 'lighter';
        const s = p.size * (p.shape === 'shrink' ? a : 1);
        ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
        ctx.globalCompositeOperation = 'source-over';
      }
      ctx.globalAlpha = 1;
    }
    drawTexts(ctx) {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (const t of this.texts) {
        const a = Math.min(1, t.life / t.max * 2), pop = 1 + Math.max(0, (t.life - t.max + .12)) * 5;
        ctx.globalAlpha = a; ctx.font = `900 ${t.size * pop}px ui-monospace, Menlo, monospace`;
        ctx.fillStyle = '#000'; ctx.fillText(t.str, t.x + .7, t.y + .9);
        ctx.fillStyle = t.color; ctx.fillText(t.str, t.x, t.y);
      }
      ctx.globalAlpha = 1;
    }
    // Darkness with light holes. lights: [{x,y,r}]
    drawDark(ctx, amount, lights) {
      if (amount <= 0) return;
      const g = this.dg; g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, this.W, this.H);
      g.fillStyle = `rgba(4,0,10,${amount})`; g.fillRect(0, 0, this.W, this.H);
      g.globalCompositeOperation = 'destination-out';
      for (const l of lights) {
        const grd = g.createRadialGradient(l.x, l.y, 0, l.x, l.y, l.r);
        grd.addColorStop(0, 'rgba(0,0,0,1)'); grd.addColorStop(.55, 'rgba(0,0,0,.75)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grd; g.beginPath(); g.arc(l.x, l.y, l.r, 0, 6.3); g.fill();
      }
      ctx.drawImage(this.dark, 0, 0);
    }
    post(ctx, grade, vig = 1) {
      if (grade) { ctx.fillStyle = grade; ctx.fillRect(0, 0, this.W, this.H); }
      if (vig > 0) { ctx.globalAlpha = vig; ctx.drawImage(this.vig, 0, 0); ctx.globalAlpha = 1; }
      if (this.flash > 0) { ctx.globalAlpha = Math.min(1, this.flash); ctx.fillStyle = this.flashColor; ctx.fillRect(0, 0, this.W, this.H); ctx.globalAlpha = 1; }
    }
  }
  DR.FX = FX;
})();
