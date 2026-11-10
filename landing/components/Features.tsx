"use client";

import { motion } from "framer-motion";
import LazyVideo from "./LazyVideo";
import { DANCES } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;
const card = "relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-ink";
const reveal = { initial: { opacity: 0, y: 40 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, margin: "-8% 0px" } };

const BARS = [
  { name: "Jump", fill: 7, color: "#ffcf4a", note: "Higher full jump" },
  { name: "Toughness", fill: 5, color: "#ff3b5c", note: "+1 heart at 5 and 10" },
  { name: "Agility", fill: 6, color: "#7df9ff", note: "Double jump at 5" },
  { name: "Dash", fill: 3, color: "#b44dff", note: "Phase through hazards" },
];

export default function Features() {
  return (
    <section id="features" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div {...reveal} transition={{ duration: 0.7, ease }} className="max-w-2xl">
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-sun">Made with love, made in code</p>
          <h2 className="font-pixel text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.9]">
            Small game.
            <br />
            <span className="text-sun">Big feelings.</span>
          </h2>
        </motion.div>

        <div className="mt-14 grid auto-rows-[minmax(0,auto)] gap-4 md:grid-cols-6">
          {/* Victory dances */}
          <motion.div {...reveal} transition={{ duration: 0.7, ease }} className={`${card} md:col-span-4 md:row-span-2`}>
            <div className="grid h-full sm:grid-cols-[1fr_.8fr]">
              <div className="flex flex-col justify-between p-7 sm:p-9">
                <div>
                  <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-neon">World clear</p>
                  <h3 className="mt-3 font-pixel text-4xl leading-[0.95]">Every win ends in a dance.</h3>
                  <p className="mt-4 text-[15px] leading-relaxed text-bone/65">
                    A spotlight, a confetti burst and three seconds of choreography set to a dance track in the world&apos;s own key and tempo. Every species knows every move.
                  </p>
                </div>
                <ul className="mt-8 flex flex-wrap gap-2">
                  {DANCES.map((d, i) => (
                    <motion.li
                      key={d}
                      initial={{ opacity: 0, scale: 0.8 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: 0.3 + i * 0.08, type: "spring", stiffness: 300, damping: 18 }}
                      className="rounded-full border border-sun/30 bg-sun/[.08] px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-sun"
                    >
                      ♪ {d}
                    </motion.li>
                  ))}
                </ul>
              </div>
              <div className="relative min-h-[420px] overflow-hidden">
                <LazyVideo src="/media/v/dance02.mp4" poster="/media/p/dance02.jpg" label="Victory dance after clearing Neon Rain" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-transparent to-transparent max-sm:bg-gradient-to-b" />
              </div>
            </div>
          </motion.div>

          {/* Offline */}
          <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.08, ease }} className={`${card} p-7 md:col-span-2`}>
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cherry opacity-60" />
                <span className="relative inline-flex h-3 w-3 rounded-full bg-cherry" />
              </span>
              <span className="font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-bone/50">No connection</span>
            </div>
            <h3 className="mt-5 font-pixel text-3xl leading-[0.95]">Built for the moment the Wi-Fi dies.</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/60">No network calls, no accounts, no ads. Art, scenery and music are all generated on your device.</p>
          </motion.div>

          {/* Chiptune */}
          <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.16, ease }} className={`${card} p-7 md:col-span-2`}>
            <div className="flex h-14 items-end gap-1" aria-hidden>
              {Array.from({ length: 22 }, (_, i) => (
                <motion.span
                  key={i}
                  className="w-full rounded-sm bg-gradient-to-t from-ember to-sun"
                  animate={{ height: ["20%", `${30 + ((i * 37) % 70)}%`, "35%", `${20 + ((i * 53) % 80)}%`, "20%"] }}
                  transition={{ duration: 1.1 + (i % 4) * 0.15, repeat: Infinity, ease: "easeInOut", delay: i * 0.04 }}
                />
              ))}
            </div>
            <h3 className="mt-5 font-pixel text-3xl leading-[0.95]">A soundtrack written by code.</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/60">Every world has its own key, scale, tempo and lead voice, from lydian space arps to phrygian lava riffs. Bosses get their own tracks.</p>
          </motion.div>

          {/* Power bars */}
          <motion.div {...reveal} transition={{ duration: 0.7, ease }} className={`${card} p-7 sm:p-9 md:col-span-3`}>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ice">Dino upgrades</p>
            <h3 className="mt-3 font-pixel text-3xl leading-[0.95]">Bank coins. Fill the bars.</h3>
            <p className="mt-3 text-sm leading-relaxed text-bone/60">Coins bank even when you crash. Spend them on four power meters per dino, ten bars each.</p>
            <div className="mt-6 space-y-3">
              {BARS.map((b, bi) => (
                <div key={b.name}>
                  <div className="mb-1 flex justify-between font-mono text-[10px] font-bold uppercase tracking-[0.18em]">
                    <span style={{ color: b.color }}>{b.name}</span>
                    <span className="text-bone/40">{b.note}</span>
                  </div>
                  <div className="flex gap-1">
                    {Array.from({ length: 10 }, (_, k) => (
                      <motion.span
                        key={k}
                        className="h-3 flex-1 rounded-[3px] border border-white/10"
                        initial={{ backgroundColor: "rgba(255,255,255,.04)" }}
                        whileInView={k < b.fill ? { backgroundColor: b.color, boxShadow: `0 0 8px ${b.color}88` } : {}}
                        viewport={{ once: true }}
                        transition={{ delay: 0.3 + bi * 0.15 + k * 0.06, duration: 0.2 }}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Platforms */}
          <motion.div {...reveal} transition={{ duration: 0.7, delay: 0.08, ease }} className={`${card} p-7 sm:p-9 md:col-span-3`}>
            <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#5fd39a]">Two homes</p>
            <h3 className="mt-3 font-pixel text-3xl leading-[0.95]">Side panel by day. iPhone by night.</h3>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex h-24 overflow-hidden rounded-lg border border-white/10 bg-[#15121e]">
                  <div className="flex-1 space-y-1.5 p-2">
                    <div className="h-1.5 w-3/4 rounded bg-white/10" />
                    <div className="h-1.5 w-1/2 rounded bg-white/10" />
                    <div className="h-1.5 w-2/3 rounded bg-white/10" />
                  </div>
                  <div className="w-[38%] border-l border-white/10 bg-[linear-gradient(#2b1b4a,#c8536b_60%,#e3a466_60%)]" />
                </div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">Chrome side panel</p>
                <p className="mt-1 text-xs text-bone/50">Click the toolbar icon. Play next to any tab.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/30 p-4">
                <div className="mb-3 flex h-24 justify-center">
                  <div className="h-full w-12 rounded-[10px] border-2 border-white/15 bg-[linear-gradient(#07041a,#6a1a6a_60%,#161124_60%)]" />
                </div>
                <p className="font-mono text-[11px] font-bold uppercase tracking-[0.16em]">iPhone app</p>
                <p className="mt-1 text-xs text-bone/50">Big touch pads, safe-area aware, portrait.</p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
