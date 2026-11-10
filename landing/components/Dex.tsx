"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Sprite from "./Sprite";
import { DINOS } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;
const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export default function Dex() {
  const [sel, setSel] = useState("trex");
  const D = DINOS.find((d) => d.id === sel) ?? DINOS[0];

  return (
    <section id="dex" className="relative py-28 sm:py-36">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }} className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-ice">Dino Dex</p>
            <h2 className="font-pixel text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.9]">
              Twenty species.
              <br />
              <span className="text-ice">One hitbox.</span>
            </h2>
          </div>
          <p className="max-w-sm text-[15px] leading-relaxed text-bone/60">
            From Compsognathus to T-Rex, each with its own pixel art and its own perk. Every species shares the same hitbox, so a skin never makes the game easier. Only the starting power bars differ.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[380px_1fr]">
          {/* Spotlight */}
          <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink p-7 lg:sticky lg:top-24 lg:self-start">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgba(125,249,255,.12),transparent_60%)]" />
            <div className="absolute inset-x-0 top-[58%] h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <AnimatePresence mode="wait">
              <motion.div key={D.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.3, ease }} className="relative">
                <div className="flex h-56 items-end justify-center pb-2">
                  <Sprite id={D.id} w={D.w} h={D.h} scale={6} speed={0.45} />
                </div>
                <p className="mt-6 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-bone/45">{D.era}</p>
                <h3 className="mt-1 font-pixel text-4xl leading-none">{D.name}</h3>
                <p className="mt-2 font-mono text-sm tracking-[0.2em] text-sun">{stars(D.tier)}</p>
                <p className="mt-4 text-[15px] text-bone/75">{D.perk}.</p>
                <p className="mt-4 inline-block rounded-lg border border-white/10 bg-black/30 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.18em] text-bone/60">
                  {D.hint ? `🔒 Unlock: ${D.hint}` : "✓ Playable from the start"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Grid */}
          <motion.ul
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-10% 0px" }}
            variants={{ show: { transition: { staggerChildren: 0.03 } } }}
            className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4"
          >
            {DINOS.map((d) => {
              const on = d.id === sel;
              return (
                <motion.li key={d.id} variants={{ hidden: { opacity: 0, scale: 0.9 }, show: { opacity: 1, scale: 1 } }}>
                  <button
                    onClick={() => setSel(d.id)}
                    onMouseEnter={() => setSel(d.id)}
                    aria-pressed={on}
                    className={`group relative flex w-full flex-col items-center rounded-2xl border px-3 pb-3 pt-4 text-center transition ${
                      on ? "border-ice/60 bg-ice/[.07] shadow-[0_0_30px_rgba(125,249,255,.15)]" : "border-white/10 bg-white/[.025] hover:border-white/25 hover:bg-white/[.05]"
                    }`}
                  >
                    <div className="flex h-24 items-end">
                      <Sprite id={d.id} w={d.w} h={d.h} scale={3} speed={0.5} paused={!on} />
                    </div>
                    <span className="mt-2 font-pixel text-xl leading-none">{d.short}</span>
                    <span className="mt-1 font-mono text-[10px] tracking-[0.18em] text-sun/80">{stars(d.tier)}</span>
                  </button>
                </motion.li>
              );
            })}
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
