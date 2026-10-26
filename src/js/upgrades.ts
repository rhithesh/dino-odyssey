// Dino powers: 4 meters of 10 bars each. Every dino starts with its own bars (its strengths);
// coins buy one more bar at a time, each bar a little pricier than the last.
(function () {
  DR.STATS = [
    { id: 'jump', icon: '⇡', name: 'JUMP' },
    { id: 'tough', icon: '♥', name: 'TOUGHNESS' },
    { id: 'agile', icon: '⚡', name: 'AGILITY' },
    { id: 'dash', icon: '≫', name: 'DASH' },
  ];
  DR.MAX_BARS = 10;

  // Starting bars [jump, tough, agile, dash]. Later dinos start fuller; each leans into its own strengths.
  const B = {
    compy: [2, 2, 3, 0], hypsi: [2, 1, 4, 0], raptor: [2, 1, 4, 1],
    galli: [3, 2, 4, 3], para: [3, 3, 3, 2], dilo: [3, 3, 3, 3], pachy: [2, 5, 2, 2],
    iguano: [3, 4, 3, 3], carno: [4, 3, 4, 4], allo: [4, 4, 4, 3], stego: [2, 6, 2, 3],
    ankylo: [1, 8, 2, 2], trike: [3, 6, 3, 5], spino: [4, 5, 4, 4], ptera: [7, 2, 5, 3], micro: [4, 2, 7, 5],
    trex: [5, 7, 4, 6], mosa: [4, 5, 6, 6], brachio: [6, 4, 4, 6],
  };
  DR.baseBars = id => {
    const b = B[id] || B.compy, out = {};
    DR.STATS.forEach((s, i) => { out[s.id] = b[i]; });
    return out;
  };
  // save.bars = { dinoId: { jump: boughtBars, ... } }. Effective bars = start + bought, capped at 10.
  DR.barsOf = (save, id) => {
    const base = DR.baseBars(id), bought = (save.bars && save.bars[id]) || {}, out = {};
    for (const s of DR.STATS) out[s.id] = Math.min(DR.MAX_BARS, base[s.id] + (bought[s.id] | 0));
    return out;
  };
  // Price of the next bar when the meter is at n: 40, 65, 90 … 265, and 20% more per power star above 1.
  DR.barCost = (n, id) => Math.round((40 + 25 * n) * (1 + .2 * DR.dinoRank(id)) / 5) * 5;

  // Bars → stats (on top of the species perk).
  DR.applyBars = function (st, bars) {
    const out = Object.assign({}, st), j = bars.jump | 0, t = bars.tough | 0, a = bars.agile | 0, d = bars.dash | 0;
    out.jumpV += 8 * j;
    out.inv += .08 * t; out.penaltyRec += .04 * t; out.hearts += (t >= 5 ? 1 : 0) + (t >= 10 ? 1 : 0);
    out.coyote += .006 * a; out.buffer += .008 * a; out.fall += .15 * a;
    if (a >= 5) { out.air = 1; out.airPow = .8 + .02 * a; }
    if (d >= 1) { out.dashLvl = 1; out.dashDur = .3 + .03 * d; out.dashCd = 7.5 - .4 * d; }
    return out;
  };
  // Clear bonus paid on top of the coins you collect.
  DR.winBonus = (stars, boss) => 15 + 5 * stars + (boss ? 30 : 0);
})();
