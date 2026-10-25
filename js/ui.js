// Menus, save data, input and HUD wiring.
(function () {
  const $ = id => document.getElementById(id);
  const LEVELS = DR.LEVELS;

  // ---------------- save data ----------------
  const save = Object.assign({ unlocked: 1, stars: {}, best: {}, last: 1, coins: 0, up: {} }, JSON.parse(localStorage.getItem('dr_save') || '{}'));
  const persist = () => localStorage.setItem('dr_save', JSON.stringify(save));
  const totalStars = () => Object.values(save.stars).reduce((a, b) => a + b, 0);

  // ---------------- coins & powers ----------------
  // save.bars = { dinoId: { jump, tough, agile, dash } } = bars bought on top of the dino's starting bars.
  save.coins = Math.max(0, save.coins | 0);
  if (!save.bars || typeof save.bars !== 'object') save.bars = {};
  // Earlier one-off powers (save.skills) are refunded at the price paid.
  if (save.skills) {
    const price = { spring: 60, hide: 120, double: 150, dash: 200 };
    for (const id in save.skills) for (const k in save.skills[id]) if (save.skills[id][k] && price[k]) save.coins += Math.round(price[k] * (1 + .5 * DR.dinoRank(id)) / 5) * 5;
    delete save.skills;
  }
  delete save.up;
  const boughtOf = id => save.bars[id] || (save.bars[id] = {});
  const barsNow = id => DR.barsOf(save, id);
  const dashOwned = () => barsNow(save.dino).dash > 0;

  // ---------------- dinos ----------------
  const DINOS = DR.DINOS;
  const isOpen = D => DR.dinoUnlocked(D, save);
  const dinoById = id => DINOS.find(d => d.id === id) || DINOS[0];
  // dinos[] = species already announced; dexNew[] = unlocked but not yet seen in the Dex. Old saves migrate silently.
  if (!Array.isArray(save.dinos)) save.dinos = DINOS.filter(isOpen).map(d => d.id);
  if (!Array.isArray(save.dexNew)) save.dexNew = [];
  if (!save.dino || !isOpen(dinoById(save.dino))) save.dino = 'compy';
  persist();
  function claimUnlocks() {
    const fresh = DINOS.filter(d => isOpen(d) && !save.dinos.includes(d.id));
    fresh.forEach(d => { save.dinos.push(d.id); save.dexNew.push(d.id); });
    return fresh;
  }
  // Draw a species onto a small canvas (w x h logical px), feet on a ground line; silhouette when locked.
  function dinoCard(D, w, h, frame = 'stand', locked = false) {
    const c = DR.Sprites.mk(w, h), g = c.getContext('2d');
    const set = DR.Sprites.dinoOf(D.id, { dino: '#cfc6b4', dinoEye: '#1a1418' }).dino;
    const img = frame === 'stand' ? set.stand : set.run[frame];
    const x = Math.round((w - img.width) / 2), y = h - 4 - img.height + (img.ay || 0);
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, h - 4, w, 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 4, h - 4, img.width - 8, 2);
    if (locked) {
      const t = DR.Sprites.mk(img.width, img.height), tg = t.getContext('2d');
      tg.drawImage(img, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#05040a'; tg.fillRect(0, 0, t.width, t.height);
      g.drawImage(t, x, y);
    } else g.drawImage(img, x, y);
    return c;
  }

  // ---------------- game + HUD ----------------
  let current = null, hudCache = {};
  const game = new DR.Game($('game'), {
    hud: updateHud,
    hurt(h) { const el = $('hearts').children[h]; if (el) { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); } },
    end: onEnd,
  });

  function updateHud(s) {
    if (s.hearts !== hudCache.hearts || s.maxHearts !== hudCache.maxHearts) {
      hudCache.maxHearts = s.maxHearts;
      $('hearts').innerHTML = Array.from({ length: s.maxHearts }, (_, i) => i).map(i => `<span class="h ${i < s.hearts ? '' : 'lost'}">♥</span>`).join('');
      hudCache.hearts = s.hearts;
    }
    if (s.score !== hudCache.score) { $('score').textContent = s.score.toLocaleString(); hudCache.score = s.score; }
    if (s.coins !== hudCache.coins) { $('coinCount').textContent = s.coins; hudCache.coins = s.coins; }
    const pr = Math.round(s.prog * 1000);
    if (pr !== hudCache.prog) { $('progFill').style.width = (s.prog * 100) + '%'; hudCache.prog = pr; }
    const bossOn = !!s.boss && (s.phase === 'boss' || s.phase === 'bossIntro');
    if (bossOn !== hudCache.bossOn) { $('bossBar').classList.toggle('hidden', !bossOn); $('progress').classList.toggle('hidden', bossOn); hudCache.bossOn = bossOn; }
    if (bossOn) { $('bossName').textContent = s.boss.name; $('bossFill').style.width = (s.boss.hp / s.boss.max * 100) + '%'; }
    if (s.mult !== hudCache.mult) {
      $('combo').classList.toggle('on', s.mult > 1);
      $('combo').innerHTML = `<span class="x">x${s.mult.toFixed(1)}</span>COMBO`;
      hudCache.mult = s.mult;
    }
    $('twistTag').classList.toggle('on', s.phase === 'play' || s.phase === 'boss');
    const d = s.dash, dk = d ? Math.ceil(d.cd * 10) + (d.on ? 'on' : '') : 'none';
    if (dk !== hudCache.dash) {
      hudCache.dash = dk;
      $('dashTag').classList.toggle('hidden', !d);
      if (d) {
        const ready = d.cd <= 0 && !d.on, k = d.on ? 1 : ready ? 1 : 1 - d.cd / d.max;
        $('dashTag').classList.toggle('cd', !ready && !d.on);
        $('dashTag').classList.toggle('on', d.on);
        $('dashFill').style.transform = `scaleX(${k})`;
        $('dashText').textContent = d.on ? '≫ GO!' : ready ? '≫ DASH · SHIFT' : `≫ ${d.cd.toFixed(1)}s`;
        $('btnDash').classList.toggle('ready', ready);
        $('padDashFill').style.height = (ready || d.on ? 0 : (1 - k) * 100) + '%';
      }
    }
  }

  // ---------------- screens ----------------
  const SCREENS = ['scrTitle', 'scrLevels', 'scrHelp', 'scrPause', 'scrResult', 'scrOver', 'scrDex', 'scrDino'];
  let screen = 'scrTitle';
  function show(id) {
    SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id));
    screen = id;
    $('hud').classList.toggle('hidden', !(id === null || id === 'scrPause'));
    $('touch').classList.toggle('hidden', !!id);
  }
  function startDemo() {
    const pool = LEVELS.filter(L => L.id <= save.unlocked && ['run'].includes(L.mode));
    const L = pool[(Math.random() * pool.length) | 0] || LEVELS[0];
    current = null; document.body.classList.toggle('retro', !!L.retro);
    game.load(L, { demo: true, dino: save.dino });
  }
  function toTitle() { show('scrTitle'); startDemo(); refreshTitle(); }
  function refreshTitle() {
    const L = LEVELS[Math.min(save.unlocked, LEVELS.length) - 1];
    $('btnContinue').textContent = save.unlocked > 1 ? `▶ CONTINUE · W${L.id}` : '▶ PLAY';
    $('btnSound').textContent = DR.Audio.muted ? '♪ SOUND: OFF' : '♪ SOUND: ON';
    const off = !navigator.onLine;
    $('netChip').classList.toggle('off', off);
    $('netText').textContent = off ? 'You\'re offline — perfect timing.' : 'Online · play anyway';
    $('equipped').innerHTML = `PLAYING AS <b>${dinoById(save.dino).short}</b>`;
    $('btnUpgrades').textContent = `DINO UPGRADES · 🪙 ${save.coins}`;
    $('btnDinos').textContent = save.dexNew.length ? `DINO DEX · ${save.dexNew.length} NEW` : 'DINO DEX';
  }

  function startLevel(id, quick = false) {
    DR.Audio.init(); DR.Audio.resume();
    const L = LEVELS[id - 1]; current = L; save.last = id; persist();
    hudCache = {};
    $('twistTag').textContent = L.twist.split('—')[0].trim();
    show(null);
    $('btnDash').classList.toggle('hidden', !dashOwned());
    document.body.classList.toggle('retro', !!L.retro);
    game.load(L, { quick, dino: save.dino, up: barsNow(save.dino) });
  }

  function buildLevels() {
    $('totalStars').textContent = `★ ${totalStars()}/${LEVELS.length * 3}`;
    const D = dinoById(save.dino);
    $('btnLevelsDex').innerHTML = `🦖 Running as <b>${D.short}</b> · <u>change</u>`;
    const grid = $('levelGrid'); grid.innerHTML = '';
    LEVELS.forEach(L => {
      const locked = L.id > save.unlocked, st = save.stars[L.id] || 0;
      const card = document.createElement('button');
      card.className = 'lvl' + (locked ? ' locked' : '');
      const thumb = DR.Backgrounds.thumb(L, 200, 56);
      const tg = thumb.getContext('2d'), d = DR.Sprites.forLevel(L, save.dino).dino.run[0];
      tg.drawImage(d, 150 - (d.ax || 0), Math.round(56 * .78) - d.height + (d.ay || 0));
      card.appendChild(thumb);
      const info = document.createElement('div'); info.className = 'info';
      info.innerHTML = `
        <div><div class="num">WORLD ${L.id}</div><div class="name">${L.name}</div><div class="twist">${L.twist.split('—')[0].trim()}</div></div>
        <div class="meta"><span class="stars">${[1, 2, 3].map(i => `<span class="${i <= st ? 'on' : ''}">★</span>`).join('')}</span>
        ${L.boss ? '<span class="boss-tag">BOSS</span>' : ''}<span>${save.best[L.id] ? 'BEST ' + save.best[L.id].toLocaleString() : ''}</span></div>`;
      card.appendChild(info);
      card.onclick = () => { if (locked) { DR.Audio.sfx('warn'); return; } DR.Audio.sfx('click'); startLevel(L.id); };
      grid.appendChild(card);
    });
  }

  // ---------------- end of a run ----------------
  function onEnd(r) {
    const L = LEVELS[r.level - 1];
    $('touch').classList.add('hidden');
    // Coins are banked win or lose; clearing a world adds a bonus.
    const bonus = r.won ? DR.winBonus(r.stars, !!L.boss) : 0, earned = r.bank + bonus;
    save.coins += earned; persist();
    const bankRows = row('Coins banked', `🪙 +${r.bank}`) + (bonus ? row('Clear bonus', `🪙 +${bonus}`) : '') + `<div class="best bank-line">🪙 ${save.coins} in your wallet</div>`;
    if (r.won) {
      const prevBest = save.best[r.level] || 0, isBest = r.score > prevBest;
      save.stars[r.level] = Math.max(save.stars[r.level] || 0, r.stars);
      if (isBest) save.best[r.level] = r.score;
      save.unlocked = Math.max(save.unlocked, Math.min(LEVELS.length, r.level + 1));
      persist();
      const last = r.level === LEVELS.length;
      $('resTitle').textContent = last ? 'EXTINCTION AVERTED!' : L.boss ? 'BOSS DEFEATED!' : 'WORLD CLEAR!';
      $('resStats').innerHTML = row('Distance', r.dist + ' m') + row('Coins', `${r.coins} / ${r.coinsTotal}`) + row('Close calls', r.close) +
        row('Hits taken', r.hits) + row('Time', r.time.toFixed(1) + 's') + row('SCORE', r.score.toLocaleString()) + bankRows + (isBest ? '<div class="best">★ NEW BEST ★</div>' : '');
      $('btnNext').classList.toggle('hidden', last);
      if (last) $('resStats').innerHTML += '<div class="best" style="color:#ffcf4a">You saved the dinosaurs. Legend.</div>';
      const fresh = claimUnlocks(); persist();
      const un = $('resUnlock'); un.classList.toggle('hidden', !fresh.length); un.innerHTML = '';
      if (fresh.length) {
        const D = fresh[fresh.length - 1];
        un.appendChild(dinoCard(D, 54, 36));
        const t = document.createElement('div');
        t.innerHTML = `<div class="ut">NEW DINO UNLOCKED${fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''}</div><div class="un">${D.name} <span class="pw">${DR.powerStars(D.id)}</span></div>`;
        un.appendChild(t);
        setTimeout(() => DR.Audio.sfx('heart'), 1650);
      }
      const stars = [...$('resStars').children];
      stars.forEach(s => s.className = '');
      show('scrResult');
      stars.forEach((s, i) => setTimeout(() => { s.className = 'show' + (i < r.stars ? ' on' : ''); if (i < r.stars) DR.Audio.sfx('star'); }, 450 + i * 380));
    } else {
      $('overStats').innerHTML = row('Made it', Math.round(r.dist / L.goal * 100) + '%') + row('Coins', r.coins) + row('Score', r.score.toLocaleString()) + bankRows;
      $('overTip').textContent = 'TIP: ' + L.tips[(Math.random() * L.tips.length) | 0];
      show('scrOver');
    }
  }
  const row = (k, v) => `<div class="r"><span>${k}</span><b>${v}</b></div>`;

  // ---------------- dino page (look, equip, buy 4 powers) ----------------
  let pageId = 'compy', pageFrom = 'scrTitle', pageAnim = 0;
  // Turntable: the pixel sprite is extruded into a thick 3D slab (stacked copies, darker inside)
  // and spun around its vertical axis while it keeps walking. Drag to spin it yourself.
  const spin = { a: 0, drag: false, lastX: 0, vel: 0 };
  function silhouette(img) {
    const t = DR.Sprites.mk(img.width, img.height), g = t.getContext('2d');
    g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#05040a'; g.fillRect(0, 0, t.width, t.height);
    return t;
  }
  // Side wall of the slab: the body colours, darkened, without the sprite's outline
  // (outline pixels are the only semi-transparent ones, so alpha identifies them).
  function shaded(img, k) {
    const t = DR.Sprites.mk(img.width, img.height), g = t.getContext('2d');
    g.drawImage(img, 0, 0);
    const d = g.getImageData(0, 0, t.width, t.height), p = d.data;
    for (let i = 0; i < p.length; i += 4) {
      if (p[i + 3] < 250) { p[i + 3] = 0; continue; }
      p[i] *= k; p[i + 1] *= k; p[i + 2] *= k;
    }
    g.putImageData(d, 0, 0);
    return t;
  }
  const turnCache = {};
  function turnFrames(D, locked) {
    const key = D.id + (locked ? ':l' : '');
    if (turnCache[key]) return turnCache[key];
    const set = DR.Sprites.dinoOf(D.id, { dino: '#cfc6b4', dinoEye: '#1a1418' }).dino;
    return (turnCache[key] = set.run.map(img => {
      const face = locked ? silhouette(img) : img;
      return { face, side: locked ? face : shaded(img, .62) };
    }));
  }
  function drawTurntable(c, D, t) {
    const g = c.getContext('2d'), W = c.width, H = c.height;
    g.clearRect(0, 0, W, H); g.imageSmoothingEnabled = false;
    const fr = turnFrames(D, !isOpen(D))[Math.floor(t / 110) % 4];
    const img = fr.face, S = Math.floor(Math.min(W / (img.width + 6), H / (img.height + 6)));
    const cos = Math.cos(spin.a), sin = Math.sin(spin.a);
    const depth = 6 * S, step = Math.max(1, Math.floor(S / 2)); // slab thickness in screen px
    const cx = W / 2, floor = H - 10, top = floor - img.height * S + (img.ay || 0) * S, w = img.width * S;
    // ground shadow, squashed by the current facing
    g.fillStyle = 'rgba(0,0,0,.35)';
    g.beginPath(); g.ellipse(cx, floor + 2, w * (.25 + .2 * Math.abs(cos)) + depth * .3 * Math.abs(sin), 5, 0, 0, Math.PI * 2); g.fill();
    // layers back-to-front along the view direction
    const layers = [];
    for (let z = -depth / 2; z <= depth / 2; z += step) layers.push(z);
    layers.sort((p, q) => p * cos - q * cos);
    const sx = Math.max(.02, Math.abs(cos)) * Math.sign(cos || 1);
    for (const z of layers) {
      const face = Math.abs(z) >= depth / 2 - step / 2;
      g.save();
      g.translate(cx + z * sin, 0); g.scale(sx, 1);
      g.drawImage(face ? fr.face : fr.side, -w / 2, top, w, img.height * S);
      g.restore();
    }
  }
  function openDino(id, from) {
    pageId = id; pageFrom = from; buildDino(); show('scrDino'); $('scrDino').scrollTop = 0;
    spin.a = -.5; spin.vel = 0;
    let last = performance.now();
    const tick = now => {
      if (screen !== 'scrDino') return;
      const dt = Math.min(.05, (now - last) / 1000); last = now;
      if (!spin.drag) { spin.vel += (0.9 - spin.vel) * Math.min(1, dt * 1.5); spin.a += spin.vel * dt; } // ease back to a slow auto-spin
      drawTurntable($('dpCanvas'), dinoById(pageId), now);
      pageAnim = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(pageAnim); pageAnim = requestAnimationFrame(tick);
  }
  (() => {
    const c = $('dpCanvas');
    c.addEventListener('pointerdown', e => { spin.drag = true; spin.lastX = e.clientX; spin.vel = 0; c.setPointerCapture(e.pointerId); });
    c.addEventListener('pointermove', e => {
      if (!spin.drag) return;
      const dx = e.clientX - spin.lastX; spin.lastX = e.clientX;
      spin.a += dx * .02; spin.vel = dx * 1.2;
    });
    const up = () => { spin.drag = false; };
    c.addEventListener('pointerup', up); c.addEventListener('pointercancel', up);
  })();
  function closeDino() {
    cancelAnimationFrame(pageAnim);
    if (pageFrom === 'scrDex') openDex(dexFrom);
    else if (pageFrom === 'scrLevels') { buildLevels(); show('scrLevels'); startDemo(); }
    else toTitle();
  }
  function buildDino(flash) {
    const D = dinoById(pageId), open = isOpen(D), equipped = save.dino === D.id;
    $('walletN').textContent = save.coins.toLocaleString();
    $('dpName').textContent = D.name;
    $('dpPower').textContent = 'POWER ' + DR.powerStars(D.id);
    $('dpEra').textContent = D.era;
    $('dpPerk').textContent = '🔒 ' + DR.dinoHint(D);
    $('dpPerk').classList.toggle('hidden', open);
    const eq = $('dpEquip');
    eq.classList.toggle('hidden', !open);
    eq.textContent = equipped ? '✓ EQUIPPED' : 'EQUIP';
    eq.classList.toggle('primary', !equipped);
    const list = $('dpSkills'); list.innerHTML = '';
    const base = DR.baseBars(D.id), now = barsNow(D.id), mine = boughtOf(D.id);
    DR.STATS.forEach(st => {
      const n = now[st.id], maxed = n >= DR.MAX_BARS, cost = maxed ? 0 : DR.barCost(n, D.id), can = open && !maxed && save.coins >= cost;
      const card = document.createElement('div'); card.className = 'up bar-card' + (st.id === flash ? ' flash' : '');
      const meter = Array.from({ length: DR.MAX_BARS }, (_, i) =>
        `<i class="${i < base[st.id] ? 'base' : i < n ? 'on' : ''}${(st.id === 'tough' && (i === 4 || i === 9)) || (st.id === 'agile' && i === 4) ? ' mark' : ''}"></i>`).join('');
      card.innerHTML = `<div class="ico">${st.icon}</div><div><div class="nm">${st.name} <span class="cnt">${n}/${DR.MAX_BARS}</span></div><div class="meter">${meter}</div><div class="ef">${st.hint}</div></div>`;
      const b = document.createElement('button');
      b.className = maxed ? 'max' : can ? '' : 'no';
      b.textContent = maxed ? 'MAX' : `🪙 ${cost}`;
      b.onclick = () => {
        if (maxed) return;
        if (!can) { DR.Audio.sfx('warn'); $('wallet').classList.remove('bump'); void $('wallet').offsetWidth; $('wallet').classList.add('bump'); return; }
        save.coins -= cost; mine[st.id] = (mine[st.id] | 0) + 1; persist();
        DR.Audio.sfx(n + 1 >= DR.MAX_BARS ? 'star' : 'coin'); buildDino(st.id);
      };
      card.appendChild(b); list.appendChild(card);
    });
  }


  // ---------------- dino dex ----------------
  let dexFrom = 'scrTitle', dexAnim = 0;
  function openDex(from) {
    dexFrom = from; buildDex(); show('scrDex');
    const tick = () => {
      if (screen !== 'scrDex') return;
      const f = Math.floor(performance.now() / 110) % 4;
      document.querySelectorAll('.dex.on canvas, .dex:hover:not(.locked) canvas').forEach(c => {
        const D = dinoById(c.dataset.id), g = c.getContext('2d');
        g.clearRect(0, 0, c.width, c.height); g.drawImage(dinoCard(D, c.width, c.height, f), 0, 0);
        c.dataset.anim = '1';
      });
      document.querySelectorAll('.dex:not(.on):not(:hover) canvas[data-anim]').forEach(c => {
        const g = c.getContext('2d'); g.clearRect(0, 0, c.width, c.height); g.drawImage(dinoCard(dinoById(c.dataset.id), c.width, c.height), 0, 0); delete c.dataset.anim;
      });
      dexAnim = requestAnimationFrame(tick);
    };
    cancelAnimationFrame(dexAnim); dexAnim = requestAnimationFrame(tick);
  }
  function buildDex() {
    const open = DINOS.filter(isOpen).length;
    $('dexCount').textContent = `${open}/${DINOS.length}`;
    const grid = $('dexGrid'); grid.innerHTML = '';
    // equipped dino always first, then the rest in roster order
    [dinoById(save.dino), ...DINOS.filter(d => d.id !== save.dino)].forEach(D => {
      const locked = !isOpen(D);
      const card = document.createElement('button');
      card.className = 'dex' + (locked ? ' locked' : '') + (D.id === save.dino ? ' on' : '') + (save.dexNew.includes(D.id) ? ' new' : '');
      const cv = dinoCard(D, 48, 32, 'stand', locked); cv.dataset.id = D.id;
      card.appendChild(cv);
      const info = document.createElement('div');
      info.innerHTML = locked
        ? `<div class="dn${D.name.length > 14 ? ' long' : ''}">${D.name}</div><div class="de">${D.era}</div><div class="pw">${DR.powerStars(D.id)}</div><div class="dp">🔒 ${DR.dinoHint(D)}</div>`
        : `<div class="dn${D.name.length > 14 ? ' long' : ''}">${D.name}</div><div class="de">${D.era}</div><div class="pw">${DR.powerStars(D.id)}</div>`;
      card.appendChild(info);
      card.onclick = () => { DR.Audio.sfx('click'); cancelAnimationFrame(dexAnim); openDino(D.id, 'scrDex'); };
      grid.appendChild(card);
    });
    save.dexNew = []; persist();
  }
  function closeDex() { cancelAnimationFrame(dexAnim); if (dexFrom === 'scrLevels') { buildLevels(); show('scrLevels'); } else toTitle(); }

  // ---------------- pause ----------------
  function pause() {
    if (!current || game.paused || screen !== null || ['win', 'dead'].includes(game.phase)) return;
    game.paused = true; game.release(); game.setDuck(false); DR.Audio.suspend(); show('scrPause');
  }
  function resume() { game.paused = false; game.last = performance.now(); DR.Audio.resume(); show(null); }

  // ---------------- input ----------------
  const JUMP = ['Space', 'ArrowUp', 'KeyW'], DUCK = ['ArrowDown', 'KeyS'], DASH = ['ShiftLeft', 'ShiftRight', 'ArrowRight', 'KeyD'];
  window.addEventListener('keydown', e => {
    if (JUMP.includes(e.code) || DUCK.includes(e.code) || DASH.includes(e.code)) e.preventDefault();
    if (e.repeat) return;
    DR.Audio.init();
    if (e.code === 'KeyM') { DR.Audio.setMuted(!DR.Audio.muted); refreshTitle(); return; }
    if (screen === null) {
      if (JUMP.includes(e.code)) game.press();
      else if (DUCK.includes(e.code)) game.setDuck(true);
      else if (DASH.includes(e.code)) game.dash();
      else if (e.code === 'KeyP' || e.code === 'Escape') pause();
      return;
    }
    const go = JUMP.includes(e.code) || e.code === 'Enter';
    if (screen === 'scrPause' && (go || e.code === 'KeyP' || e.code === 'Escape')) resume();
    else if (screen === 'scrTitle' && go) $('btnContinue').click();
    else if (screen === 'scrResult' && go) ($('btnNext').classList.contains('hidden') ? $('btnReplay') : $('btnNext')).click();
    else if (screen === 'scrOver' && go) $('btnRetry').click();
    else if ((screen === 'scrLevels' || screen === 'scrHelp') && e.code === 'Escape') toTitle();
    else if (screen === 'scrDex' && e.code === 'Escape') closeDex();
    else if (screen === 'scrDino' && e.code === 'Escape') closeDino();
  });
  window.addEventListener('keyup', e => {
    if (JUMP.includes(e.code)) game.release();
    if (DUCK.includes(e.code)) game.setDuck(false);
  });

  // tap / click the play-field to jump
  $('game').addEventListener('pointerdown', e => { if (screen === null) { e.preventDefault(); game.press(); } });
  window.addEventListener('pointerup', () => game.release());
  const pad = (el, down, up) => {
    el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('down'); down(); });
    const off = () => { el.classList.remove('down'); up(); };
    el.addEventListener('pointerup', off); el.addEventListener('pointerleave', off); el.addEventListener('pointercancel', off);
  };
  pad($('btnJump'), () => game.press(), () => game.release());
  pad($('btnDuck'), () => game.setDuck(true), () => game.setDuck(false));
