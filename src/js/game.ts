// Core engine: loop, player physics, phases (intro → play → boss → win/dead), camera and cinematics.
(function () {
  const W = 280;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
  const RND = Math.random;
  const FONT = s => `900 ${s}px ui-monospace, "SF Mono", Menlo, monospace`;

  const STEP_PX = 9; // world px scrolled per walk frame (4 frames = one full stride)
  // Jump feel (see Game.jump): hop = HOP x full height; a press held for HOLD_WIN s commits to the full jump;
  // falling uses FALL x the rise gravity.
  const HOP = .6, HOLD_WIN = .1, FALL = 1.45;
  const CHIP = { pothole: .25, hump: .25 }; // damage sources that cost a fraction of a heart
  DR.JUMP = { HOP, HOLD_WIN, FALL };

  class Game {
    [key: string]: any;

    constructor(canvas, hooks) {
      this.c = canvas; this.ctx = canvas.getContext('2d'); this.hooks = hooks;
      this.keys = { jump: false, duck: false };
      this.paused = false; this.time = 0; this.last = performance.now();
      this.resize();
      window.addEventListener('resize', () => this.resize());
      requestAnimationFrame(t => this.frame(t));
    }

    resize() {
      const r = this.c.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
      this.c.width = Math.max(1, Math.round(r.width * dpr)); this.c.height = Math.max(1, Math.round(r.height * dpr));
      const oldGY = this.GY;
      this.W = W; this.H = Math.max(300, Math.round(W * r.height / Math.max(1, r.width)));
      this.k = this.c.width / W;
      this.GY = Math.round(Math.min(this.H * .64, this.H - 96));
      this.CY = this.GY - 150; this.SURF = 34;
      if (this.L) {
        const d = this.GY - oldGY;
        if (d && this.p) { this.p.y += d; for (const o of this.obs) o.y += d; for (const c of this.coins) c.y += d; if (this.boss) { this.boss.y += d; this.boss.ty += d; } }
        this.waterY = this.GY - (this.tideLevel || 0) * 46;
        this.rebuild();
      }
    }
    rebuild() {
      this.B = DR.Backgrounds.build(this.L, this.W, this.H, this.GY);
      const old = this.fx; this.fx = new DR.FX(this.W, this.H, this.GY);
      this.fx.setWeather(this.L.weather);
      if (old) { this.fx.parts = old.parts; this.fx.texts = old.texts; }
    }

    // ---------------- level lifecycle ----------------
    load(L, { demo = false, quick = false, dino = 'compy', up = null } = {}) {
      if (L.endless) L = DR.endlessLevel(0);
      this.L = L; this.demo = demo; this.dinoId = dino; this.S = DR.Sprites.forLevel(L, dino);
      const D = DR.DINOS.find(d => d.id === dino) || DR.DINOS[0];
      this.dino = D; this.st = Object.assign({}, DR.DINO_BASE, D.stats);
      // Power bars (the dino's starting bars + bought ones) on top of the species perk.
      // The demo stays stock so the title autopilot is stable.
      if (!demo) this.st = DR.applyBars(this.st, up || DR.baseBars(D.id));
      this.perks = { faller: this.st.fallerShield, lava: this.st.lavaShield, breaker: this.st.breaker };
      this.fx = null; this.rebuild();
      this.mode = L.mode === 'mix' ? 'run' : L.mode;
      this.mixIdx = 0; this.darkOn = !!L.dark; this.fallersOn = L.mode !== 'mix' && !!L.fallers;
      Object.assign(this, {
        dist: 0, scroll: 0, speed: demo ? L.speed[0] : 0, penalty: 1, hearts: this.st.hearts, maxHearts: this.st.hearts, score: 0, coinN: 0, coinsSpawned: 0, bank: 0,
        endless: !!L.endless, segIdx: 0, shieldN: 0, shieldHit: false, magnetT: 0, dblT: 0,
        closeN: 0, hits: 0, streak: 0, obs: [], coins: [], nextSpawn: L.speed[0] * 1.2, boss: null, bossDone: false,
        finishing: false, finish: null, banner: null, light: 0, lightT: 3 + Math.random() * 3, gustT: 7, gust: 0,
        shake: 0, hitstop: 0, slow: 1, zoom: demo ? 1 : 1.35, lb: demo ? 0 : 1, trail: [], runTime: 0, ceilA: L.mode === 'flip' ? 1 : 0,
        tidePhase: 'idle', tideT: 7 + Math.random() * 3, tideLevel: 0, tideHit: false, waterY: this.GY, laserFlip: false,
      });
      this.p = { x: demo ? 50 : -40, y: this.GY, vy: 0, g: 1, onGround: true, duck: false, inv: 0, coyote: 0, buf: 0, hold: 0, rot: 0, dead: false, air: this.st.air, airT: 0, dash: 0, dashCd: 0, jt: -1, y0: 0, cut: true, sq: 0 };
      this.phase = demo ? 'demo' : 'intro';
      this.phaseT = quick ? 1.8 : 0;
      this.paused = false; this.ended = false;
      DR.Audio.playMusic(L.music);
    }
    setPhase(ph) { this.phase = ph; this.phaseT = 0; }

    // ---------------- input ----------------
    press() {
      this.keys.jump = true;
      if (!this.live()) return;
      const p = this.p;
      // Double jump: only from a real mid-air press (not just before landing, which should buffer a normal jump).
      if (this.mode === 'run' && !p.onGround && p.coyote <= 0 && p.air > 0 && p.airT > .06 && this.GY - p.y > 24) {
        p.air--; p.vy = -this.jump().v0 * (this.st.airPow || .88); p.cut = true; p.jt = -1; p.sq = .7; p.buf = 0;
        DR.Audio.sfx('jump');
        this.fx.ring(p.x + 10, p.y - 2, this.L.palette.accent, 18, .3);
        this.fx.burst(p.x + 10, p.y - 2, 8, { color: [this.L.palette.accent, '#fff'], speed: 80, angle: Math.PI / 2, spread: 1.6, life: .3, grav: 0, size: 1.5, glow: true });
        return;
      }
      p.buf = this.st.buffer;
    }
    // Dash: a short, fast burst that phases through hazards. Cooldown depends on the shop level.
    dash() {
      const p = this.p, st = this.st;
      if (!st.dashLvl || !this.live() || this.demo || p.dash > 0 || p.dashCd > 0 || !['play', 'boss'].includes(this.phase)) return;
      p.dash = st.dashDur; p.dashCd = st.dashCd; p.inv = Math.max(p.inv, st.dashDur + .12);
      this.shake = Math.max(this.shake, 4); this.fx.doFlash(.18, this.L.palette.accent);
      this.fx.ring(p.x + 10, p.y - 9 * p.g, this.L.palette.accent, 26, .3);
      DR.Audio.sfx('shoot');
    }
    release() { this.keys.jump = false; }
    setDuck(on) { this.keys.duck = on; }
    live() { return ['play', 'boss', 'bossIntro', 'demo'].includes(this.phase) && !this.p.dead; }

    tryAction() {
      const p = this.p;
      if (this.mode === 'swim') {
        p.vy = Math.min(p.vy, -150); p.buf = 0; DR.Audio.sfx('swim');
        this.fx.burst(p.x + 4, p.y - 4, 3, { color: 'rgba(200,240,255,.8)', speed: 40, grav: -120, life: .6, size: 2 });
        return;
      }
      if (p.coyote <= 0) return;
      p.buf = 0; p.coyote = 0;
      if (this.mode === 'flip') {
        p.g = -p.g; p.vy = 80 * p.g; p.onGround = false; DR.Audio.sfx('flip');
        this.fx.burst(p.x + 10, p.y, 10, { color: [this.L.palette.accent, '#fff'], speed: 90, grav: 0, life: .35 });
        this.fx.ring(p.x + 10, p.y - 9 * p.g, this.L.palette.accent, 22, .3);
      } else {
        p.vy = -this.jump().v0; p.jt = 0; p.y0 = p.y; p.cut = false; p.sq = 1; p.onGround = false; DR.Audio.sfx('jump');
        this.fx.burst(p.x + 8, p.floor || this.GY, 6, { color: this.L.palette.groundDark, speed: 60, angle: -Math.PI / 2, spread: 2, life: .35, grav: 400 });
      }
    }

    // ---------------- main loop ----------------
    frame(now) {
      let dt = (now - this.last) / 1000; dt = Math.max(0, Math.min(.033, dt)); this.last = now;
      if (this.L && !this.paused) {
        this.time += dt;
        if (this.hitstop > 0) this.hitstop -= dt;
        else { this.slow += (1 - this.slow) * Math.min(1, dt * 2); this.update(dt * this.slow, dt); }
      }
      if (this.L) this.render();
      requestAnimationFrame(t => this.frame(t));
    }

    update(dt, realDt) {
      const L = this.L, p = this.p;
      this.phaseT += realDt;
      this.shake = Math.max(0, this.shake - realDt * 30);
      p.inv = Math.max(0, p.inv - dt);
      if (this.magnetT > 0) this.magnetT -= dt;
      if (this.dblT > 0) this.dblT -= dt;
      if (p.dash > 0) { p.dash = Math.max(0, p.dash - dt); p.inv = Math.max(p.inv, .12); } else if (p.dashCd > 0) p.dashCd = Math.max(0, p.dashCd - dt);
      const live = this.live();
      const targetLb = ['intro', 'bossIntro', 'win', 'dead'].includes(this.phase) ? 1 : 0;
      this.lb += (targetLb - this.lb) * Math.min(1, realDt * 4);

      // speed
      const prog = clamp(this.dist / L.goal, 0, 1);
      let target = lerp(L.speed[0] * this.st.speedMul, L.speed[1] * this.st.speedMul * this.st.maxSpeedMul, prog) * this.penalty;
      if (this.phase === 'intro') target = this.phaseT > 1.2 ? L.speed[0] * ease((this.phaseT - 1.2) / 2.3) : 0;
      if (this.phase === 'boss' || this.phase === 'bossIntro') target = L.speed[1] * .85;
      if (this.phase === 'dead') target = 0;
      if (p.dash > 0) target *= 1.7;
      this.speed += (target - this.speed) * Math.min(1, dt * (p.dash > 0 ? 14 : 2.5));
      this.penalty += (1 - this.penalty) * dt * this.st.penaltyRec;
      this.scroll += this.speed * dt;

      // phases
      switch (this.phase) {
        case 'demo': this.autopilot(); this.dist += this.speed * dt / 10; if (this.dist > L.goal * .9) this.dist = 0; this.spawnUpdate(dt); break;
        case 'intro': {
          this.zoom = lerp(1.35, 1, ease(this.phaseT / 2.4));
          p.x = lerp(-40, 50, ease((this.phaseT - .6) / 1.6));
          [2.0, 2.5, 3.0].forEach(t => { if (this.phaseT >= t && this.phaseT - realDt < t) DR.Audio.sfx('count'); });
          if (this.phaseT >= 3.5) { DR.Audio.sfx('go'); this.setPhase('play'); this.showBanner(L.twist.split('—')[0].trim(), L.twist.split('—')[1]?.trim() || '', L.palette.accent); }
          break;
        }
        case 'play': {
          this.runTime += dt;
          const dm = this.speed * dt / 10; this.dist += dm; this.score += dm * this.mult();
          if (L.mode === 'mix') this.mixUpdate(prog);
          if (this.endless) this.endlessUpdate();
          if (!this.finishing) {
            this.spawnUpdate(dt);
            if (this.dist >= L.goal && !L.endless) {
              this.finishing = true;
              if (L.boss) { this.setPhase('bossIntro'); }
              else this.finish = { x: this.W + 20 };
            }
          }
          if (this.finish) { this.finish.x -= this.speed * dt; if (this.finish.x < p.x + 10) this.win(); }
          break;
        }
        case 'bossIntro': this.bossIntroUpdate(dt); break;
        case 'boss': this.runTime += dt; this.score += this.speed * dt / 10 * this.mult(); this.bossUpdate(dt);
          if (this.finish) { this.finish.x -= this.speed * dt; if (this.finish.x < p.x + 10) this.win(); }
          break;
        case 'win': {
          this.zoom = lerp(this.zoom, 1.12, dt * 2);
          if (this.phaseT > .7) p.x += (60 + this.phaseT * 160) * dt;
          if (this.phaseT > 3 && !this.ended) this.end(true);
          break;
        }
        case 'dead': {
          p.rot += dt * 8; p.vy += 900 * dt; p.y += p.vy * dt; p.x -= 20 * dt;
          if (this.phaseT > 2 && !this.ended) this.end(false);
          break;
        }
      }

      if (this.phase !== 'dead') this.updatePlayer(dt);
      this.updateEntities(dt);
      if (this.boss) this.bossTick(dt);
      this.updateTwists(dt);
      this.fx.update(dt, this.speed);

      if (this.phase !== 'intro' && this.phase !== 'win') this.zoom += (1 - this.zoom) * Math.min(1, dt * 3);
      if (this.banner) { this.banner.t += realDt; if (this.banner.t > this.banner.dur) this.banner = null; }

      // afterimage trail at high combo
      // footfalls: a puff of dust each time a heel strikes (walk frames 0 and 2)
      const step = Math.floor(this.scroll / STEP_PX) % 4;
      if (step !== this.lastStep) {
        this.lastStep = step;
        if ((step === 0 || step === 2) && p.onGround && this.mode === 'run' && !p.dead && this.speed > 20 && p.x > -10) {
          const heavy = ['ankylo', 'stego', 'trike', 'brachio', 'trex', 'spino'].includes(this.dinoId);
          this.fx.burst(p.x + 15, (p.floor || this.GY) - 1, heavy ? 5 : 3, { color: this.L.palette.groundDark, speed: heavy ? 45 : 30, angle: -Math.PI * .85, spread: 1.2, life: .3, grav: 200, size: heavy ? 2 : 1.5 });
          if (heavy) this.shake = Math.max(this.shake, .8); // big dinos make the ground thud
        }
      }
      if (p.dash > 0 && live) this.fx.burst(p.x + 4, p.y - 9 * p.g, 2, { color: [this.L.palette.accent, '#fff'], speed: 60, angle: Math.PI, spread: .6, life: .25, grav: 0, size: 1.5, glow: true });
      if ((this.mult() >= 2 || p.dash > 0) && live) { this.trail.push({ x: p.x, y: p.y, a: .5 }); if (this.trail.length > 6) this.trail.shift(); }
      else if (this.trail.length) this.trail.shift();

      if (!this.demo) this.hooks.hud && this.hooks.hud(this.hudState());
    }

    // Jump model "two-step": a tap gives a short hop, holding past HOLD_WIN gives the full jump; never anything
    // in between. Tuned by height and time-to-apex; gravity and launch speed are derived from them.
    //   H     full-jump height (game px). Scales with jumpV², so +8 jumpV per Jump bar ≈ +2.7% height.
    //   T     time to apex. Longer `hold` stats (gliders) get a floatier, slower rise.
    jump() {
      const st = this.st, H = 120 * (st.jumpV / 600) ** 2, T = .34 * (1 + (st.hold - .2));
      return { H, hop: H * HOP, g: 2 * H / (T * T), v0: 2 * H / T };
    }
    // Physics runs in equal substeps of at most 1/240 s so arcs are the same at any frame rate.
    updatePlayer(dt) {
      const n = Math.max(1, Math.ceil(dt * 240)), h = dt / n;
      for (let i = 0; i < n; i++) this.stepPlayer(h);
      this.p.sq *= Math.max(0, 1 - dt * 9);
    }
    stepPlayer(dt) {
      const p = this.p, GY = this.GY;
      if (p.buf > 0) { p.buf -= dt; if (this.live()) this.tryAction(); }
      p.duck = false;
      if (this.mode === 'swim') {
        const thrust = this.keys.jump ? -this.st.swimThrust : 0, sink = this.keys.duck ? 1200 : 0;
        const base = this.keys.jump || this.keys.duck ? 560 : this.st.sinkIdle;
        p.vy = clamp(p.vy + (base + thrust + sink) * dt, -220, 260); p.y += p.vy * dt;
        p.onGround = false;
        if (p.y >= GY) { p.y = GY; p.vy = 0; p.onGround = true; }
        if (p.y - 18 < this.SURF) { p.y = this.SURF + 18; p.vy = Math.max(p.vy, 0); }
        p.rot += (clamp(p.vy / 500, -.5, .5) - p.rot) * Math.min(1, dt * 8);
        return;
      }
      p.rot += (0 - p.rot) * Math.min(1, dt * 10);
      if (this.mode === 'flip') {
        const was = p.onGround;
        p.vy += 2300 * p.g * dt; p.y += p.vy * dt; p.onGround = false;
        if (p.g > 0 && p.y >= GY) { p.y = GY; p.vy = 0; p.onGround = true; }
        if (p.g < 0 && p.y <= this.CY) { p.y = this.CY; p.vy = 0; p.onGround = true; }
        if (p.onGround) { p.coyote = .08; if (!was) this.land(); } else p.coyote -= dt;
        return;
      }
      // classic run physics
      const J = this.jump();
      if (p.jt >= 0) p.jt += dt;
      // released inside the hold window: trim the rise so the jump peaks at exactly the hop height
      if (!p.cut && !this.keys.jump && p.vy < 0) {
        const need = J.hop - (p.y0 - p.y);
        p.vy = need > 0 ? -Math.sqrt(2 * J.g * need) : 0; p.cut = true;
      }
      if (!p.cut && p.jt >= HOLD_WIN) p.cut = true; // held long enough: committed to the full jump
      let g = J.g;
      if (p.vy >= 0) g *= FALL;                                   // snappier fall than rise
      else if (this.keys.jump && p.vy > -70) g *= .6;             // brief hang at the top of a held jump
      if (this.keys.duck && !p.onGround) g = J.g * this.st.fall;  // fast drop
      const prevY = p.y;
      p.vy += g * dt; p.y += p.vy * dt;
      const pit = this.pitUnder(p.x + 10);
      const was = p.onGround;
      p.floor = GY;
      if (p.y >= GY && !pit) { p.y = GY; p.vy = 0; p.onGround = true; if (!was) { p.sq = -1; this.land(); } }
      else if (p.y > GY && pit) {
        p.onGround = false;
        if (p.y > GY + 8 && this.perks.lava > 0 && p.inv <= 0 && !this.demo) { this.perks.lava--; p.vy = -720; p.y = GY + 8; this.perkFx('HOT HOP!', '#ff8a00'); }
        else if (p.y > GY + 8) { this.damage('lava'); p.vy = -720; p.y = GY + 8; this.fx.burst(p.x + 10, GY, 18, { color: ['#ff4a00', '#ffd000', '#ff8a00'], speed: 160, life: .6, glow: true }); }
      } else p.onGround = false;
      // Tidal Shore shelves and Indiranagar lorries are standable — land on top, ride it, drop off the end.
      if ((this.L.tide || this.L.traffic) && p.vy >= 0 && !p.onGround) {
        const px = p.x + 10;
        for (const o of this.obs) {
          if (!(o.kind === 'plat' || o.roof) || px < o.x + 1 || px > o.x + o.w - 1) continue;
          if (prevY <= o.y + 2 && p.y >= o.y) {
            p.y = o.y; p.vy = 0; p.onGround = true; p.floor = o.y;
            if (!was) { p.sq = -1; this.land(); }
            break;
          }
        }
      }
      if (p.onGround) { p.coyote = this.st.coyote; p.duck = this.keys.duck; p.air = this.st.air; p.airT = 0; p.jt = -1; p.cut = true; } else { p.coyote -= dt; p.airT += dt; }
    }
    land() {
      const p = this.p;
      if (this.mode === 'flip') { this.fx.burst(p.x + 10, p.y, 5, { color: '#fff', speed: 50, grav: 0, life: .25, size: 1 }); return; }
      this.fx.burst(p.x + 10, p.floor || this.GY, 4, { color: this.L.palette.groundDark, speed: 50, angle: -Math.PI / 2, spread: 2.5, life: .3 });
    }

    playerBox() {
      const p = this.p;
      if (this.mode === 'flip' && p.g < 0) return { x: p.x + 4, y: p.y + 1, w: 12, h: 17 };
      if (p.duck) return { x: p.x + 3, y: p.y - 9, w: 21, h: 9 };
      return { x: p.x + 4, y: p.y - 18, w: 12, h: 17 };
    }
    mult() { return (1 + Math.min(6, Math.floor(this.streak / this.st.comboDiv)) * .5) * (this.dblT > 0 ? 2 : 1); }
    // A species perk saved the run: callout + sparkle.
    perkFx(text, color) {
      const p = this.p;
      this.fx.text(p.x + 10, p.y - 30 * p.g, text, color, 10, 1.1);
      this.fx.burst(p.x + 10, p.y - 10 * p.g, 16, { color: [color, '#fff'], speed: 140, life: .5, glow: true });
      this.fx.ring(p.x + 10, p.y - 10 * p.g, color, 30, .35); this.shake = Math.max(this.shake, 5); this.hitstop = .06;
      DR.Audio.sfx('orb');
    }

    damage(src) {
      const p = this.p, chip = CHIP[src]; // road hazards only chip off part of a heart
      if (p.inv > 0 || p.dead || this.demo || this.phase === 'win' || this.phase === 'intro') return false;
      if (this.shieldN > 0) {
        this.shieldN--; this.shieldHit = true; p.inv = .8;
        this.fx.ring(p.x + 10, p.y - 10 * p.g, '#7df9ff', 26, .35);
        this.fx.text(p.x + 10, p.y - 30 * p.g, 'BLOCKED!', '#7df9ff', 9);
        this.shake = Math.max(this.shake, 3); DR.Audio.sfx('close');
        return false;
      }
      this.hits++; this.streak = 0;
      if (chip) {
        this.hearts = Math.max(0, this.hearts - chip); p.inv = Math.min(.35, this.st.inv);
        this.hitstop = .03; this.shake = 4; this.penalty = .9;
        this.fx.text(p.x + 10, p.y - 30 * p.g, '-¼♥', '#ff8a9a', 8);
        DR.Audio.sfx('bump');
      } else {
        this.hearts = Math.max(0, this.hearts - 1); p.inv = this.st.inv;
        this.hitstop = .09; this.shake = 9; this.penalty = .8;
        this.fx.doFlash(.45, '#ff2040');
        this.fx.burst(p.x + 10, p.y - 10 * p.g, 16, { color: [this.L.palette.dino, '#fff', '#ff3b5c'], speed: 160, life: .6 });
        DR.Audio.sfx('hit');
      }
      this.hooks.hurt && this.hooks.hurt(Math.floor(this.hearts));
      if (this.hearts <= 0) this.die();
      return true;
    }
    die() {
      const p = this.p; p.dead = true; p.vy = -380; this.slow = .35; this.hitstop = .25; this.shake = 14;
      DR.Audio.stopMusic(.3); DR.Audio.sfx('death');
      this.fx.doFlash(.9, '#fff');
      this.setPhase('dead');
    }
    win() {
      if (this.phase === 'win') return;
      this.setPhase('win'); this.slow = .5;
      DR.Audio.stopMusic(.6); DR.Audio.sfx('win');
      this.fx.doFlash(.6, '#fff');
      if (this.finish && this.finish.gate) this.fx.burst(this.finish.x, this.mode === 'flip' ? (this.GY + this.CY) / 2 : this.GY - 34, 50, { color: ['#7df9ff', '#bfe9ff', '#fff', this.L.palette.accent2], speed: 140, grav: 0, life: .9, glow: true });
      for (let i = 0; i < 4; i++) setTimeout(() => this.fx && this.fx.burst(this.W * (.2 + Math.random() * .6), this.H * (.15 + Math.random() * .25), 40, { color: ['#ffcf4a', '#ff6b3d', '#7df9ff', '#fff', '#ff6bd6'], speed: 160, grav: 120, life: 1.4, glow: true }), i * 260);
    }
    end(won) {
      this.ended = true;
      const stars = won ? 1 + (this.coinsSpawned === 0 || this.coinN >= this.coinsSpawned * .7 ? 1 : 0) + (this.hits === 0 ? 1 : 0) : 0;
      this.hooks.end && this.hooks.end({ won, endless: !!this.endless, level: this.L.id, score: Math.round(this.score), coins: this.coinN, coinsTotal: this.coinsSpawned, bank: Math.round(this.bank), close: this.closeN, hits: this.hits, time: this.runTime, dist: Math.round(this.dist), stars });
    }
    hudState() {
      return { dash: this.st.dashLvl ? { cd: this.p.dashCd, max: this.st.dashCd, on: this.p.dash > 0 } : null, hearts: this.hearts, maxHearts: this.maxHearts, score: Math.round(this.score), coins: this.coinN, prog: clamp(this.dist / this.L.goal, 0, 1), mult: this.mult(),
        boss: this.boss && !this.boss.gone ? { name: this.boss.name, hp: this.boss.hp, max: this.boss.max } : null, phase: this.phase,
        endless: !!this.endless, boosts: { shield: this.shieldN, magnet: this.magnetT, dbl: this.dblT } };
    }
    // Endless: when the run crosses into a new stretch, swap the scenery (not the rules).
    endlessUpdate() {
      const idx = Math.floor(this.dist / DR.ENDLESS_SEG);
      if (idx === this.segIdx) return;
      this.segIdx = idx;
      const L = DR.endlessLevel(idx);
      this.L = L; this.S = DR.Sprites.forLevel(L, this.dinoId);
      this.darkOn = !!L.dark; this.fallersOn = !!L.fallers;
      this.rebuild();
      DR.Audio.playMusic(L.music);
      this.showBanner(L.name, L.twist.split('—')[1]?.trim() || L.tagline, L.palette.accent, 1.8);
    }
    showBanner(title, sub, color, dur = 2.6) { this.banner = { title, sub, color, t: 0, dur }; }

    // Final world: swap rules every fifth of the run.
    mixUpdate(prog) {
      const i = Math.min(DR.MIX_PHASES.length - 1, Math.floor(prog * DR.MIX_PHASES.length));
      if (i === this.mixIdx) return;
      this.mixIdx = i; const ph = DR.MIX_PHASES[i];
      const prev = this.mode; this.mode = ph.mode; this.darkOn = !!ph.dark; this.fallersOn = !!ph.fallers;
      if (prev === 'flip' && this.p.g < 0) { this.p.g = 1; this.p.vy = 0; }
      if (prev === 'swim') this.p.vy = 0;
      this.obs = this.obs.filter(o => o.x < this.p.x - 30); this.nextSpawn = this.speed * 1.1;
      this.fx.glitch = .6; this.fx.doFlash(.5, '#ff2a6d'); this.shake = 6; DR.Audio.sfx('glitch');
      this.showBanner('⚠ ' + ph.label, { flip: 'TAP TO FLIP GRAVITY', swim: 'HOLD TO SWIM', run: ph.dark ? 'LIGHTNING IS YOUR FRIEND' : 'WATCH THE SKY' }[ph.mode], '#ff2a6d');
    }

    updateTwists(dt) {
      const L = this.L;
      if (L.tide && this.phase === 'play') this.tideUpdate(dt);
      this.ceilA += ((this.mode === 'flip' ? 1 : 0) - this.ceilA) * Math.min(1, dt * 4);
      // lightning in the dark
      if (this.darkOn && this.phase !== 'intro') {
        this.lightT -= dt; this.light = Math.max(0, this.light - dt * 1.6);
        if (this.lightT <= 0) {
          this.lightT = 3.5 + Math.random() * 4; this.light = 1; this.fx.doFlash(.55, '#e8e4ff');
          setTimeout(() => DR.Audio.sfx('thunder'), 250);
        }
      }
      // blizzard gusts
      if (L.gusts && this.phase === 'play') {
        this.gustT -= dt;
        if (this.gustT <= 0) { this.gustT = 8 + Math.random() * 5; this.gust = 2.6; this.showBanner('BLIZZARD!', 'visibility dropping', '#c9f0ff', 1.6); }
        this.gust = Math.max(0, this.gust - dt);
        this.fx.wind = this.gust > 0 ? -60 : 0;
      }
    }

    // Tidal Shore: a surge floods the beach; only the raised shelf stays dry.
    tideUpdate(dt) {
      const P = this.L.palette, p = this.p;
      if (this.tidePhase === 'idle') {
        this.tideT -= dt;
        if (this.tideT <= 0) {
          this.tidePhase = 'warn'; this.tideT = 1.6; this.tideHit = false;
          this.showBanner('⚠ TSUNAMI', 'GET TO HIGH GROUND', P.accent, 1.6);
          DR.Audio.sfx('wave'); this.shake = Math.max(this.shake, 3);
          const px = p.x + this.speed * 1.9; // reaches the player shortly after the rise starts
          this.obs = this.obs.filter(o => o.x + (o.w || 0) < px - 70 || o.x > px + 620);
          this.addPlat(px);
          this.nextSpawn = Math.max(this.nextSpawn, this.speed * 2.2);
        }
      } else if (this.tidePhase === 'warn') {
        this.tideT -= dt;
        if (this.tideT <= 0) { this.tidePhase = 'rise'; this.tideT = .9; }
      } else if (this.tidePhase === 'rise') {
        this.tideT -= dt; this.tideLevel = 1 - Math.max(0, this.tideT) / .9;
        if (this.tideT <= 0) { this.tidePhase = 'hold'; this.tideT = .7; this.tideLevel = 1; }
      } else if (this.tidePhase === 'hold') {
        this.tideT -= dt;
        if (this.tideT <= 0) { this.tidePhase = 'fall'; this.tideT = 1.2; }
      } else if (this.tidePhase === 'fall') {
        this.tideT -= dt; this.tideLevel = Math.max(0, this.tideT) / 1.2;
        if (this.tideT <= 0) {
          this.tidePhase = 'idle'; this.tideT = 7 + Math.random() * 4; this.tideLevel = 0;
          this.nextSpawn = this.speed * 1.2;
        }
      }
      this.tideLevel = clamp(this.tideLevel, 0, 1);
      this.waterY = this.GY - this.tideLevel * 46;
      // only once the water is genuinely deep — early rise is just a warning
      if (this.tideLevel > .55 && !this.tideHit && p.y > this.waterY + 2 && !this.demo) {
        if (this.damage('tide')) {
          this.tideHit = true;
          this.fx.burst(p.x + 10, this.waterY, 28, { color: ['#bfefff', '#7df9ff', '#ffffff'], speed: 175, angle: -Math.PI / 2, spread: 2.2, life: .7, glow: true });
          this.fx.doFlash(.35, '#7df9ff');
        }
      }
      if (this.tideLevel > .3 && RND() < .4) this.fx.burst(this.W + 10, this.waterY + RND() * 6, 1, { color: ['#bfefff', '#fff'], speed: 70, angle: Math.PI, spread: .5, grav: 140, life: .6, size: 2, glow: true });
    }
    drawTide(ctx) {
      const lvl = this.tideLevel || 0;
      if (lvl <= .01) return;
      const wy = this.waterY, W = this.W, H = this.H;
      const g = ctx.createLinearGradient(0, wy, 0, H);
      g.addColorStop(0, 'rgba(110,225,235,.45)');
      g.addColorStop(.45, 'rgba(30,140,180,.5)');
      g.addColorStop(1, 'rgba(4,32,64,.72)');
      ctx.fillStyle = g; ctx.fillRect(-20, wy, W + 40, H - wy + 20);
      ctx.globalCompositeOperation = 'lighter';
      for (let x = -16; x < W + 16; x += 3) {
        const hh = 2 + Math.sin(x * .18 + this.time * 7) * 1.6;
        ctx.fillStyle = 'rgba(225,255,255,.75)';
        ctx.fillRect(x, wy - hh + Math.sin(x * .5 + this.time * 4), 2, hh);
      }
      ctx.fillStyle = 'rgba(0,120,190,.12)'; ctx.fillRect(-20, wy, W + 40, H - wy + 20);
      ctx.globalCompositeOperation = 'source-over';
    }

    // Title-screen autopilot.
    autopilot() {
      const p = this.p, look = this.speed * .2 + 14;
      this.keys.duck = false;
      for (const o of this.obs) {
        if (o.kind === 'coin') continue;
        const b = this.hitbox(o); if (!b) continue;
        const dx = b.x - (p.x + 16);
        if (dx < -b.w || dx > look + (o.vx || 0) * .2) continue;
        const bottom = b.y + b.h;
        if (bottom > this.GY - 9 && p.onGround) { this.press(); setTimeout(() => this.release(), b.w > 30 ? 220 : 120); }
        else if (bottom > this.GY - 24 && bottom <= this.GY - 9) this.keys.duck = true;
      }
      for (const pit of this.obs.filter(o => o.kind === 'pit')) { const dx = pit.x - (p.x + 14); if (dx > 0 && dx < 18 && p.onGround) this.press(); }
    }

    // ---------------- rendering ----------------
    render() {
      const ctx = this.ctx, W = this.W, H = this.H, GY = this.GY, L = this.L, p = this.p;
      ctx.setTransform(this.k, 0, 0, this.k, 0, 0); ctx.imageSmoothingEnabled = false;
      ctx.clearRect(0, 0, W, H);
      ctx.save();
      // camera: zoom around the dino, plus shake
      const sx = (Math.random() - .5) * this.shake, sy = (Math.random() - .5) * this.shake;
      const fx = clamp(p.x + 10, 0, W), fy = this.mode === 'flip' ? (GY + this.CY) / 2 : GY - 30;
      ctx.translate(fx + sx, fy + sy); ctx.scale(this.zoom, this.zoom); ctx.translate(-fx, -fy);

      DR.Backgrounds.draw(ctx, this.B, this.scroll, this.time);
      if (this.mode === 'swim' || (L.mode === 'swim')) { ctx.fillStyle = 'rgba(0,30,80,.18)'; ctx.fillRect(0, 0, W, H); }
      DR.Backgrounds.drawGround(ctx, this.B, this.scroll, this.time);
      if (this.ceilA > .01) this.drawCeiling(ctx);
      this.drawPits(ctx);
      this.drawEntities(ctx);
      if (this.finish) this.drawFinish(ctx);
      if (this.boss) this.drawBoss(ctx);
      this.drawPlayer(ctx);
      if (this.L.tide) this.drawTide(ctx);
      this.fx.drawParts(ctx);
      ctx.font = '7px monospace'; this.fx.drawWeather(ctx, this.time);
      if (this.gust > 0) { ctx.fillStyle = `rgba(230,245,255,${Math.min(.55, this.gust * .4) * Math.min(1, (2.6 - this.gust) * 3)})`; ctx.fillRect(-20, -20, W + 40, H + 40); }
      if (this.darkOn) {
        const lights = [{ x: p.x + 10, y: p.y - 10, r: 50 + this.st.light }, { x: p.x + 60, y: p.y - 12, r: 80 + this.st.light }];
        for (const o of this.obs) if (o.glow) lights.push({ x: o.x + (o.w || 0) / 2, y: o.y + (o.h || 0) / 2, r: o.glow });
        if (this.boss && !this.boss.gone) lights.push({ x: this.boss.x, y: this.boss.y, r: 70 });
        this.fx.drawDark(ctx, .88 * (1 - this.light), lights);
      }
      this.fx.drawTexts(ctx);
      ctx.restore();

      this.fx.post(ctx, L.palette.grade, L.retro ? .1 : 1);
      if (this.fx.glitch > 0) this.drawGlitch(ctx);
      if (this.phase === 'bossIntro') this.drawBossWarning(ctx);
      this.drawLetterbox(ctx);
      if (this.phase === 'intro') this.drawIntro(ctx);
      if (this.banner) this.drawBanner(ctx);
      if (this.phase === 'win') this.drawWinCard(ctx);
    }

    drawPlayer(ctx) {
      const p = this.p, S = this.S;
      if (p.x < -30 || p.x > this.W + 30) return;
      const flipped = this.mode === 'flip' && p.g < 0;
      // shadow
      if (this.mode !== 'swim' && !flipped && !p.dead) {
        const fy = p.floor || this.GY;
        const h = clamp((fy - p.y) / 80, 0, 1);
        ctx.fillStyle = `rgba(0,0,0,${.28 * (1 - h)})`; ctx.fillRect(p.x + 4 + h * 3, fy - 1, 14 - h * 6, 2);
      }
      // Walk cycle advances with distance scrolled, so legs keep pace with the ground.
      const nFrames = S.dino.run.length, runFrame = ((Math.floor(this.scroll / STEP_PX) % nFrames) + nFrames) % nFrames;
      let img;
      if (p.dead) img = this.L.retro ? S.dino.stand : S.dinoHurt.stand;
      else if (p.duck) img = S.dino.duck[runFrame];
      else if (!p.onGround && this.mode !== 'flip') img = S.dino.jump;
      else if (this.speed < 5 && this.phase !== 'intro') img = S.dino.stand;
      else img = S.dino.run[runFrame];
      // afterimages
      const ax = img.ax || 0, ay = img.ay || 0;
      for (let i = 0; i < this.trail.length; i++) { const t = this.trail[i]; ctx.globalAlpha = .08 * i; ctx.drawImage(img, t.x - ax - (this.trail.length - i) * 3, flipped ? t.y - ay : t.y - img.height + ay); }
      ctx.globalAlpha = 1;
      if (p.inv > 0 && !(p.dash > 0) && !this.L.retro && Math.floor(p.inv * 14) % 2 === 0 && !p.dead) img = p.duck ? S.dinoHurt.duck[runFrame] : !p.onGround && this.mode !== 'flip' ? S.dinoHurt.jump : S.dinoHurt.run[runFrame];
      ctx.save();
      const cx = p.x - (img.ax || 0) + img.width / 2, cy = flipped ? p.y + img.height / 2 - (img.ay || 0) : p.y - img.height / 2 + (img.ay || 0);
      if (p.dash > 0) ctx.globalAlpha = .7 + .3 * Math.sin(this.time * 60);
      // On the paper-white world a white hurt flash would vanish, so blink the dino instead
      // and give pale species a soft dark edge so they read against the sky.
      if (this.L.retro && p.inv > 0 && Math.floor(p.inv * 14) % 2 === 0 && !p.dead) ctx.globalAlpha = .3;
      if (this.L.retro) { ctx.shadowColor = 'rgba(70,70,70,.45)'; ctx.shadowBlur = 2; ctx.shadowOffsetY = 1; }
      ctx.translate(Math.round(cx), Math.round(cy));
      if (p.rot) ctx.rotate(p.rot);
      // squash & stretch: sq > 0 stretches (take-off), sq < 0 squashes (landing); scaled about the feet
      if (Math.abs(p.sq) > .02 && !flipped && this.mode !== 'swim') {
        const sy = 1 + .12 * p.sq, sx = 1 - .1 * p.sq, foot = img.height / 2;
        ctx.translate(0, foot); ctx.scale(sx, sy); ctx.translate(0, -foot);
      }
      if (flipped) ctx.scale(1, -1);
      ctx.drawImage(img, -Math.round(img.width / 2), -Math.round(img.height / 2));
      ctx.restore();
    }

    drawCeiling(ctx) {
      const W = this.W, CY = this.CY, a = this.ceilA;
      ctx.save(); ctx.translate(0, -(1 - a) * (CY + 10));
      const P = this.L.palette, x = -(this.scroll % 24);
      ctx.fillStyle = P.groundDark; ctx.fillRect(0, CY - 16, W, 16);
      ctx.fillStyle = P.ground; for (let i = x; i < W; i += 24) { ctx.fillRect(i, CY - 12, 22, 8); ctx.fillRect(i + 10, CY - 22, 2, 6); }
      ctx.fillStyle = P.accent; for (let i = x; i < W; i += 48) ctx.fillRect(i + 4, CY - 9, 3, 1);
      ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(0, CY - 17, W, 1);
      ctx.fillStyle = this.L.palette.line; ctx.fillRect(0, CY - 2, W, 2);
      ctx.restore();
    }
    drawFinish(ctx) {
      const x = Math.round(this.finish.x), flip = this.mode === 'flip', P = this.L.palette, t = this.time;
      const R = (c, a, b, w, h) => { ctx.fillStyle = c; ctx.fillRect(Math.round(a), Math.round(b), w, h); };
      const glow = (x0, w, y0, y1, a) => {
        ctx.globalCompositeOperation = 'lighter';
        const gr = ctx.createLinearGradient(x0, 0, x0 + w, 0);
        gr.addColorStop(0, 'rgba(255,220,120,0)'); gr.addColorStop(.5, `rgba(255,220,120,${a})`); gr.addColorStop(1, 'rgba(255,220,120,0)');
        ctx.fillStyle = gr; ctx.fillRect(x0, y0, w, y1 - y0); ctx.globalCompositeOperation = 'source-over';
      };
      if (this.finish.gate) {
        // Boss worlds end at a lab warp gate: steel ring on a plinth, swirling energy inside, sparks drifting up.
        const base = this.GY, rh = 30, rw = 19, cy = flip ? (this.GY + this.CY) / 2 : base - rh - 4;
        ctx.globalCompositeOperation = 'lighter';
        const rg = ctx.createRadialGradient(x, cy, 2, x, cy, rh + 8);
        rg.addColorStop(0, 'rgba(190,240,255,.45)'); rg.addColorStop(.5, 'rgba(70,140,255,.22)'); rg.addColorStop(1, 'rgba(90,120,255,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(x, cy, rw + 8, rh + 8, 0, 0, Math.PI * 2); ctx.fill();
        for (let i = 0; i < 90; i++) {
          const k = i / 90, a = k * Math.PI * 6 + t * 3, r = 1 - k * .85;
          R(i % 3 ? 'rgba(110,220,255,.55)' : P.accent2, x + Math.cos(a) * rw * .86 * r - 1, cy + Math.sin(a) * rh * .9 * r - 1, 2, 2);
        }
        ctx.globalCompositeOperation = 'source-over';
        ctx.lineWidth = 4; ctx.strokeStyle = '#4a5068'; ctx.beginPath(); ctx.ellipse(x, cy, rw + 2, rh + 2, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2; ctx.strokeStyle = '#8f97b3'; ctx.beginPath(); ctx.ellipse(x, cy, rw + 2, rh + 2, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1; ctx.strokeStyle = '#dfe5f5'; ctx.beginPath(); ctx.ellipse(x - 1, cy - 1, rw + 2, rh + 2, 0, Math.PI * .7, Math.PI * 1.35); ctx.stroke();
        for (let i = 0; i < 8; i++) {
          const a = i / 8 * Math.PI * 2, on = (Math.floor(t * 6) + i) % 4 === 0;
          R(on ? '#fff6c8' : P.accent, x + Math.cos(a) * (rw + 2) - 1.5, cy + Math.sin(a) * (rh + 2) - 1.5, 3, 3);
        }
        if (!flip) { R('#2e2a40', x - 16, base - 4, 32, 4); R('#4a4466', x - 14, base - 5, 28, 2); R(P.accent, x - 14, base - 5, 28, 1); }
        for (let i = 0; i < 8; i++) R('rgba(160,240,255,.9)', x - 12 + (i * 7) % 24, cy + rh - ((t * 28 + i * 11) % (rh * 2 + 10)), 1, 1);
        return;
      }
      // Grand pennant: gold-capped pole, rippling cloth-shaded checker flag, plinth and a soft light column.
      const top = flip ? this.CY : this.GY - 76, foot = this.GY;
      glow(x - 18, 40, flip ? this.CY : 0, foot, .2);
      R('#7c7c94', x, top, 3, foot - top); R('#dcdcec', x, top, 1, foot - top); R('#45455c', x + 2, top, 1, foot - top);
      R(P.accent, x - 2, top - 5, 7, 5); R('#fff6c8', x - 1, top - 5, 3, 1); R('rgba(0,0,0,.35)', x - 2, top - 1, 7, 1);
      const cols = 10, rows = 6, sz = 4, fy = top + 2;
      for (let c = 0; c < cols; c++) {
        const ph = t * 6 - c * .7, off = Math.sin(ph) * 3 * (c / cols), lit = Math.sin(ph + 1.2) * .5 + .5;
        for (let r = 0; r < rows; r++) {
          const dark = (r + c) % 2, v = dark ? 18 + lit * 26 : 190 + lit * 65;
          R(`rgb(${v | 0},${v | 0},${(v + (dark ? 12 : 0)) | 0})`, x + 3 + c * sz, fy + r * sz + off, sz, sz);
        }
      }
      if (!flip) { R('#3a3152', x - 6, foot - 6, 15, 6); R(P.accent, x - 6, foot - 6, 15, 1); R('rgba(0,0,0,.35)', x - 6, foot - 1, 15, 1); }
      for (let i = 0; i < 6; i++) R('rgba(255,240,180,.85)', x - 10 + (i * 7) % 24, foot - ((t * 22 + i * 13) % (foot - top)), 1, 1);
    }

    // ---------- screen-space overlays ----------
    drawLetterbox(ctx) {
      if (this.lb < .01) return;
      const h = this.H * .085 * this.lb;
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, this.W, h); ctx.fillRect(0, this.H - h, this.W, h);
    }
    text(ctx, s, x, y, size, color, { align = 'center', shadow = '#000', alpha = 1, spacing = 0 } = {}) {
      ctx.globalAlpha = alpha; ctx.font = FONT(size); ctx.textAlign = align; ctx.textBaseline = 'middle';
      if (spacing && ctx.letterSpacing !== undefined) ctx.letterSpacing = spacing + 'px';
      if (shadow) { ctx.fillStyle = shadow; ctx.fillText(s, x + size * .07, y + size * .09); }
      ctx.fillStyle = color; ctx.fillText(s, x, y);
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
      ctx.globalAlpha = 1;
    }
    drawIntro(ctx) {
      const t = this.phaseT, W = this.W, H = this.H, L = this.L, P = L.palette;
      // On the paper-white retro world the cinematic copy has to go dark.
      const ink = L.retro ? '#535353' : '#fff', dim = L.retro ? 'rgba(83,83,83,.75)' : 'rgba(255,255,255,.85)';
      if (t < 2.1) {
        const a = clamp(t / .4, 0, 1) * clamp((2.1 - t) / .35, 0, 1);
        const slide = (1 - ease(t / .6)) * 40;
        this.text(ctx, `WORLD ${L.id}`, W / 2 - slide, H * .27, 9, P.accent, { alpha: a, spacing: 4 });
        const shown = L.name.slice(0, Math.floor(clamp((t - .15) / .5, 0, 1) * L.name.length));
        this.text(ctx, shown, W / 2, H * .27 + 22, 26, ink, { alpha: a, spacing: 1 });
        ctx.globalAlpha = a; ctx.fillStyle = P.accent; const lw = ease((t - .3) / .6) * 150; ctx.fillRect(W / 2 - lw / 2, H * .27 + 40, lw, 2); ctx.globalAlpha = 1;
        this.text(ctx, L.tagline, W / 2 + slide, H * .27 + 54, 8, dim, { alpha: a });
        if (L.boss) this.text(ctx, '☠ BOSS AHEAD ☠', W / 2, H * .27 + 72, 8, '#ff5470', { alpha: a * (.6 + .4 * Math.sin(t * 8)) });
        this.text(ctx, `PLAYING AS ${this.dino.short}`, W / 2, H * .27 + (L.boss ? 88 : 74), 7, dim, { alpha: a * .8, spacing: 2 });
      }
      const n = t < 2.0 ? null : t < 2.5 ? '3' : t < 3.0 ? '2' : t < 3.5 ? '1' : null;
      if (n) { const k = ((t - 2) % .5) / .5; this.text(ctx, n, W / 2, H * .36, 54 * (1.6 - ease(k) * .6), ink, { alpha: 1 - k * .7, shadow: P.accent2 }); }
    }
    drawBanner(ctx) {
      const b = this.banner, W = this.W, y = this.H * .3;
      const inT = ease(b.t / .3), outT = ease((b.t - b.dur + .3) / .3);
      const x = (1 - inT) * -W + outT * W;
      ctx.save(); ctx.translate(x, 0);
      ctx.fillStyle = this.L.retro ? 'rgba(247,247,247,.94)' : 'rgba(0,0,0,.62)'; ctx.fillRect(0, y - 16, W, b.sub ? 36 : 26);
      ctx.fillStyle = b.color; ctx.fillRect(0, y - 16, W, 2); ctx.fillRect(0, y + (b.sub ? 18 : 8), W, 2);
      this.text(ctx, b.title, W / 2, y - 3, 13, b.color, { spacing: 2 });
      if (b.sub) this.text(ctx, b.sub.toUpperCase(), W / 2, y + 11, 7, this.L.retro ? '#6b6b6b' : '#fff', { spacing: 1 });
      ctx.restore();
    }
    drawBossWarning(ctx) {
      const t = this.phaseT, W = this.W, H = this.H;
      ctx.fillStyle = `rgba(255,0,40,${.12 + .1 * Math.sin(t * 10)})`; ctx.fillRect(0, 0, W, H);
      const y1 = H * .2, off = (t * 60) % 20;
      for (const yy of [y1 - 22, y1 + 30]) {
        ctx.fillStyle = '#000'; ctx.fillRect(0, yy, W, 8);
        ctx.fillStyle = '#ffcf00'; for (let x = -20 + off; x < W + 20; x += 20) { ctx.beginPath(); ctx.moveTo(x, yy); ctx.lineTo(x + 10, yy); ctx.lineTo(x + 4, yy + 8); ctx.lineTo(x - 6, yy + 8); ctx.fill(); }
      }
      if (Math.floor(t * 4) % 2 === 0 || t > 1.6) this.text(ctx, '⚠ WARNING ⚠', W / 2, y1, 18, '#ff3050', { spacing: 3 });
      if (t > 1.2) this.text(ctx, this.L.boss.name, W / 2, y1 + 18, 10, '#fff', { alpha: clamp((t - 1.2) * 3, 0, 1), spacing: 2 });
    }
    drawWinCard(ctx) {
      const t = this.phaseT; if (t < .3 || this.ended) return;
      const k = ease((t - .3) / .4);
      this.text(ctx, this.boss ? 'BOSS DEFEATED!' : 'WORLD CLEAR!', this.W / 2, this.H * .3, 22 * (2 - k), this.L.palette.accent, { alpha: k, spacing: 2 });
    }
    drawGlitch(ctx) {
      const g = this.fx.glitch, W = this.W, H = this.H;
      for (let i = 0; i < 6; i++) {
        const y = Math.random() * H | 0, h = 2 + Math.random() * 10 | 0, dx = (Math.random() - .5) * 30 * g;
        ctx.drawImage(this.c, 0, y * this.k, this.c.width, h * this.k, dx, y, W, h);
      }
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(255,0,80,${.15 * g})`; ctx.fillRect(2, 0, W, H); ctx.fillStyle = `rgba(0,240,255,${.12 * g})`; ctx.fillRect(-2, 0, W, H); ctx.globalCompositeOperation = 'source-over';
    }
  }

  DR.Game = Game;
  DR.util = { clamp, lerp, ease };
})();
