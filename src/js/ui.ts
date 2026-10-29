// Menus, save data, input and HUD wiring.
(function () {
  const $ = (id: string): HTMLElement => document.getElementById(id)!;
  const LEVELS = DR.LEVELS;

  // ---------------- save data ----------------
  const save = Object.assign({ unlocked: 1, stars: {}, best: {}, last: 1, coins: 0, up: {} }, JSON.parse(localStorage.getItem('dr_save') || '{}'));
  const persist = () => localStorage.setItem('dr_save', JSON.stringify(save));
  // Save v2: the retro finale moved to world 11 so two new worlds could slot in before it.
  if (!save.v) {
    if (save.stars && save.stars[9] !== undefined) { save.stars[11] = save.stars[9]; delete save.stars[9]; }
    if (save.best && save.best[9] !== undefined) { save.best[11] = save.best[9]; delete save.best[9]; }
    if (save.last === 9) save.last = 11;
    save.v = 2; persist();
  }
  const totalStars = () => Object.values(save.stars).reduce<number>((a, b) => a + Number(b), 0);

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
  // DEV FLAG: every world is playable while the campaign is still being built.
  // Flip to false for production — progression then follows save.unlocked again.
  const UNLOCK_ALL = false;
  // The retro world is always playable and never part of the unlock chain.
  const levelOpen = L => UNLOCK_ALL || !!L.alwaysOpen || L.id <= save.unlocked;
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
  // Locked dinos sit inside a round steel cage seen slightly from above. It is drawn in two passes around
  // the dino: 'back' (far bars, far rail halves, floor) and 'front' (near bars, near rails, base and cap).
  // Geometry comes from the caller and must stay fixed between frames so the cage never bobs.
  function drawCage(g, layer, cx, top, bottom, R, u) {
    const ry = R * .2, N = 16, back = layer === 'back';
    const metal = (x0, x1, a) => {
      const gr = g.createLinearGradient(x0, 0, x1, 0);
      gr.addColorStop(0, `rgba(40,38,56,${a})`); gr.addColorStop(.35, `rgba(232,228,246,${a})`);
      gr.addColorStop(.55, `rgba(150,144,178,${a})`); gr.addColorStop(1, `rgba(30,28,44,${a})`);
      return gr;
    };
    const ring = (y, from, to, width, a) => {
      g.lineWidth = width; g.strokeStyle = metal(cx - R, cx + R, a);
      g.beginPath(); g.ellipse(cx, y, R, ry, 0, from, to); g.stroke();
    };
    g.save(); g.lineCap = 'round';
    if (back) {
      g.fillStyle = 'rgba(0,0,0,.35)'; g.beginPath(); g.ellipse(cx, bottom, R * 1.05, ry * 1.1, 0, 0, Math.PI * 2); g.fill();
      ring(top, Math.PI, Math.PI * 2, 2 * u, .55); ring(bottom, Math.PI, Math.PI * 2, 2 * u, .55);
    }
    for (let i = 0; i < N; i++) {
      const th = (i + .5) * Math.PI * 2 / N, z = Math.cos(th);
      if ((z < 0) !== back) continue;
      const x = cx + R * Math.sin(th), bw = u * (back ? 1 : 1.4) * (.6 + .4 * Math.abs(z));
      g.lineWidth = bw; g.strokeStyle = metal(x - bw / 2, x + bw / 2, back ? .45 : .95);
      g.beginPath(); g.moveTo(x, top + ry * z); g.lineTo(x, bottom + ry * z); g.stroke();
    }
    if (!back) {
      ring(top, 0, Math.PI, 2.4 * u, 1); ring(bottom, 0, Math.PI, 2.4 * u, 1);
      // base plinth
      const bh = 3 * u, bg = g.createLinearGradient(0, bottom, 0, bottom + ry + bh);
      bg.addColorStop(0, '#5b5676'); bg.addColorStop(1, '#16141f');
      g.fillStyle = bg; g.beginPath();
      g.ellipse(cx, bottom + bh, R + u, ry + u * .5, 0, 0, Math.PI); g.lineTo(cx - R - u, bottom); g.ellipse(cx, bottom, R + u, ry + u * .5, 0, Math.PI, 0, true); g.closePath(); g.fill();
      g.strokeStyle = 'rgba(255,207,74,.55)'; g.lineWidth = Math.max(1, u * .6);
      g.beginPath(); g.ellipse(cx, bottom + bh * .5, R + u, ry + u * .5, 0, .15, Math.PI - .15); g.stroke();
      // domed cap and hanging ring
      const ch = R * .32, cg = g.createLinearGradient(cx - R, 0, cx + R, 0);
      cg.addColorStop(0, '#24212f'); cg.addColorStop(.35, '#bdb7d6'); cg.addColorStop(.6, '#6e688c'); cg.addColorStop(1, '#1b1926');
      g.fillStyle = cg; g.beginPath();
      g.ellipse(cx, top, R, ry, 0, 0, Math.PI); g.quadraticCurveTo(cx - R, top - ch, cx, top - ch); g.quadraticCurveTo(cx + R, top - ch, cx + R, top); g.fill();
      g.strokeStyle = 'rgba(255,207,74,.55)'; g.lineWidth = Math.max(1, u * .6);
      g.beginPath(); g.ellipse(cx, top, R, ry, 0, .15, Math.PI - .15); g.stroke();
      g.strokeStyle = metal(cx - 2.5 * u, cx + 2.5 * u, 1); g.lineWidth = 1.2 * u;
      g.beginPath(); g.arc(cx, top - ch - 2 * u, 2 * u, 0, Math.PI * 2); g.stroke();
    }
    g.restore();
  }
  // The cage is rendered once, smooth at 3x, in a 300x190 design box, then laid over a dino canvas as two
  // images (behind and in front of the dino). Same art and proportions everywhere; CSS scales it to the box.
  const CAGE = { W: 300, H: 190, cx: 150, R: 72, top: 52, bottom: 160, floor: 163, innerW: 118, innerH: 100 };
  let cageArt = null;
  function cageImgs() {
    if (!cageArt) cageArt = ['back', 'front'].map(layer => {
      const c = document.createElement('canvas'), k = 3; c.width = CAGE.W * k; c.height = CAGE.H * k;
      const g = c.getContext('2d'); g.scale(k, k); drawCage(g, layer, CAGE.cx, CAGE.top, CAGE.bottom, CAGE.R, 3);
      return c.toDataURL();
    });
    return cageArt;
  }
  // box: relatively positioned wrapper around the dino canvas (which needs `relative` so it stacks between).
  function setCage(box, on) {
    box.querySelectorAll('.cage').forEach(n => n.remove());
    if (!on) return;
    const [back, front] = cageImgs();
    const mk = src => { const i = document.createElement('img'); i.src = src; i.alt = ''; i.className = 'cage pointer-events-none absolute inset-0 h-full w-full'; return i; };
    box.prepend(mk(back)); box.append(mk(front));
  }
  const padlockIcon = (s = 12) => `<svg class="inline-block shrink-0" width="${s}" height="${Math.round(s * 80 / 64)}" aria-hidden="true"><use href="#padlock"/></svg>`;
  const cageIcon = (s = 12) => `<svg class="inline-block shrink-0" width="${s}" height="${s}" viewBox="0 0 9 9" shape-rendering="crispEdges" fill="#ffcf4a"><rect x="4" y="0" width="1" height="1"/><rect x="0" y="1" width="9" height="1"/><rect x="0" y="2" width="1" height="6"/><rect x="2" y="2" width="1" height="6"/><rect x="4" y="2" width="1" height="6"/><rect x="6" y="2" width="1" height="6"/><rect x="8" y="2" width="1" height="6"/><rect x="0" y="8" width="9" height="1"/></svg>`;
  function dinoCard(D, w, h, frame: any = 'stand', locked = false) {
    const c = DR.Sprites.mk(w, h), g = c.getContext('2d');
    const set = DR.Sprites.dinoOf(D.id, { dino: '#cfc6b4', dinoEye: '#1a1418' }).dino;
    const img = frame === 'stand' ? set.stand : set.run[frame];
    const x = Math.round((w - img.width) / 2), y = h - 4 - img.height + (img.ay || 0);
    if (locked) {
      // silhouette scaled to fit inside the cage overlay (see setCage), feet on the cage floor
      const t = DR.Sprites.mk(img.width, img.height), tg = t.getContext('2d');
      tg.drawImage(img, 0, 0); tg.globalCompositeOperation = 'source-in'; tg.fillStyle = '#3b3652'; tg.fillRect(0, 0, t.width, t.height);
      const kx = w / CAGE.W, ky = h / CAGE.H, f = Math.min(1, CAGE.innerW * kx / set.stand.width, CAGE.innerH * ky / set.stand.height);
      const dw = Math.round(img.width * f), dh = Math.round(img.height * f);
      g.imageSmoothingEnabled = false;
      g.drawImage(t, Math.round(w / 2 - dw / 2), Math.round(CAGE.floor * ky - dh + (img.ay || 0) * f), dw, dh);
      return c;
    }
    g.fillStyle = 'rgba(255,255,255,.08)'; g.fillRect(0, h - 4, w, 1);
    g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(x + 4, h - 4, img.width - 8, 2);
    g.drawImage(img, x, y);
    return c;
  }

  // ---------------- game + HUD ----------------
  let current: any = null, hudCache: any = {};
  const game = new DR.Game($('game'), {
    hud: updateHud,
    hurt(h) { const el = $('hearts').children[h] as HTMLElement | undefined; if (el) { el.classList.remove('animate-[heartPop_.5s]'); void el.offsetWidth; el.classList.add('animate-[heartPop_.5s]'); } },
    end: onEnd,
  });

  function updateHud(s) {
    if (s.hearts !== hudCache.hearts || s.maxHearts !== hudCache.maxHearts) {
      hudCache.maxHearts = s.maxHearts;
      $('hearts').innerHTML = Array.from({ length: s.maxHearts }, (_, i) => i).map(i => `<span class="h ${i < s.hearts ? '' : 'lost'} text-[#ff3b5c] transition-transform duration-200 [text-shadow:0_0_8px_rgba(255,59,92,.7),0_2px_0_#000] ${i < s.hearts ? '' : 'scale-90 text-white/20 [text-shadow:none]'}">♥</span>`).join('');
      hudCache.hearts = s.hearts;
    }
    if (s.score !== hudCache.score) { $('score').textContent = s.score.toLocaleString(); hudCache.score = s.score; }
    if (s.coins !== hudCache.coins) { $('coinCount').textContent = s.coins; hudCache.coins = s.coins; }
    const pr = Math.round(s.prog * 1000);
    if (pr !== hudCache.prog) { $('progFill').style.width = (s.prog * 100) + '%'; hudCache.prog = pr; }
    const bossOn = !!s.boss && (s.phase === 'boss' || s.phase === 'bossIntro');
    $('progress').classList.toggle('hidden', bossOn || !!s.endless);
    if (s.endless) {
      const b = s.boosts, parts = [];
      if (b.shield > 0) parts.push('◆ SHIELD');
      if (b.magnet > 0) parts.push(`MAGNET ${b.magnet.toFixed(0)}s`);
      if (b.dbl > 0) parts.push(`2× SCORE ${b.dbl.toFixed(0)}s`);
      const txt = parts.join('  ');
      if (txt !== hudCache.boost) { hudCache.boost = txt; $('boostRow').textContent = txt; }
    }
    if (bossOn !== hudCache.bossOn) { $('bossBar').classList.toggle('hidden', !bossOn); $('progress').classList.toggle('hidden', bossOn); hudCache.bossOn = bossOn; }
    if (bossOn) { $('bossName').textContent = s.boss.name; $('bossFill').style.width = (s.boss.hp / s.boss.max * 100) + '%'; }
    if (s.mult !== hudCache.mult) {
      $('combo').classList.toggle('opacity-100', s.mult > 1);
      $('combo').innerHTML = `<span class="block text-[26px]">x${s.mult.toFixed(1)}</span>COMBO`;
      hudCache.mult = s.mult;
    }
    const d = s.dash, dk = d ? Math.ceil(d.cd * 10) + (d.on ? 'on' : '') : 'none';
    if (dk !== hudCache.dash) {
      hudCache.dash = dk;
      if (d) {
        const ready = d.cd <= 0 && !d.on, k = d.on ? 1 : ready ? 1 : 1 - d.cd / d.max;
        $('btnDash').classList.toggle('border-[var(--accent)]', ready);
        $('btnDash').classList.toggle('shadow-[0_0_14px_rgba(255,207,74,.5)]', ready);
        $('padDashFill').style.height = (ready || d.on ? 0 : (1 - k) * 100) + '%';
      }
    }
  }

  // ---------------- screens ----------------
  const SCREENS = ['scrTitle', 'scrLevels', 'scrHelp', 'scrPause', 'scrResult', 'scrOver', 'scrDex', 'scrDino'];
  let screen = 'scrTitle';
  // Screens with their own full-bleed blurred backdrop (they scroll, so the blur
  // lives on #veil instead of on the scrolling element).
  const VEILED = ['scrLevels', 'scrDex', 'scrDino', 'scrShop'];
  function show(id) {
    SCREENS.forEach(s => $(s).classList.toggle('hidden', s !== id));
    screen = id;
    $('hud').classList.toggle('hidden', !(id === null || id === 'scrPause'));
    $('touch').classList.toggle('hidden', !!id);
    const listScreen = VEILED.includes(id);
    $('veil').classList.toggle('hidden', !listScreen);
    ['blur-[13px]', 'brightness-[.6]', 'saturate-[.85]', 'scale-[1.06]'].forEach(cls => $('game').classList.toggle(cls, listScreen));
  }
  function startDemo() {
    const pool = LEVELS.filter(L => levelOpen(L) && !L.retro && ['run'].includes(L.mode));
    const L = pool[(Math.random() * pool.length) | 0] || LEVELS[0];
    current = null; document.body.classList.toggle('retro', !!L.retro); document.body.classList.remove('endless');
    game.load(L, { demo: true, dino: save.dino });
  }
  function toTitle() { show('scrTitle'); startDemo(); refreshTitle(); }
  function refreshTitle() {
    const L = LEVELS[Math.min(save.unlocked, LEVELS.length) - 1];
    $('btnContinue').textContent = save.unlocked > 1 ? `▶ CONTINUE · W${L.id}` : '▶ PLAY';
    $('btnSound').textContent = DR.Audio.muted ? '♪ SOUND: OFF' : '♪ SOUND: ON';
    const off = !navigator.onLine;
    const netDot = $('netChip').firstElementChild as HTMLElement;
    netDot.classList.toggle('bg-[#ff3b5c]', off);
    netDot.classList.toggle('shadow-[0_0_8px_#ff3b5c]', off);
    netDot.classList.toggle('bg-[#4ade80]', !off);
    netDot.classList.toggle('shadow-[0_0_8px_#4ade80]', !off);
    $('netText').textContent = off ? 'You\'re offline — perfect timing.' : 'Online · play anyway';
    $('equipped').innerHTML = `PLAYING AS <b class="text-[var(--accent)]">${dinoById(save.dino).short}</b>`;
    $('btnUpgrades').textContent = `DINO UPGRADES · 🪙 ${save.coins}`;
    $('btnDinos').textContent = save.dexNew.length ? `DINO DEX · ${save.dexNew.length} NEW` : 'DINO DEX';
  }

  function startLevel(id, quick = false) {
    DR.Audio.init(); DR.Audio.resume();
    const L = LEVELS[id - 1]; current = L; save.last = id; persist();
    hudCache = {};
    show(null);
    $('btnDash').classList.toggle('hidden', !dashOwned());
    document.body.classList.toggle('retro', !!L.retro); document.body.classList.remove('endless');
    game.load(L, { quick, dino: save.dino, up: barsNow(save.dino) });
  }

  function buildLevels() {
    $('totalStars').textContent = `★ ${totalStars()}/${LEVELS.length * 3}`;
    const D = dinoById(save.dino);
    $('btnLevelsDex').innerHTML = `🦖 Running as <b class="text-[var(--accent)]">${D.short}</b> · <u>change</u>`;
    const grid = $('levelGrid'); grid.innerHTML = '';
    LEVELS.forEach(L => {
      const locked = !levelOpen(L), st = save.stars[L.id] || 0;
      const card = document.createElement('button');
      card.className = `relative flex min-h-[86px] w-full items-stretch ${locked ? '' : 'overflow-hidden'} rounded-[14px] border border-white/20 p-0 text-left shadow-[0_4px_0_rgba(0,0,0,.5)] transition-[transform,box-shadow] ${locked ? 'cursor-not-allowed' : 'hover:-translate-y-0.5 hover:scale-[1.01] hover:shadow-[0_6px_0_rgba(0,0,0,.5),0_0_20px_rgba(255,255,255,.12)]'}`;
      const thumb = DR.Backgrounds.thumb(L, 200, 56);
      const tg = thumb.getContext('2d'), d = DR.Sprites.forLevel(L, save.dino).dino.run[0];
      if (!locked) tg.drawImage(d, 150 - (d.ax || 0), Math.round(56 * .78) - d.height + (d.ay || 0));
      thumb.className = `absolute inset-0 h-full w-full rounded-[13px] [image-rendering:pixelated] ${locked ? 'grayscale brightness-[.45]' : ''}`;
      card.appendChild(thumb);
      const info = document.createElement('div'); info.className = `absolute inset-0 z-[1] rounded-[13px] flex flex-col justify-between bg-[rgba(0,0,0,.62)] py-[10px] pl-2 ${locked ? 'pr-[116px] [&>div:first-child]:opacity-60' : ''}`;
      info.innerHTML = `
        <div><div class="text-[10px] tracking-[3px] opacity-80">WORLD ${L.id}</div><div class="text-[17px] font-black tracking-wide [text-shadow:0_2px_0_#000]">${L.name}</div><div class="text-[10px] opacity-[.85]">${L.twist.split('—')[0].trim()}</div></div>
        ${locked ? `<div class="flex items-center gap-1.5 text-[10px] tracking-wide text-white/70">${padlockIcon(10)}Clear <b class="text-[var(--accent)]">World ${L.id - 1}</b></div>` : `<div class="flex items-center justify-start gap-[10px] text-[11px]"><span class="flex items-center">${[1, 2, 3].map(i => `<span class="text-sm ${i <= st ? 'text-[var(--accent)] [text-shadow:0_0_6px_var(--accent)]' : 'text-white/25'}">★</span>`).join('')}</span>
        <span>${save.best[L.id] ? 'BEST ' + save.best[L.id].toLocaleString() : ''}</span></div>`}`;
      card.appendChild(info);
      if (locked) {
        // oversized padlock: shackle pokes out above the card, body hangs just past the bottom edge
        const lock = document.createElement('span');
        lock.className = 'pointer-events-none absolute -top-4 right-5 z-[2] [filter:drop-shadow(0_6px_10px_rgba(0,0,0,.7))]';
        lock.innerHTML = `<svg width="88" height="110" aria-hidden="true"><use href="#padlock"/></svg>`;
        card.appendChild(lock);
      }
      card.onclick = () => { if (locked) { DR.Audio.sfx('warn'); return; } DR.Audio.sfx('click'); startLevel(L.id); };
      grid.appendChild(card);
    });
  }

  // ---------------- end of a run ----------------
  // ---------------- endless (score chase) ----------------
  // One rule set, no finish line: the run ends only when hearts run out.
  function startEndless() {
    DR.Audio.init(); DR.Audio.resume();
    current = { ...DR.ENDLESS_BASE, id: 0, endless: true, name: 'ENDLESS' };
    hudCache = {};
    show(null);
    $('btnDash').classList.toggle('hidden', !dashOwned());
    document.body.classList.remove('retro');
    document.body.classList.add('endless');
    game.load(current, { dino: save.dino, up: barsNow(save.dino) });
  }
  function endlessOver(r) {
    $('touch').classList.add('hidden');
    const isBest = r.score > (save.best.endless || 0);
    if (isBest) save.best.endless = r.score;
    save.coins += r.bank; persist();
    $('overTitle').textContent = 'RUN OVER';
    $('overStats').innerHTML = row('Distance', r.dist + ' ∞') + row('Coins', r.coins) + row('Score', r.score.toLocaleString()) +
      row('Coins banked', '🪙 +' + r.bank) + `<div class="best bank-line">🪙 ${save.coins} in your wallet</div>` + (isBest ? '<div class="best">★ NEW BEST ★</div>' : '');
    $('overTip').textContent = 'TIP: ' + DR.ENDLESS_TIPS[(Math.random() * DR.ENDLESS_TIPS.length) | 0];
    show('scrOver');
  }

  function onEnd(r) {
    if (r.endless) return endlessOver(r);
    const L = LEVELS[r.level - 1];
    $('touch').classList.add('hidden');
    // Coins are banked win or lose; clearing a world adds a bonus.
    const bonus = r.won ? DR.winBonus(r.stars, !!L.boss) : 0, earned = r.bank + bonus;
    save.coins += earned; persist();
     const bankRows = row('Coins banked', `🪙 +${r.bank}`) + (bonus ? row('Clear bonus', `🪙 +${bonus}`) : '') + `<div class="mt-[6px] font-extrabold tracking-[2px] text-[var(--accent)]">🪙 ${save.coins} in your wallet</div>`;
    if (r.won) {
      const prevBest = save.best[r.level] || 0, isBest = r.score > prevBest;
      save.stars[r.level] = Math.max(save.stars[r.level] || 0, r.stars);
      if (isBest) save.best[r.level] = r.score;
      // Only the frontier advances; clearing the always-open retro world must not unlock the campaign.
      if (r.level === save.unlocked) save.unlocked = Math.min(LEVELS.length, r.level + 1);
      persist();
      const last = r.level === LEVELS.length;
      $('resTitle').textContent = last ? 'EXTINCTION AVERTED!' : L.boss ? 'BOSS DEFEATED!' : 'WORLD CLEAR!';
      $('resStats').innerHTML = row('Distance', r.dist + ' ∞') + row('Coins', `${r.coins} / ${r.coinsTotal}`) + row('Close calls', r.close) +
        row('Hits taken', r.hits) + row('Time', r.time.toFixed(1) + 's') + row('SCORE', r.score.toLocaleString()) + bankRows + (isBest ? '<div class="mt-[6px] font-extrabold tracking-[2px] text-[#4ade80]">★ NEW BEST ★</div>' : '');
      $('btnNext').classList.toggle('hidden', last);
      if (last) $('resStats').innerHTML += '<div class="mt-[6px] font-extrabold tracking-[2px] text-[var(--accent)]">You saved the dinosaurs. Legend.</div>';
      const fresh = claimUnlocks(); persist();
      const un = $('resUnlock'); un.classList.toggle('hidden', !fresh.length); un.innerHTML = '';
      if (fresh.length) {
        const D = fresh[fresh.length - 1];
        const unlockCanvas = dinoCard(D, 54, 36); unlockCanvas.className = 'h-9 w-[54px] [image-rendering:pixelated]'; un.appendChild(unlockCanvas);
        const t = document.createElement('div');
        t.innerHTML = `<div class="text-[9px] font-extrabold tracking-[2px] text-[var(--accent)]">NEW DINO UNLOCKED${fresh.length > 1 ? ` (+${fresh.length - 1} more)` : ''}</div><div class="font-pixel text-[26px] leading-none">${D.name} <span class="text-[10px] tracking-wide text-[var(--accent)] [text-shadow:0_0_8px_rgba(255,207,74,.5)]">${DR.powerStars(D.id)}</span></div>`;
        un.appendChild(t);
        setTimeout(() => DR.Audio.sfx('heart'), 1650);
      }
      const stars = [...$('resStars').children];
      stars.forEach(s => s.className = 'scale-0 text-white/15');
      show('scrResult');
      stars.forEach((s, i) => setTimeout(() => { s.className = `animate-[starIn_.45s_cubic-bezier(.2,1.8,.4,1)_forwards] ${i < r.stars ? 'text-[var(--accent)] [text-shadow:0_0_18px_var(--accent),0_3px_0_#7a4a00]' : 'text-white/15'}`; if (i < r.stars) DR.Audio.sfx('star'); }, 450 + i * 380));
    } else {
      $('overStats').innerHTML = row('Made it', Math.round(r.dist / L.goal * 100) + '%') + row('Coins', r.coins) + row('Score', r.score.toLocaleString()) + bankRows;
      $('overTip').textContent = 'TIP: ' + L.tips[(Math.random() * L.tips.length) | 0];
      $('overTitle').textContent = 'Extinct';
      show('scrOver');
    }
  }
  const row = (k, v) => `<div class="flex justify-between gap-6 border-b border-dashed border-white/10"><span>${k}</span><b class="text-[var(--accent)]">${v}</b></div>`;

  // ---------------- dino page (look, equip, buy 4 powers) ----------------
  let pageId = 'compy', pageFrom = 'scrTitle', pageAnim = 0;
  // Turntable: the pixel sprite is extruded into a thick 3D slab (stacked copies, darker inside)
  // and spun around its vertical axis while it keeps walking. Drag to spin it yourself.
  const spin = { a: 0, drag: false, lastX: 0, vel: 0 };
  function silhouette(img) {
    const t = DR.Sprites.mk(img.width, img.height), g = t.getContext('2d');
    g.drawImage(img, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#3b3652'; g.fillRect(0, 0, t.width, t.height);
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
    const locked = !isOpen(D), frames = turnFrames(D, locked), fr = frames[Math.floor(t / 110) % 4], base = frames[0].face;
    const img = fr.face, S = locked
      ? Math.max(1, Math.floor(Math.min(CAGE.innerW / base.width, CAGE.innerH / base.height)))
      : Math.floor(Math.min(W / (base.width + 6), H / (base.height + 6)));
    const cos = Math.cos(spin.a), sin = Math.sin(spin.a);
    const depth = 6 * S, step = Math.max(1, Math.floor(S / 2)); // slab thickness in screen px
    const cx = W / 2, floor = locked ? CAGE.floor : H - 10, top = floor - img.height * S + (img.ay || 0) * S, w = img.width * S;
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
  function openDino(id, from = 'scrTitle') {
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
  function buildDino(flash = null) {
    const D = dinoById(pageId), open = isOpen(D), equipped = save.dino === D.id;
    $('walletN').textContent = save.coins.toLocaleString();
    setCage($('dpStage'), !open);
    $('dpName').textContent = D.name;
    $('dpPower').textContent = 'POWER ' + DR.powerStars(D.id);
    $('dpPerk').innerHTML = `${cageIcon(13)}<span>${DR.dinoHint(D)}</span>`;
    $('dpPerk').classList.toggle('hidden', open); $('dpPerk').classList.toggle('flex', !open);
    const eq = $('dpEquip');
    eq.classList.toggle('hidden', !open);
    eq.textContent = equipped ? '✓ EQUIPPED' : 'EQUIP';
    const primary = ['bg-[var(--accent)]', 'text-[#1a1205]', 'border-transparent', 'shadow-[0_0_20px_rgba(255,190,60,.3)]', 'hover:brightness-110'];
    const quiet = ['bg-white/5', 'text-white/70', 'border-white/20', 'cursor-default'];
    primary.forEach(cls => eq.classList.toggle(cls, !equipped));
    quiet.forEach(cls => eq.classList.toggle(cls, equipped));
    const list = $('dpSkills'); list.innerHTML = '';
    const base = DR.baseBars(D.id), now = barsNow(D.id), mine = boughtOf(D.id);
    DR.STATS.forEach(st => {
      const n = now[st.id], maxed = n >= DR.MAX_BARS, cost = maxed ? 0 : DR.barCost(n, D.id), can = open && !maxed && save.coins >= cost;
      const card = document.createElement('div');
      card.className = `flex items-stretch gap-3 rounded-2xl border bg-[#0b0a12] p-3 ${st.id === flash ? 'animate-[unlockIn_.4s_cubic-bezier(.2,1.6,.4,1)] border-[var(--accent)]' : 'border-white/10'}`;
      const meter = Array.from({ length: DR.MAX_BARS }, (_, i) =>
        `<i class="relative min-h-[38px] flex-1 rounded-md ${i < n ? 'bg-[var(--accent)]' : 'bg-white/[.07]'} ${((st.id === 'tough' && (i === 4 || i === 9)) || (st.id === 'agile' && i === 4)) ? 'after:content-[\'\'] after:absolute after:left-1/2 after:bottom-1 after:ml-[-2px] after:h-[4px] after:w-[4px] after:rounded-full after:bg-[#0b0a12]' : ''}"></i>`).join('');
      card.innerHTML = `<div class="flex w-[58px] shrink-0 flex-col items-center justify-center gap-1 text-center"><div class="text-xl leading-none text-[var(--accent)]">${st.icon}</div><span class="text-[11px] font-black tracking-wider">${st.name}</span><span class="font-mono text-[10px] opacity-60">${n}/${DR.MAX_BARS}</span></div><div class="flex min-w-0 flex-1 gap-1.5">${meter}</div>`;
      const b = document.createElement('button');
      b.className = `flex min-w-[64px] items-center justify-center gap-1.5 self-center rounded-full px-3 py-2 font-mono text-xs font-black ${maxed ? 'cursor-default text-[#7df9a8]' : can ? 'cursor-pointer bg-[var(--accent)] text-[#1a1205] hover:brightness-110 active:translate-y-px' : 'cursor-not-allowed border border-white/10 bg-black/50 text-white/40'}`;
      b.innerHTML = maxed ? 'MAX' : `<i class="coin-dot"></i>${cost}`;
      b.onclick = () => {
        if (maxed) return;
        if (!can) { DR.Audio.sfx('warn'); $('wallet').classList.remove('animate-[heartPop_.3s_reverse]'); void $('wallet').offsetWidth; $('wallet').classList.add('animate-[heartPop_.3s_reverse]'); return; }
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
      document.querySelectorAll<HTMLCanvasElement>('.dex.on canvas, .dex:hover:not(.locked) canvas').forEach(c => {
        const D = dinoById(c.dataset.id), g = c.getContext('2d');
        g.clearRect(0, 0, c.width, c.height); g.drawImage(dinoCard(D, c.width, c.height, f), 0, 0);
        c.dataset.anim = '1';
      });
      document.querySelectorAll<HTMLCanvasElement>('.dex:not(.on):not(:hover) canvas[data-anim]').forEach(c => {
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
      card.className = `dex relative flex cursor-pointer flex-col items-center gap-[3px] rounded-xl border bg-gradient-to-b from-white/[.08] to-white/[.02] px-[6px] pt-2 pb-[9px] text-center text-white shadow-[0_3px_0_rgba(0,0,0,.5)] transition-[transform,border-color] duration-[120ms] hover:-translate-y-0.5 ${locked ? 'locked cursor-not-allowed' : 'border-white/15 hover:border-white/40'} ${D.id === save.dino ? 'on border-[var(--accent)] shadow-[0_0_0_1px_var(--accent),0_0_18px_rgba(255,207,74,.25),0_3px_0_rgba(0,0,0,.5)]' : ''}`;
      const cv = dinoCard(D, 48, 32, 'stand', locked); cv.dataset.id = D.id;
      cv.className = 'relative h-16 w-24 [image-rendering:pixelated]';
      const thumb = document.createElement('div'); thumb.className = 'relative h-16 w-24';
      thumb.appendChild(cv); setCage(thumb, locked); card.appendChild(thumb);
      const info = document.createElement('div');
      info.innerHTML = locked
        ? `<div class="font-pixel text-[15px] leading-none tracking-wide opacity-50 ${D.name.length > 14 ? 'text-[12px] tracking-normal' : ''}">${D.name}</div><div class="text-[8.5px] tracking-wide opacity-60">${D.era}</div><div class="text-[10px] tracking-wide text-[var(--accent)] [text-shadow:0_0_8px_rgba(255,207,74,.5)]">${DR.powerStars(D.id)}</div><div class="flex min-h-6 items-center justify-center gap-1 text-[9.5px] leading-[1.25] text-white/60">${cageIcon(10)}<span>${DR.dinoHint(D)}</span></div>`
        : `<div class="font-pixel text-[15px] leading-none tracking-wide ${D.name.length > 14 ? 'text-[12px] tracking-normal' : ''}">${D.name}</div><div class="text-[8.5px] tracking-wide opacity-60">${D.era}</div><div class="text-[10px] tracking-wide text-[var(--accent)] [text-shadow:0_0_8px_rgba(255,207,74,.5)]">${DR.powerStars(D.id)}</div>`;
      card.appendChild(info);
      if (locked) { const tag = document.createElement('span'); tag.className = 'absolute -top-[7px] rounded border border-[rgba(255,207,74,.35)] bg-[#2a2638] px-[6px] py-px text-[8px] font-black tracking-[2px] text-[var(--accent)]'; tag.textContent = 'CAGED'; card.appendChild(tag); }
      if (D.id === save.dino) { const badge = document.createElement('span'); badge.className = 'absolute -top-[7px] rounded bg-[var(--accent)] px-[6px] py-px text-[8px] font-black tracking-[2px] text-black'; badge.textContent = 'EQUIPPED'; card.appendChild(badge); }
      if (save.dexNew.includes(D.id)) { const badge = document.createElement('span'); badge.className = 'absolute top-[6px] right-[6px] animate-[blink_1s_infinite] rounded-[3px] bg-[#ff3b5c] px-1 py-px text-[8px] font-black'; badge.textContent = 'NEW'; card.appendChild(badge); }
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
    el.addEventListener('pointerdown', e => { e.preventDefault(); el.classList.add('down', 'scale-[.92]', 'bg-white/20'); down(); });
    const off = () => { el.classList.remove('down', 'scale-[.92]', 'bg-white/20'); up(); };
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
  on('btnRestart', () => { game.paused = false; DR.Audio.resume(); current && current.endless ? startEndless() : startLevel(current.id, true); });
  on('btnQuit', () => { game.paused = false; DR.Audio.resume(); buildLevels(); show('scrLevels'); startDemo(); });
  on('btnNext', () => startLevel(Math.min(current.id + 1, LEVELS.length)));
  on('btnReplay', () => startLevel(current.id, true));
  on('btnResWorlds', () => { buildLevels(); show('scrLevels'); startDemo(); });
  on('btnRetry', () => current && current.endless ? startEndless() : startLevel(current.id, true));
  on('btnEndless', startEndless);
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
