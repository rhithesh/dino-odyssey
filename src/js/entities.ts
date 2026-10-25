// Spawning patterns, obstacles, pickups, collisions, close calls and boss AI (mixed into Game).
(function () {
  const { clamp, lerp, ease } = DR.util;
  const R = Math.random, pick = a => a[(R() * a.length) | 0];
  const overlap = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  const G = DR.Game.prototype;

  // ---------------- spawning ----------------
  G.spawnUpdate = function (dt) {
    if (this.tidePhase && this.tidePhase !== 'idle') return; // the surge owns the lane
    this.nextSpawn -= this.speed * dt;
    if (this.nextSpawn > 0) return;
    const L = this.L, d = clamp(this.dist / L.goal, 0, 1);
    this.nextSpawn = lerp(L.gap[1], L.gap[0], d) * (.85 + R() * .45) * Math.max(this.speed, 140);
    if (this.mode === 'swim') this.spawnSwim(d);
    else if (this.mode === 'flip') this.spawnFlip(d);
    else this.spawnRun(d);
    if (this.hearts < this.maxHearts && !this.demo && R() < .045) this.obs.push({ kind: 'heart', x: this.W + 60, y: (this.mode === 'run' ? this.GY - 52 : (this.GY + (this.mode === 'flip' ? this.CY : this.SURF)) / 2), w: 7, h: 6, t: 0, glow: 22 });
  };

  G.spawnRun = function (d) {
    const L = this.L, x = this.W + 20, r = R();
    if (L.lasers && d > .12 && r < .34) { this.addLaser(x); return; }
    if (this.fallersOn && !this.demo && r < .24) {
      const n = d > .5 && R() < .5 ? 2 : 1;
      for (let i = 0; i < n; i++) this.addFaller(150 + i * 70 + R() * 50, L.fallers === 'icicle' ? 'icicle' : 'meteor');
      this.nextSpawn += this.speed * .35;
      return;
    }
    if (L.pits && r < .42) {
      const w = 30 + R() * 18 * (.6 + d);
      this.obs.push({ kind: 'pit', x, w, y: this.GY, h: 0, t: 0, glow: 26 });
      this.addCoinArc(x + w / 2, this.GY - 58, 5);
      return;
    }
    if (d >= L.flyerFrom && r < .66) { this.addFlyer(x, pick(['low', 'mid', 'mid', 'high'])); return; }
    const big = R() < .28 + d * .32;
    let n = big ? 1 : 1 + (R() < d * .7 ? 1 : 0) + (R() < d * .3 ? 1 : 0);
    let cx = x;
    for (let i = 0; i < n; i++) { const o = this.addGround(cx, big ? 'L' : 'S'); cx += o.w - 1; }
    const span = cx - x;
    if (R() < .45) this.addCoinArc(x + span / 2, this.GY - (big ? 66 : 56), 5);
    else if (R() < .35) this.addCoinLine(cx + 40, this.GY - 9, 4);
  };

  G.spawnSwim = function (d) {
    const x = this.W + 20, r = R(), top = this.SURF, GY = this.GY;
    if (r < .35) { // kelp gate
      const gap = 74 - d * 16, c = top + 50 + R() * (GY - top - 100);
      this.addKelp(x, GY - (c + gap / 2), false);
      this.addKelp(x + 2, (c - gap / 2) - top, true);
      this.addCoinLine(x + 2, c - 3, 3, 12);
    } else if (r < .6) {
      const n = 1 + (R() < .3 + d * .5 ? 1 : 0);
      for (let i = 0; i < n; i++) { const y = top + 30 + R() * (GY - top - 50); this.obs.push({ kind: 'mine', x: x + i * 50, y, by: y, w: 0, h: 0, t: R() * 6 }); }
      this.addCoinWave(x + 30, top + 40 + R() * (GY - top - 100), 6);
    } else if (r < .85) {
      const y = top + 40 + R() * (GY - top - 100), img = this.S.flyer[0];
      this.obs.push({ kind: 'flyer', x, y, by: y, w: img.width, h: img.height, bob: 30 + d * 20, bobF: 1.6 + R(), ph: R() * 6, t: 0, vx: 20 });
    } else {
      this.addKelp(x, 60 + R() * 70, false);
      this.addCoinWave(x + 40, top + 50, 6);
    }
  };

  G.spawnFlip = function (d) {
    const x = this.W + 20, r = R();
    if (r < .42) {
      const ceil = R() < .5; this.addGround(x, R() < .3 + d * .3 ? 'L' : 'S', ceil);
      this.addCoinLine(x + 30, ceil ? this.GY - 9 : this.CY + 3, 4);
    } else if (r < .78) {
      const first = R() < .5, gap = 110 - d * 25 + R() * 30;
      this.addGround(x, 'S', first); this.addGround(x + gap, R() < .4 ? 'L' : 'S', !first);
    } else {
      const img = this.S.flyer[0], mid = (this.GY + this.CY) / 2;
      this.obs.push({ kind: 'flyer', x, y: mid - img.height / 2, by: mid - img.height / 2, w: img.width, h: img.height, bob: 26, bobF: 2.2, ph: R() * 6, t: 0, vx: 30 });
      this.addCoinLine(x + 60, R() < .5 ? this.CY + 3 : this.GY - 9, 4);
    }
  };

  G.addGround = function (x, size, ceil = false) {
    const img = pick(this.S.ground[size]);
    const surf = this.mode === 'swim' ? this.SURF : this.CY;
    const o = { kind: 'ground', x, w: img.width, h: img.height, img, ceil, y: ceil ? surf : this.GY - img.height, t: 0, glow: this.darkOn ? 20 : 0 };
    this.obs.push(o); return o;
  };
  G.addKelp = function (x, h, ceil) {
    if (h < 8) return;
    const img = pick(this.S.ground.L.concat(this.S.ground.S));
    this.obs.push({ kind: 'ground', x, w: img.width, h, img, ceil, y: ceil ? this.SURF : this.GY - h, t: 0 });
  };
  G.addFlyer = function (x, height) {
    const L = this.L, img = this.S.flyer[0], GY = this.GY;
    const bottom = { low: GY - 3, mid: GY - 13, high: GY - 28 }[height];
    const o: any = { kind: 'flyer', x, y: bottom - img.height, w: img.width, h: img.height, t: 0, vx: 35 + R() * 25, ph: R() * 6 };
    if (L.droneBob && R() < .7) { o.by = GY - 14 - img.height; o.bob = 11; o.bobF = 3 + R() * 1.5; o.vx = 20; }
    if (L.ghostPhase) { o.phase = true; o.alpha = 1; o.glow = 18; }
    this.obs.push(o);
  };
  // Laser fence: a floating beam segment that charges, fires, then shuts off.
  G.addLaser = function (x) {
    // Alternate low/high so the vault reads as a beat: jump, duck, jump, duck.
    const hi = (this.laserFlip = R() < .15 ? this.laserFlip : !this.laserFlip);
    const GY = this.GY, w = 34 + (R() * 22 | 0);
    this.obs.push({
      kind: 'laser', x, y: hi ? GY - 23 : GY - 9, w, h: hi ? 12 : 8, hi,
      t: 0, period: 1.6 + R() * .3, warn: .42, fire: .5, on: false, wasOn: false, glow: 26,
    });
    if (R() < .5) this.addCoinArc(x + w / 2, GY - (hi ? 46 : 62), 3);
  };
  // Raised rock shelf wide enough to ride out a whole surge.
  G.addPlat = function (x, w = 560) {
    const h = 58 + (R() * 5 | 0);
    const o = { kind: 'plat', x, y: this.GY - h, w, h: 20, t: 0 };
    this.obs.push(o);
    for (let i = 0; i < 4; i++) this.coins.push({ x: x + 24 + i * 17, y: this.GY - h - 14, t: i * .2 });
    this.coinsSpawned += 4;
    return o;
  };
  G.addFaller = function (landX, sub) {
    const ft = Math.sqrt(2 * (this.GY + 24) / 1000);
    const trigX = landX + this.speed * ft;
    this.obs.push({ kind: 'faller', sub, x: trigX, y: -24, vy: 0, trigX, w: 8, h: 12, t: 0, glow: sub === 'meteor' ? 30 : 0 });
  };
  G.addCoinArc = function (cx, topY, n) {
    for (let i = 0; i < n; i++) { const k = (i / (n - 1)) * 2 - 1; this.coins.push({ x: cx - 3 + k * 26, y: topY + k * k * 20, t: i * .2 }); }
    this.coinsSpawned += n;
  };
  G.addCoinLine = function (x, y, n, dx = 14) { for (let i = 0; i < n; i++) this.coins.push({ x: x + i * dx, y: y - 3, t: i * .2 }); this.coinsSpawned += n; };
  G.addCoinWave = function (x, y, n) { for (let i = 0; i < n; i++) this.coins.push({ x: x + i * 13, y: y + Math.sin(i * .9) * 16, t: i * .2 }); this.coinsSpawned += n; };

  // ---------------- collisions ----------------
  G.hitbox = function (o) {
    switch (o.kind) {
      case 'ground': return o.ceil ? { x: o.x + 2, y: o.y, w: o.w - 4, h: o.h - 2 } : { x: o.x + 2, y: o.y + 2, w: o.w - 4, h: o.h - 2 };
      case 'flyer': return o.phase && o.alpha < .45 ? null : { x: o.x + 2, y: o.y + 2, w: o.w - 4, h: o.h - 4 };
      case 'faller': return o.y < -10 ? null : o.sub === 'icicle' ? { x: o.x - 3, y: o.y - 10, w: 6, h: 12 } : { x: o.x - 5, y: o.y - 5, w: 10, h: 10 };
      case 'mine': return { x: o.x - 5, y: o.y - 5, w: 10, h: 10 };
      case 'proj': return { x: o.x - o.r + 1, y: o.y - o.r + 1, w: o.r * 2 - 2, h: o.r * 2 - 2 };
      case 'shock': return { x: o.x, y: this.GY - o.h, w: o.w, h: o.h };
      case 'laser': return o.on ? { x: o.x + 1, y: o.y + 1, w: o.w - 2, h: o.h - 2 } : null;
      case 'plat': return null; // the top surface is handled by player physics
      default: return null;
    }
  };
  G.pitUnder = function (x) { for (const o of this.obs) if (o.kind === 'pit' && x > o.x + 3 && x < o.x + o.w - 3) return o; return null; };

  G.closeCall = function (o) {
    this.closeN++; this.streak += 2;
    const m = this.mult(); this.score += 25 * m;
    this.fx.text(this.p.x + 12, this.p.y - 30 * this.p.g, pick(['CLOSE!', 'WHOA!', 'NICE!', 'TOO CLOSE!']), '#7df9ff', 9);
    this.fx.burst(this.p.x + 10, this.p.y - 10, 8, { color: ['#7df9ff', '#fff'], speed: 90, grav: 0, life: .35, size: 1.5 });
    this.slow = Math.min(this.slow, .55);
    DR.Audio.sfx('close');
  };

  G.updateEntities = function (dt) {
    const sp = this.speed * dt, p = this.p, pb = this.playerBox(), GY = this.GY, P = this.L.palette;
    const canHit = !p.dead && this.phase !== 'intro';
    for (let i = this.obs.length - 1; i >= 0; i--) {
      const o = this.obs[i]; o.t += dt;
      if (o.kind === 'shot') { this.updateShot(o, dt); if (o.dead) this.obs.splice(i, 1); continue; }
      o.x -= sp + (o.vx || 0) * dt;
      switch (o.kind) {
        case 'flyer':
          if (o.bob) o.y = o.by + Math.sin(o.t * o.bobF + o.ph) * o.bob;
          if (o.phase) o.alpha = .5 + .5 * Math.sin(o.t * 2.4 + o.ph);
          break;
        case 'mine': o.y = o.by + Math.sin(o.t * 2) * 4; break;
        case 'laser': {
          const ph = ((o.t % o.period) + o.period) % o.period;
          o.wasOn = o.on;
          o.on = ph >= o.warn && ph < o.warn + o.fire;
          o.charge = ph >= o.warn - .22 && ph < o.warn;
          if (o.on && !o.wasOn && o.x < this.W + 30 && o.x > -20) DR.Audio.sfx('laser');
          if (o.on && R() < .5) this.fx.burst(o.x + R() * o.w, o.y + o.h / 2, 1, { color: [this.L.palette.line, '#fff'], speed: 26, grav: 0, life: .22, size: 1.5, glow: true, shape: 'shrink' });
          break;
        }
        case 'faller':
          if (!o.falling && o.x <= o.trigX) { o.falling = true; o.y = -24; }
          if (o.falling) {
            o.vy += 1000 * dt; o.y += o.vy * dt;
            if (o.sub === 'meteor' && R() < .8) this.fx.burst(o.x, o.y - 4, 1, { color: ['#ff4a00', '#ffd000', '#555'], speed: 20, grav: -40, life: .5, size: 3, shape: 'shrink' });
            if (o.y >= GY) this.landFaller(o);
          }
          break;
        case 'proj': if (R() < .7) this.fx.burst(o.x + o.r, o.y, 1, { color: o.color, speed: 15, grav: 0, life: .3, size: o.r * .8, glow: true, shape: 'shrink' }); break;
        case 'shock': if (R() < .9) this.fx.burst(o.x + R() * o.w, GY - 2, 1, { color: ['#ffd000', '#ff6a00'], speed: 60, angle: -Math.PI / 2, spread: 1, grav: 300, life: .4 }); break;
        case 'orb': o.y = o.by + Math.sin(o.t * 5) * 4;
          if (canHit && overlap({ x: pb.x - 3, y: pb.y - 3, w: pb.w + 6, h: pb.h + 6 }, { x: o.x - 7, y: o.y - 7, w: 14, h: 14 })) { this.obs.splice(i, 1); this.fireShot(); continue; }
          break;
        case 'heart':
          if (canHit && overlap(pb, { x: o.x - 2, y: o.y - 2, w: 11, h: 10 })) {
            this.obs.splice(i, 1); this.hearts = Math.min(this.maxHearts, this.hearts + 1); DR.Audio.sfx('heart');
            this.fx.text(o.x, o.y - 8, '+♥', '#ff3b5c', 11); this.fx.burst(o.x, o.y, 12, { color: '#ff3b5c', speed: 80, grav: 0, life: .4 });
            continue;
          }
          break;
      }
      const hb = this.hitbox(o);
      if (hb && canHit && !o.hit && overlap(pb, hb)) {
        if (o.kind === 'faller' && this.perks.faller > 0 && this.p.inv <= 0 && !this.demo) {
          this.perks.faller--; o.hit = true; o.x = -999; this.perkFx('BONK!', '#f0d7b0');
        } else if (o.kind === 'ground' && this.perks.breaker > 0 && this.p.inv <= 0 && !this.demo) {
          this.perks.breaker--; this.perkFx('SMASH!', '#e06030');
          this.fx.burst(o.x + o.w / 2, o.y + o.h / 2, 24, { color: [this.L.palette.obstacle, '#fff'], speed: 180, life: .7, size: 2 });
          this.obs.splice(i, 1); continue;
        } else if (this.damage(o.kind)) { o.hit = true; if (o.kind === 'proj' || o.kind === 'faller') o.x = -999; }
        else o.grazed = true; // overlapped while invincible (i-frames / dash): no free combo for it
      } else if (hb && !o.passed) {
        if (hb.x < pb.x + pb.w + 4 && hb.x + hb.w > pb.x - 4) {
          const gap = Math.max(hb.y - (pb.y + pb.h), pb.y - (hb.y + hb.h));
          if (gap < 0) o.grazed = true;
          o.minD = Math.min(o.minD ?? 99, Math.max(0, gap));
        }
        if (hb.x + hb.w < pb.x) {
          o.passed = true;
          if (!o.hit && !o.grazed && canHit && this.live()) { this.streak++; if (o.minD !== undefined && o.minD < this.st.close && !this.demo) this.closeCall(o); }
        }
      }
      if (o.x + (o.w || 0) < -90 || o.x > this.W + 900) this.obs.splice(i, 1);
    }
    // coins
    for (let i = this.coins.length - 1; i >= 0; i--) {
      const c = this.coins[i]; c.x -= sp; c.t += dt;
      const m = this.st.magnet;
      if (canHit && !this.demo && overlap({ x: pb.x - m, y: pb.y - m, w: pb.w + m * 2, h: pb.h + m * 2 }, { x: c.x, y: c.y, w: 6, h: 6 })) {
        this.coins.splice(i, 1); this.coinN++; const worth = this.st.coinMul * (1 + this.st.coinBonus); this.bank += worth; this.score += 10 * worth * this.mult();
        if (worth > 1.01) this.fx.text(c.x + 3, c.y - 4, '+' + (Math.round(worth * 10) / 10), '#ffc400', 7, .5); DR.Audio.sfx('coin');
        this.fx.burst(c.x + 3, c.y + 3, 6, { color: ['#ffc400', '#fff6b0'], speed: 70, grav: 0, life: .3, size: 1.5, glow: true });
        continue;
      }
      if (c.x < -10) this.coins.splice(i, 1);
    }
  };

  G.landFaller = function (o) {
    const GY = this.GY;
    if (o.sub === 'icicle') {
      this.fx.burst(o.x, GY - 2, 12, { color: ['#fff', '#c9f0ff', '#8fdcff'], speed: 110, angle: -Math.PI / 2, spread: 2.4, life: .5, size: 1.5 });
      this.shake = Math.max(this.shake, 3); DR.Audio.sfx('land');
      if (!this.iceShard) this.iceShard = DR.Sprites.groundOf('ice', this.L.palette, 991).S[0];
      Object.assign(o, { kind: 'ground', img: this.iceShard, x: o.x - this.iceShard.width / 2, w: this.iceShard.width, h: this.iceShard.height, y: GY - this.iceShard.height, ceil: false });
    } else {
      this.fx.burst(o.x, GY - 2, 26, { color: ['#ff4a00', '#ffd000', '#ff8a00', '#333'], speed: 170, angle: -Math.PI / 2, spread: 2.6, life: .7, glow: true });
      this.fx.ring(o.x, GY - 2, '#ff8a00', 30, .35);
      this.shake = Math.max(this.shake, 7); DR.Audio.sfx('boom');
      if (!this.crater) this.crater = DR.Sprites.groundOf('rock', { ...this.L.palette, obstacle: '#3a2420', accent: '#ff6a00', accent2: '#ffd000' }, 992).S[0];
      Object.assign(o, { kind: 'ground', img: this.crater, x: o.x - this.crater.width / 2, w: this.crater.width, h: this.crater.height, y: GY - this.crater.height, ceil: false, glow: 22, lava: true });
    }
  };

  // ---------------- bosses ----------------
  G.bossIntroUpdate = function () {
    const L = this.L, t = this.phaseT;
    if (!this.boss) {
      const img = this.S.boss, white = DR.Sprites.mk(img.width, img.height), wg = white.getContext('2d');
      wg.drawImage(img, 0, 0); wg.globalCompositeOperation = 'source-in'; wg.fillStyle = '#fff'; wg.fillRect(0, 0, img.width, img.height);
      this.boss = { ...L.boss, max: L.boss.hp, x: this.W + 90, y: this.GY - 115, tx: this.W - 70, ty: this.GY - 115, t: 0, atkT: 1.2, ai: 0, sinceOrb: 1, stun: 0, flash: 0, white, slamT: -1 };
      DR.Audio.stopMusic(.5); DR.Audio.sfx('siren');
      if (this.mode !== 'run') { this.mode = 'run'; this.p.g = 1; }
      if (L.mode === 'mix') this.darkOn = false;
      this.fallersOn = false;
    }
    const b = this.boss;
    b.x = lerp(this.W + 90, b.tx, ease((t - 1.2) / 1.6));
    if (t > 1.2 && t - .02 < 1.2) this.shake = 6;
    if (t > 3.3) { this.setPhase('boss'); DR.Audio.playMusic(L.music, true); this.showBanner('FIGHT!', 'grab the glowing orbs', '#ff5470', 1.8); }
  };

  G.bossUpdate = function (dt) {
    const b = this.boss; if (!b || b.dying) return;
    if (b.stun > 0) { b.stun -= dt; return; }
    b.atkT -= dt;
    if (b.atkT > 0) return;
    if (b.sinceOrb >= 2) { this.spawnOrb(); b.sinceOrb = 0; b.atkT = 1.4; return; }
    this.bossAttack(b.attacks[b.ai++ % b.attacks.length]);
    b.sinceOrb++;
    b.atkT = lerp(1.15, 1.9, b.hp / b.max);
  };

  G.bossAttack = function (a) {
    const b = this.boss, GY = this.GY, col = { wyrm: '#ff6a00', phantom: '#b44dff', meteor: '#ff2a6d' }[b.kind];
    switch (a) {
      case 'low': this.obs.push({ kind: 'proj', x: b.x - 30, y: GY - 7, r: 6, vx: 130, color: col, t: 0, glow: 26 }); DR.Audio.sfx('shoot'); break;
      case 'high': this.obs.push({ kind: 'proj', x: b.x - 30, y: GY - 21, r: 5, vx: 150, color: col, t: 0, glow: 24 }); DR.Audio.sfx('shoot'); break;
      case 'rain': DR.Audio.sfx('warn'); [130, 200, 270].forEach((x, i) => setTimeout(() => this.phase === 'boss' && this.addFaller(x - i * 10, 'meteor'), i * 220)); break;
      case 'slam': b.slamT = 0; DR.Audio.sfx('warn'); break;
    }
  };
  G.spawnOrb = function () {
    const b = this.boss, y = this.GY - 38;
    this.obs.push({ kind: 'orb', x: b.x - 30, y, by: y, w: 0, h: 0, vx: -this.speed * .35, t: 0, glow: 36 });
    DR.Audio.sfx('orb'); this.fx.ring(b.x - 30, y, '#7df9ff', 24, .4);
  };
  G.fireShot = function () {
    const p = this.p;
    DR.Audio.sfx('orb'); this.fx.doFlash(.25, '#7df9ff'); this.fx.text(p.x + 10, p.y - 32, 'POWER!', '#7df9ff', 10);
    this.obs.push({ kind: 'shot', x: p.x + 14, y: p.y - 12, vx: 0, t: 0, glow: 30 });
  };
  G.updateShot = function (o, dt) {
    const b = this.boss; if (!b || b.gone) { o.dead = true; return; }
    const dx = b.x - o.x, dy = b.y - o.y, d = Math.hypot(dx, dy), v = 420;
    o.x += dx / d * v * dt; o.y += dy / d * v * dt;
    this.fx.burst(o.x, o.y, 2, { color: ['#7df9ff', '#fff'], speed: 20, grav: 0, life: .3, size: 3, glow: true, shape: 'shrink' });
    if (d < 18) { o.dead = true; this.bossHit(); }
  };
  G.bossHit = function () {
    const b = this.boss; if (b.dying) return;
    b.hp--; b.flash = .3; b.stun = .9; this.shake = 11; this.hitstop = .13; this.score += 250 * this.st.bossMul * this.mult();
    DR.Audio.sfx('bosshit'); this.fx.doFlash(.35, '#fff');
    this.fx.burst(b.x, b.y, 30, { color: ['#fff', '#7df9ff', '#ffd000'], speed: 200, life: .6, glow: true });
    this.fx.text(b.x - 10, b.y - 40, b.hp <= 0 ? 'K.O.!' : 'HIT!', '#fff', 14);
    if (b.hp <= 0) {
      b.dying = true; b.dieT = 0; this.slow = .4; DR.Audio.stopMusic(.3);
      this.obs = this.obs.filter(o => !['proj', 'shock', 'faller', 'orb'].includes(o.kind));
    }
  };
  G.bossTick = function (dt) {
    const b = this.boss; if (b.gone) return;
    b.t += dt; b.flash = Math.max(0, b.flash - dt);
    const GY = this.GY;
    if (b.dying) {
      b.dieT += dt; b.x += (Math.random() - .5) * 3; b.y += 12 * dt;
      if (Math.random() < dt * 14) { this.fx.burst(b.x + (R() - .5) * 60, b.y + (R() - .5) * 60, 16, { color: ['#fff', '#ffd000', '#ff4a00'], speed: 140, life: .5, glow: true }); this.shake = 6; DR.Audio.sfx('hit'); }
      if (b.dieT > 1.9) {
        b.gone = true; this.fx.doFlash(1, '#fff'); this.shake = 16; DR.Audio.sfx('boom');
        this.fx.burst(b.x, b.y, 90, { color: ['#fff', '#ffd000', '#ff4a00', '#7df9ff'], speed: 280, life: 1.2, glow: true, size: 3 });
        this.fx.ring(b.x, b.y, '#fff', 120, .6);
        this.win();
      }
      return;
    }
    if (b.slamT >= 0) {
      b.slamT += dt;
      if (b.slamT < .45) b.y = lerp(b.ty, GY - 34, ease(b.slamT / .45));
      else if (b.slamT - dt < .45) { this.obs.push({ kind: 'shock', x: b.x - 40, w: 18, h: 11, vx: 120, t: 0, glow: 24 }); this.shake = 9; DR.Audio.sfx('boom'); this.fx.burst(b.x, GY, 30, { color: ['#ffd000', '#ff6a00', '#fff'], speed: 180, angle: -Math.PI / 2, spread: 2.5, life: .5 }); }
      else if (b.slamT < 1.1) b.y = lerp(GY - 34, b.ty, ease((b.slamT - .45) / .65));
      else b.slamT = -1;
    } else b.y += (b.ty + Math.sin(b.t * 2) * 10 - b.y) * Math.min(1, dt * 3);
    if (this.phase === 'boss') b.x += (b.tx + Math.sin(b.t * .8) * 14 - b.x) * Math.min(1, dt * 2);
    const amb = { wyrm: ['#ff4a00', '#ffd000'], phantom: ['#b44dff', '#e8e4ff'], meteor: ['#ff6a00', '#ffd000', '#888'] }[b.kind];
    if (R() < .6) this.fx.burst(b.x + (R() - .3) * 40, b.y + (R() - .5) * 40, 1, { color: amb, speed: 30, grav: b.kind === 'phantom' ? -30 : -80, vx: 40, life: .8, size: 2.5, shape: 'shrink', glow: true });
  };

  // ---------------- drawing ----------------
  G.drawPits = function (ctx) {
    const GY = this.GY, H = this.H, P = this.L.palette;
    for (const o of this.obs) {
      if (o.kind !== 'pit') continue;
      const x = Math.round(o.x), w = Math.round(o.w);
      ctx.fillStyle = '#120202'; ctx.fillRect(x, GY, w, H - GY);
      ctx.fillStyle = P.lava || '#ff4a00';
      for (let i = 0; i < w - 2; i += 2) ctx.fillRect(x + 1 + i, GY + 7 + Math.sin(this.time * 4 + i * .4) * 1.5, 2, H - GY);
      ctx.fillStyle = '#ffd000'; for (let i = 0; i < w - 4; i += 6) ctx.fillRect(x + 2 + i, GY + 7 + Math.sin(this.time * 4 + i * .4) * 1.5, 3, 1);
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,90,0,${.18 + .06 * Math.sin(this.time * 5)})`; ctx.fillRect(x - 4, GY - 26, w + 8, 34); ctx.globalCompositeOperation = 'source-over';
      if (R() < .1) this.fx.burst(x + R() * w, GY + 6, 1, { color: ['#ffd000', '#ff4a00'], speed: 60, angle: -Math.PI / 2, spread: .6, life: .6, glow: true });
    }
  };

  G.drawEntities = function (ctx) {
    const S = this.S, GY = this.GY, t = this.time;
    // coins
    for (const c of this.coins) {
      const f = S.coin[Math.floor(c.t * 8) % 4];
      ctx.drawImage(f, Math.round(c.x), Math.round(c.y + Math.sin(c.t * 4)));
    }
    for (const o of this.obs) {
      const x = Math.round(o.x), y = Math.round(o.y);
      switch (o.kind) {
        case 'ground':
          if (o.ceil) { ctx.save(); ctx.translate(x, y + o.h); ctx.scale(1, -1); ctx.drawImage(o.img, 0, 0, o.w, o.h); ctx.restore(); }
          else ctx.drawImage(o.img, x, y, o.w, o.h);
          if (o.lava) { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,90,0,.15)'; ctx.fillRect(x - 3, y - 3, o.w + 6, o.h + 3); ctx.globalCompositeOperation = 'source-over'; }
          break;
        case 'flyer': {
          const f = S.flyer[Math.floor(o.t * 6) % 2];
          if (o.phase) ctx.globalAlpha = .12 + o.alpha * .88;
          ctx.drawImage(f, x, y);
          ctx.globalAlpha = 1;
          if (this.L.bg === 'city') { ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,230,0,.14)'; ctx.beginPath(); ctx.moveTo(x + 5, y + 6); ctx.lineTo(x + 9, y + 6); ctx.lineTo(x + 14, y + 40); ctx.lineTo(x, y + 40); ctx.fill(); ctx.globalCompositeOperation = 'source-over'; }
          break;
        }
        case 'faller': {
          if (o.x < this.W + 10) { // landing warning
            const a = .5 + .5 * Math.sin(t * 16);
            ctx.fillStyle = `rgba(255,40,60,${.35 + a * .5})`; ctx.fillRect(x - 6, GY - 2, 12, 2);
            ctx.beginPath(); ctx.moveTo(x, GY - 6); ctx.lineTo(x - 4, GY - 12); ctx.lineTo(x + 4, GY - 12); ctx.fill();
          }
          if (!o.falling) break;
          if (o.sub === 'icicle') {
            for (let i = 0; i < 12; i++) { const hw = Math.max(1, Math.round((12 - i) / 3)); ctx.fillStyle = i < 3 ? '#fff' : '#8fdcff'; ctx.fillRect(x - hw, y - 12 + i, hw * 2, 1); }
          } else {
            ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,120,0,.35)'; ctx.beginPath(); ctx.arc(x, y, 9, 0, 6.3); ctx.fill(); ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#4a2c26'; ctx.fillRect(x - 5, y - 5, 10, 10); ctx.fillStyle = '#ff6a00'; ctx.fillRect(x - 3, y - 3, 3, 3); ctx.fillStyle = '#ffd000'; ctx.fillRect(x - 1, y - 6, 2, 2);
          }
          break;
        }
        case 'plat': {
          const PP = this.L.palette;
          ctx.fillStyle = 'rgba(0,0,0,.26)'; ctx.fillRect(x + 8, GY - 3, o.w - 16, 3);
          ctx.fillStyle = PP.groundDark; ctx.fillRect(x, y + 12, o.w, 8);
          ctx.fillStyle = PP.ground; ctx.fillRect(x, y, o.w, 12);
          ctx.fillStyle = 'rgba(255,255,255,.3)'; ctx.fillRect(x, y, o.w, 2);
          ctx.fillStyle = 'rgba(120,200,220,.35)'; ctx.fillRect(x, y + 12, o.w, 2);
          for (let i = 0; i < o.w; i += 37) { ctx.fillStyle = PP.groundDark; ctx.fillRect(x + i + 5, y + 6, 4, 3); }
          break;
        }
        case 'laser': {
          const col = this.L.palette.line;
          ctx.fillStyle = o.on ? col : 'rgba(120,190,210,.55)';
          ctx.fillRect(x - 2, y - 1, 4, o.h + 2);
          ctx.fillRect(x + o.w - 2, y - 1, 4, o.h + 2);
          if (o.on) {
            ctx.globalCompositeOperation = 'lighter';
            ctx.fillStyle = 'rgba(37,232,255,.22)'; ctx.fillRect(x - 4, y - 5, o.w + 8, o.h + 10);
            ctx.fillStyle = col; ctx.fillRect(x, y, o.w, o.h);
            ctx.fillStyle = '#fff'; ctx.fillRect(x, y + o.h / 2 - 1, o.w, 2);
            ctx.globalCompositeOperation = 'source-over';
          } else {
            ctx.fillStyle = `rgba(37,232,255,${o.charge ? .55 + .45 * Math.sin(t * 40) : .18})`;
            for (let i = 0; i < o.w; i += 5) ctx.fillRect(x + i, y + o.h / 2, 2, 1);
          }
          break;
        }
        case 'mine': {
          ctx.fillStyle = '#1b2430'; ctx.beginPath(); ctx.arc(x, y, 6, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#3a4a5c'; for (let a = 0; a < 8; a++) { const ang = a * Math.PI / 4 + o.t * .3; ctx.fillRect(x + Math.cos(ang) * 7 - 1, y + Math.sin(ang) * 7 - 1, 3, 3); }
          ctx.fillStyle = Math.sin(o.t * 6) > 0 ? '#ff3050' : '#550010'; ctx.fillRect(x - 1, y - 1, 2, 2);
          break;
        }
        case 'proj': case 'orb': case 'shot': {
          const col = o.kind === 'proj' ? o.color : '#7df9ff', r = o.kind === 'proj' ? o.r : 6 + Math.sin(o.t * 8);
          ctx.globalCompositeOperation = 'lighter';
          ctx.fillStyle = col; ctx.globalAlpha = .3; ctx.beginPath(); ctx.arc(x, y, r * 2, 0, 6.3); ctx.fill();
          ctx.globalAlpha = 1; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.3); ctx.fill();
          ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(x - r * .2, y - r * .2, r * .45, 0, 6.3); ctx.fill();
          ctx.globalCompositeOperation = 'source-over';
          if (o.kind === 'orb') { ctx.strokeStyle = 'rgba(125,249,255,.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(x, y, 10 + (o.t * 20) % 8, 0, 6.3); ctx.stroke(); this.text(ctx, 'GRAB!', x, y - 16, 6, '#7df9ff', { shadow: '#000', alpha: .6 + .4 * Math.sin(o.t * 8) }); }
          break;
        }
        case 'shock': {
          ctx.globalCompositeOperation = 'lighter';
          for (let i = 0; i < o.w; i++) { const hh = o.h * (1 - Math.abs(i - o.w / 2) / (o.w / 2)) * (.8 + .2 * Math.sin(t * 30 + i)); ctx.fillStyle = i % 3 ? '#ff6a00' : '#ffd000'; ctx.fillRect(x + i, GY - hh, 1, hh); }
          ctx.globalCompositeOperation = 'source-over';
          break;
        }
        case 'heart':
          ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,59,92,.25)'; ctx.fillRect(x - 3, y - 3 + Math.sin(o.t * 4) * 2, 13, 12); ctx.globalCompositeOperation = 'source-over';
          ctx.drawImage(S.heart, x, Math.round(y + Math.sin(o.t * 4) * 2));
          break;
      }
    }
  };

  G.drawBoss = function (ctx) {
    const b = this.boss; if (b.gone) return;
    const size = 84, x = Math.round(b.x - size / 2), y = Math.round(b.y - size / 2);
    const aura = { wyrm: '255,80,0', phantom: '180,77,255', meteor: '255,100,0' }[b.kind];
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(${aura},${.15 + .08 * Math.sin(b.t * 4)})`; ctx.beginPath(); ctx.arc(b.x, b.y, 54, 0, 6.3); ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    if (b.kind === 'phantom') ctx.globalAlpha = .78 + .22 * Math.sin(b.t * 3);
    ctx.drawImage(this.S.boss, x, y, size, size);
    if (b.flash > 0 && Math.floor(b.flash * 30) % 2 === 0) ctx.drawImage(b.white, x, y, size, size);
    ctx.globalAlpha = 1;
    if (b.stun > 0 && !b.dying) for (let i = 0; i < 3; i++) { const a = b.t * 5 + i * 2.1; this.text(ctx, '✦', b.x + Math.cos(a) * 22, y + 4 + Math.sin(a) * 5, 8, '#ffe600', { shadow: null }); }
  };
})();