pad($('btnDash'), () => game.dash(), () => {});

  // focus handling: the side panel only receives keys while focused
  const focusHint = () => $('focusHint').classList.toggle('hidden', document.hasFocus() || screen !== null);
  window.addEventListener('blur', () => { pause(); focusHint(); });
  window.addEventListener('focus', focusHint);
  document.addEventListener('visibilitychange', () => { if (document.hidden) pause(); });
  window.addEventListener('online', refreshTitle); window.addEventListener('offline', refreshTitle);

  // ---------------- buttons ----------------
  const on = (id, fn) => $(id).addEventListener('click', () => { DR.Audio.init(); DR.Audio.sfx('click'); fn(); });
  on('btnContinue', () => startLevel(Math.min(save.unlocked, LEVELS.length)));
  on('btnLevels', () => { buildLevels(); show('scrLevels'); });
  on('btnHelp', () => show('scrHelp'));
  on('btnSound', () => { DR.Audio.setMuted(!DR.Audio.muted); refreshTitle(); });
  on('btnBackLevels', toTitle);
  on('btnBackHelp', toTitle);
  on('btnDinos', () => openDex('scrTitle'));
  on('btnLevelsDex', () => openDex('scrLevels'));
  on('btnBackDex', closeDex);
  on('btnUpgrades', () => openDino(save.dino, 'scrTitle'));
  on('btnBackDino', closeDino);
  on('dpEquip', () => { save.dino = pageId; persist(); buildDino(); if (!current) startDemo(); });
  on('btnResShop', () => openDino(save.dino, 'scrLevels'));
  on('btnOverShop', () => openDino(save.dino, 'scrLevels'));
  on('pauseBtn', pause);
  on('btnResume', resume);
  on('btnRestart', () => { game.paused = false; DR.Audio.resume(); startLevel(current.id, true); });
  on('btnQuit', () => { game.paused = false; DR.Audio.resume(); buildLevels(); show('scrLevels'); startDemo(); });
  on('btnNext', () => startLevel(Math.min(current.id + 1, LEVELS.length)));
  on('btnReplay', () => startLevel(current.id, true));
  on('btnResWorlds', () => { buildLevels(); show('scrLevels'); startDemo(); });
  on('btnRetry', () => startLevel(current.id, true));
  on('btnOverWorlds', () => { buildLevels(); show('scrLevels'); startDemo(); });
  // the pause button lives inside the pointer-transparent HUD
  $('pauseBtn').addEventListener('pointerdown', e => e.stopPropagation());

  // first click anywhere unlocks audio and starts title music
  window.addEventListener('pointerdown', function first() {
    DR.Audio.init(); if (screen === 'scrTitle' && game.L) DR.Audio.playMusic(game.L.music);
    window.removeEventListener('pointerdown', first);
  });

  DR.game = game; DR.startLevel = startLevel;
  toTitle();
})();
