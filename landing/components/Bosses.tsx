"use client";

import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import LazyVideo from "./LazyVideo";
import { BOSSES, type Boss } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

export default function Bosses() {
  return (
    <section id="bosses" className="relative py-28 sm:py-36">
      <WarningTape />
      <div className="mx-auto mt-20 max-w-6xl px-5 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }} className="max-w-2xl">
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-cherry">Three boss fights</p>
          <h2 className="font-pixel text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.9]">
            At the end of the run,
            <br />
            <span className="text-cherry">something is waiting.</span>
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-bone/65">
            The music cuts, a siren wails, the letterbox closes in. Then you dodge its attacks and grab glowing orbs to throw the light back at it.
          </p>
        </motion.div>

        <div className="mt-16 flex flex-col gap-10">
          {BOSSES.map((b, i) => (
            <BossPanel key={b.slug} b={b} i={i} />
          ))}
        </div>
      </div>
    </section>
  );
}

function WarningTape() {
  const text = Array.from({ length: 10 }, () => "⚠ WARNING ⚠ BOSS APPROACHING").join("   ");
  return (
    <div className="relative -rotate-2 overflow-hidden border-y-4 border-black bg-sun py-3 shadow-[0_10px_40px_rgba(255,207,74,.25)]" aria-hidden>
      <div className="absolute inset-x-0 top-0 h-2 bg-[repeating-linear-gradient(45deg,#000_0_10px,transparent_10px_20px)]" />
      <div className="absolute inset-x-0 bottom-0 h-2 bg-[repeating-linear-gradient(45deg,#000_0_10px,transparent_10px_20px)]" />
      <div className="flex w-max animate-marquee whitespace-nowrap py-1 font-pixel text-3xl text-black">
        <span className="pr-8">{text}</span>
        <span className="pr-8">{text}</span>
      </div>
    </div>
  );
}

function BossPanel({ b, i }: { b: Boss; i: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], [60, -60]);
  const flip = i % 2 === 1;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{ duration: 0.8, ease }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-ink"
      style={{ background: `radial-gradient(ellipse at ${flip ? "100%" : "0%"} 50%, ${b.accent}22, transparent 60%), #0e0a18` }}
    >
      <div className={`grid items-center gap-0 lg:grid-cols-[1.25fr_1fr] ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
        <div className="scanlines relative aspect-[5/4] overflow-hidden">
          <motion.div style={{ y }} className="absolute -inset-y-[60px] inset-x-0">
            <LazyVideo src={`/media/v/${b.slug}.mp4`} poster={`/media/p/${b.slug}.jpg`} label={`${b.name} boss fight`} className="h-full w-full object-cover" />
          </motion.div>
          <div className={`absolute inset-0 ${flip ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-transparent via-transparent to-[#0e0a18]/90 max-lg:bg-gradient-to-b`} />
        </div>
        <div className="relative p-7 sm:p-10">
          <p className="font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-bone/45">
            Boss {i + 1}/3 · World {b.worldId} · {b.world}
          </p>
          <h3 className="mt-3 font-pixel text-[clamp(2.2rem,4.5vw,3.6rem)] leading-[0.9]" style={{ color: b.accent, textShadow: `0 0 30px ${b.accent}66` }}>
            {b.name}
          </h3>
          <div className="mt-5">
            <div className="mb-1.5 flex justify-between font-mono text-[10px] font-bold tracking-[0.2em] text-[#ff5470]">
              <span>{b.name.toUpperCase()}</span>
              <span>{b.hp} HP</span>
            </div>
            <div className="flex gap-1">
              {Array.from({ length: b.hp }, (_, k) => (
                <motion.span
                  key={k}
                  className="h-3 flex-1 rounded-[3px] border border-[#ff5470]/60 bg-gradient-to-r from-[#ff0033] to-[#ff7a45] shadow-[0_0_10px_#ff003399]"
                  initial={{ opacity: 1 }}
                  animate={inView && k >= b.hp - 2 ? { opacity: [1, 0.2, 1, 0.15] } : {}}
                  transition={{ delay: 1 + (b.hp - k) * 0.5, duration: 0.6 }}
                />
              ))}
            </div>
          </div>
          <p className="mt-6 text-[15px] leading-relaxed text-bone/70">{b.blurb}</p>
          <p className="mt-5 inline-flex rounded-lg border border-white/10 bg-black/30 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-[0.14em] text-bone/70">⚔ {b.attacks}</p>
        </div>
      </div>
    </motion.div>
  );
}
