// Victory dances: 3 s after a world is cleared (Game 'win' phase), in time with the world's bpm.
// A dance turns the beat count b (0, 0.5, 1.7 …) into a pose built from the species' existing frames,
// so every dino can do every dance with no new art:
//   f: 'stand' | 'duck' | 'jump' | 'run'   i: run/duck frame   dx, dy: offset   sx, sy: scale about the feet
//   rot: tilt about the feet   flip: -1 faces back
// fx: what bursts out on each beat ('dust' | 'notes' | 'sparks').
(function () {
  const PI = Math.PI, frac = b => b - Math.floor(b), up = (k, h) => -Math.sin(PI * Math.min(1, Math.max(0, k))) * h;
  const squash = k => Math.max(0, 1 - k * 6); // 1 right on the landing, gone a sixth of a beat later

  DR.DANCES = [
    { // hop on every beat, flatten on the landing
      name: 'STOMP HOP', fx: 'dust',
      pose: b => {
        const k = frac(b), air = k < .55, s = air ? 0 : squash(k - .55);
        return { f: air ? 'jump' : 'stand', dy: air ? up(k / .55, 12) : 0, sx: air ? .94 : 1 + .2 * s, sy: air ? 1.08 : 1 - .24 * s };
      },
    },
    { // legs walk forward while the body glides backward, leaning back
      name: 'MOONWALK', fx: 'notes',
      pose: b => ({ f: 'run', i: 3 - Math.floor(b * 4) % 4, dx: 10 - 4 * b, rot: -.08, dy: -Math.abs(Math.sin(b * PI)) }),
    },
    { // turn around every half beat with a little hop, then a big leap at the end
      name: 'SPIN', fx: 'sparks',
      pose: b => {
        if (b >= 5) { const k = (b - 5) / 1.2; return { f: k < 1 ? 'jump' : 'stand', dy: up(k, 26), flip: Math.floor(b * 6) % 2 ? -1 : 1 }; }
        const k = frac(b * 2);
        return { f: k < .5 ? 'jump' : 'stand', dy: up(k / .5, 5), flip: Math.floor(b * 2) % 2 ? -1 : 1 };
      },
    },
    { // duck, pop up, duck, pop up … and a big jump every third beat
      name: 'DUCK & POP', fx: 'dust',
      pose: b => {
        if (b % 3 >= 2) { const k = b % 3 - 2; return { f: k < .85 ? 'jump' : 'stand', dy: up(k / .85, 22), sy: 1.06 }; }
        const k = frac(b * 2), low = Math.floor(b * 2) % 2 === 0;
        return low ? { f: 'duck', i: 0, sy: 1 - .1 * squash(k) } : { f: 'stand', sy: 1 + .08 * squash(k) };
      },
    },
    { // fast feet, hips swaying side to side
      name: 'SHIMMY', fx: 'notes',
      pose: b => ({ f: 'run', i: Math.floor(b * 8) % 4, rot: Math.sin(b * PI * 2) * .16, dy: -Math.abs(Math.sin(b * PI * 2)) * 2, sx: 1 + .06 * Math.sin(b * PI * 4) }),
    },
  ];
})();
