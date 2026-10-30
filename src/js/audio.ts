// Procedural chiptune music + SFX via Web Audio. No assets, works fully offline.
(function () {
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let muted = localStorage.getItem('dr_muted') === '1';
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);

  function init() {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.ratio.value = 4;
    master = ctx.createGain(); master.gain.value = muted ? 0 : .8;
    musicBus = ctx.createGain(); musicBus.gain.value = .32;
    sfxBus = ctx.createGain(); sfxBus.gain.value = .55;
    musicBus.connect(master); sfxBus.connect(master); master.connect(comp); comp.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(bus, t, freq, dur, { type = 'square', vol = .2, attack = .005, slide = 0, filter = 0 } = {}) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq * slide), t + dur);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + attack);
    g.gain.exponentialRampToValueAtTime(.0001, t + dur);
    let node = o;
    if (filter) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = filter; o.connect(f); node = f; }
    node.connect(g); g.connect(bus); o.start(t); o.stop(t + dur + .02);
  }
  function noise(bus, t, dur, { vol = .2, hp = 0, lp = 0, decay = true } = {}) {
    const s = ctx.createBufferSource(), g = ctx.createGain(); s.buffer = noiseBuf;
    let node = s;
    if (hp) { const f = ctx.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = hp; node.connect(f); node = f; }
    if (lp) { const f = ctx.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = lp; node.connect(f); node = f; }
    g.gain.setValueAtTime(vol, t);
    if (decay) g.gain.exponentialRampToValueAtTime(.0001, t + dur); else g.gain.setValueAtTime(0, t + dur);
    node.connect(g); g.connect(bus); s.start(t); s.stop(t + dur + .02);
  }
  function kick(t, vol = .9) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(40, t + .12);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(.001, t + .18);
    o.connect(g); g.connect(musicBus); o.start(t); o.stop(t + .2);
  }

  // ---------------- Music ----------------
  const SCALES = {
    major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10],
    phrygian: [0, 1, 3, 5, 7, 8, 10], lydian: [0, 2, 4, 6, 7, 9, 11], harmonic: [0, 2, 3, 5, 7, 8, 11],
  };
  let song = null, timer = null, step = 0, nextT = 0;

  function compose(cfg, boss) {
    const R = DR.Sprites.rng((cfg.seed || 1) + (boss ? 777 : 0));
    const scale = SCALES[boss ? (cfg.bossScale || 'harmonic') : cfg.scale] || SCALES.minor;
    const prog = boss ? [0, 5, 6, 4] : (cfg.prog || [0, 5, 3, 4]);
    const deg = (d, oct) => cfg.root + oct * 12 + scale[((d % 7) + 7) % 7] + Math.floor(d / 7) * 12;
    const chords = prog.map(d => [deg(d, 0), deg(d + 2, 0), deg(d + 4, 0)]);
    // Melody phrases: 16 steps each, from chord tones and passing notes.
    const phrase = () => {
      const notes = []; let cur = 2 + (R() * 4 | 0);
      for (let i = 0; i < 16; i++) {
        const hit = i % 4 === 0 ? R() < .9 : i % 2 === 0 ? R() < .55 : R() < .22;
        if (!hit) { notes.push(null); continue; }
        cur += [-2, -1, -1, 0, 1, 1, 2, 3][R() * 8 | 0]; cur = Math.max(-1, Math.min(9, cur));
        notes.push({ d: cur, len: R() < .3 ? 2 : 1 });
      }
      return notes;
    };
    const A = phrase(), B = phrase();
    return { cfg, chords, deg, mel: [A, A, B, A], bpm: cfg.bpm * (boss ? 1.12 : 1), boss, intensity: 1 };
  }

  function schedStep(t) {
    const s = song, bar = Math.floor(step / 16) % 4, i = step % 16;
    const ch = s.chords[bar], cfg = s.cfg, sixteenth = 60 / s.bpm / 4;
    // Drums
    if (i === 0 || i === 8 || (s.boss && (i === 6 || i === 14)) || (cfg.drive && i === 10)) kick(t, .8);
    if (i === 4 || i === 12) noise(musicBus, t, .14, { vol: .32, hp: 1200 });
    if (s.intensity > 0 && i % 2 === 0) noise(musicBus, t, .03, { vol: i % 4 === 2 ? .12 : .06, hp: 7000 });
    if (s.boss && i % 2 === 1) noise(musicBus, t, .02, { vol: .05, hp: 9000 });
    // Bass
    if (i % 4 === 0 || (cfg.drive || s.boss) && i % 4 === 2) {
      tone(musicBus, t, mtof(ch[0] - 24 + (i % 8 === 6 ? 12 : 0)), sixteenth * 1.8, { type: cfg.bass || 'triangle', vol: .42 });
    }
    // Arpeggio
    const arp = ch[[0, 1, 2, 1][i % 4]] + (i >= 8 ? 12 : 0);
    tone(musicBus, t, mtof(arp), sixteenth * .9, { type: cfg.arp || 'square', vol: .045, filter: 2600 });
    // Lead
    const n = s.mel[bar][i];
    if (n && (step >= 64 || s.boss || cfg.leadEarly)) {
      tone(musicBus, t, mtof(s.deg(n.d, 1)), sixteenth * (n.len * 1.6), { type: cfg.lead || 'square', vol: .09, filter: 3400 });
      if (cfg.echo) tone(musicBus, t + sixteenth * 3, mtof(s.deg(n.d, 1)), sixteenth * 1.2, { type: cfg.lead || 'square', vol: .03, filter: 2000 });
    }
    // Pad swell on bar starts
    if (i === 0 && cfg.pad) ch.forEach(m => tone(musicBus, t, mtof(m), sixteenth * 15, { type: 'sine', vol: .045, attack: .3 }));
  }

  function tick() {
    if (!song) return;
    const sixteenth = 60 / song.bpm / 4;
    while (nextT < ctx.currentTime + .12) { schedStep(nextT); nextT += sixteenth; step++; }
  }

  DR.Audio = {
    init,
    get muted() { return muted; },
    setMuted(m) {
      muted = m; localStorage.setItem('dr_muted', m ? '1' : '0');
      if (ctx) master.gain.setTargetAtTime(m ? 0 : .8, ctx.currentTime, .05);
    },
    playMusic(cfg, boss = false) {
      if (!ctx) return;
      this.stopMusic(0);
      song = compose(cfg, boss); step = 0; nextT = ctx.currentTime + .08;
      musicBus.gain.cancelScheduledValues(ctx.currentTime);
      musicBus.gain.setValueAtTime(.32, ctx.currentTime);
      timer = setInterval(tick, 25);
    },
    stopMusic(fade = .4) {
      if (timer) clearInterval(timer); timer = null;
      if (ctx && fade) {
        const g = musicBus.gain; g.cancelScheduledValues(ctx.currentTime);
        g.setValueAtTime(g.value, ctx.currentTime); g.linearRampToValueAtTime(0, ctx.currentTime + fade);
        setTimeout(() => { if (!timer) g.setValueAtTime(.32, ctx.currentTime); }, fade * 1000 + 50);
      }
      song = null;
    },
    suspend() { if (ctx) ctx.suspend(); },
    resume() { if (ctx) ctx.resume(); },
    duck(on) { if (ctx) musicBus.gain.setTargetAtTime(on ? .1 : .32, ctx.currentTime, .08); },

    sfx(name) {
      if (!ctx || muted) return;
      const t = ctx.currentTime;
      switch (name) {
        case 'jump': tone(sfxBus, t, 380, .14, { type: 'square', vol: .16, slide: 2.1, filter: 3000 }); break;
        case 'flip': tone(sfxBus, t, 900, .18, { type: 'sawtooth', vol: .12, slide: .3, filter: 2400 }); tone(sfxBus, t, 300, .18, { type: 'square', vol: .08, slide: 3 }); break;
        case 'swim': tone(sfxBus, t, 260, .08, { type: 'sine', vol: .14, slide: 1.6 }); break;
        case 'land': noise(sfxBus, t, .05, { vol: .12, lp: 900 }); break;
        case 'coin': tone(sfxBus, t, 988, .07, { vol: .12 }); tone(sfxBus, t + .06, 1319, .16, { vol: .12 }); break;
        case 'heart': [523, 659, 784, 1047].forEach((f, i) => tone(sfxBus, t + i * .06, f, .14, { vol: .12, type: 'triangle' })); break;
        case 'close': tone(sfxBus, t, 660, .08, { vol: .1 }); tone(sfxBus, t + .05, 990, .1, { vol: .1 }); tone(sfxBus, t + .1, 1320, .14, { vol: .09 }); break;
        case 'hit': noise(sfxBus, t, .35, { vol: .5, lp: 2200 }); tone(sfxBus, t, 220, .35, { type: 'sawtooth', vol: .25, slide: .25 }); break;
        case 'death': noise(sfxBus, t, .7, { vol: .5, lp: 1500 }); tone(sfxBus, t, 440, .9, { type: 'square', vol: .2, slide: .1 }); break;
        case 'warn': [0, .22].forEach(d => tone(sfxBus, t + d, 880, .16, { type: 'square', vol: .12, slide: .7 })); break;
        case 'siren': for (let i = 0; i < 4; i++) { tone(sfxBus, t + i * .45, 520, .42, { type: 'sawtooth', vol: .1, slide: 1.7, filter: 1800 }); } break;
        case 'orb': tone(sfxBus, t, 400, .3, { type: 'sine', vol: .2, slide: 4 }); tone(sfxBus, t, 800, .3, { type: 'square', vol: .06, slide: 3 }); break;
        case 'bosshit': noise(sfxBus, t, .5, { vol: .6, lp: 900 }); tone(sfxBus, t, 120, .5, { type: 'square', vol: .3, slide: .4 }); tone(sfxBus, t, 1600, .2, { type: 'square', vol: .08, slide: .3 }); break;
        case 'shoot': tone(sfxBus, t, 700, .16, { type: 'sawtooth', vol: .1, slide: .35, filter: 3000 }); break;
        case 'boom': noise(sfxBus, t, 1.2, { vol: .7, lp: 700 }); tone(sfxBus, t, 80, 1.2, { type: 'sine', vol: .5, slide: .3 }); break;
        case 'thunder': noise(sfxBus, t, 1.6, { vol: .45, lp: 500 }); break;
        case 'count': tone(sfxBus, t, 440, .14, { vol: .14 }); break;
        case 'go': tone(sfxBus, t, 880, .35, { vol: .16 }); tone(sfxBus, t, 1320, .35, { vol: .07 }); break;
        case 'win': [523, 659, 784, 1047, 784, 1047, 1319].forEach((f, i) => tone(sfxBus, t + i * .09, f, i > 5 ? .6 : .14, { vol: .14 })); break;
        case 'star': tone(sfxBus, t, 1047, .1, { vol: .12 }); tone(sfxBus, t + .07, 1568, .3, { vol: .12, type: 'triangle' }); break;
        case 'laser': tone(sfxBus, t, 1500, .16, { type: 'sawtooth', vol: .10, slide: .22, filter: 2600 }); noise(sfxBus, t, .10, { vol: .07, hp: 3200 }); break;
        case 'wave': noise(sfxBus, t, 1.7, { vol: .36, lp: 420 }); tone(sfxBus, t, 72, 1.5, { type: 'sine', vol: .28, slide: .8 }); break;
        case 'glitch': for (let i = 0; i < 6; i++) tone(sfxBus, t + i * .03, 100 + Math.random() * 1500, .04, { type: 'square', vol: .07 }); break;
        case 'whistle': tone(sfxBus, t, 2500, .08, { type: 'sine', vol: .09 }); tone(sfxBus, t + .11, 2500, .32, { type: 'sine', vol: .09, slide: 1.04 }); break; // traffic cop
        case 'bump': noise(sfxBus, t, .12, { vol: .25, lp: 500 }); tone(sfxBus, t, 140, .12, { type: 'square', vol: .1, slide: .6 }); break;
        case 'horn': [0, .13].forEach(d => tone(sfxBus, t + d, 740, .1, { type: 'square', vol: .07, filter: 2200 })); break; // auto / scooter
        case 'honk': tone(sfxBus, t, 330, .32, { type: 'sawtooth', vol: .08, filter: 1400 }); tone(sfxBus, t, 415, .32, { type: 'sawtooth', vol: .06, filter: 1400 }); break; // car / lorry
        case 'crack': noise(sfxBus, t, .06, { vol: .32, hp: 1800 }); tone(sfxBus, t, 1900, .03, { type: 'square', vol: .06, slide: .6 }); break; // eggshell
        case 'kick': tone(sfxBus, t, 150, .14, { type: 'sine', vol: .32, slide: .3 }); break; // victory dance beat
        case 'hat': noise(sfxBus, t, .04, { vol: .1, hp: 6000 }); break;
        case 'click': tone(sfxBus, t, 1200, .04, { vol: .08 }); break;
      }
    },
  };
})();
