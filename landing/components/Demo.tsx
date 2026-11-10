"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";
import { LINKS } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

const KEYS = [
  ["Space / ↑ / tap", "Jump (hold for higher)"],
  ["↓", "Duck · fast-fall"],
  ["Shift / D / →", "Dash"],
  ["P / Esc", "Pause"],
  ["M", "Mute"],
];

// The real game, running in an iframe. The web build is copied to /public/play by `npm run sync-game`.
export default function Demo() {
  const [on, setOn] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);

  return (
    <section id="demo" className="relative overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_60%,rgba(255,140,60,.14),transparent_60%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1fr_auto]">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ember">Play it right here</p>
          <h2 className="font-pixel text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.9]">
            Enough watching.
            <br />
            <span className="text-ember">Press start.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-bone/65">
            This is the full game, the same build that ships in the extension. Your progress saves in this browser. Sound is on, so turn it up.
          </p>
          <dl className="mt-8 grid max-w-md gap-2">
            {KEYS.map(([k, v]) => (
              <div key={k} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[.03] px-4 py-2.5">
                <dt className="font-mono text-xs font-extrabold tracking-[0.12em] text-sun">{k}</dt>
                <dd className="text-sm text-bone/65">{v}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-8 flex flex-wrap gap-3">
            <a href={LINKS.chrome} className="btn-chunky rounded-xl border border-white/15 bg-white/[.07] px-5 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] hover:bg-white/[.12]">
              Get the Chrome extension
            </a>
            <a href="/play/index.html" target="_blank" rel="noreferrer" className="rounded-xl px-4 py-3 font-mono text-xs font-bold uppercase tracking-[0.16em] text-bone/60 hover:text-bone">
              Open full screen ↗
            </a>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50, rotate: -3 }}
          whileInView={{ opacity: 1, y: 0, rotate: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease }}
          className="relative mx-auto w-[min(86vw,380px)]"
        >
          <div className="rounded-[2.6rem] bg-gradient-to-b from-[#2b2638] to-[#100d18] p-[10px] shadow-[0_40px_120px_rgba(0,0,0,.7),0_0_0_1px_rgba(255,255,255,.08)]">
            <div className="relative aspect-[9/17] overflow-hidden rounded-[2rem] bg-black">
              {on && <iframe ref={frame} src="/play/index.html" title="Dino Odyssey, playable" className="absolute inset-0 h-full w-full border-0" allow="autoplay" onLoad={() => frame.current?.focus()} />}
              <AnimatePresence>
                {!on && (
                  <motion.button
                    key="boot"
                    exit={{ opacity: 0, scale: 1.05 }}
                    onClick={() => setOn(true)}
                    className="group absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[url(/media/p/w02.jpg)] bg-cover bg-center"
                  >
                    <span className="absolute inset-0 bg-night/60 backdrop-blur-[2px]" />
                    <motion.span
                      animate={{ scale: [1, 1.08, 1] }}
                      transition={{ duration: 1.6, repeat: Infinity }}
                      className="btn-chunky relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-b from-[#ffe08a] to-ember text-4xl text-[#2a1205]"
                    >
                      ▶
                    </motion.span>
                    <span className="relative font-pixel text-3xl text-bone">Tap to boot</span>
                    <span className="relative font-mono text-[10px] font-bold uppercase tracking-[0.25em] text-bone/60">~200 KB · runs offline</span>
                  </motion.button>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
