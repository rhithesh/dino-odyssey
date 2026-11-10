"use client";

import { motion } from "framer-motion";
import LazyVideo from "./LazyVideo";
import Logo from "./Logo";
import { LINKS, WORLDS } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

const STEPS = [
  ["01", "Build it", "npm install && npm run build"],
  ["02", "Open extensions", "chrome://extensions → Developer mode"],
  ["03", "Load unpacked", "Pick the generated dist/ folder"],
  ["04", "Pin & play", "Click the icon. The side panel opens."],
];

export function Marquee() {
  const row = WORLDS.map((w) => w.name.toUpperCase());
  return (
    <div className="relative overflow-hidden border-y border-white/10 bg-ink/60 py-5" aria-hidden>
      <div className="flex w-max animate-marquee whitespace-nowrap">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0 items-center">
            {row.map((n, i) => (
              <span key={n + k} className="flex items-center font-pixel text-3xl text-bone/80">
                <span className="px-6">{n}</span>
                <span style={{ color: WORLDS[i].accent2 }}>✦</span>
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Finale() {
  return (
    <section id="play" className="relative isolate overflow-hidden py-32 sm:py-40">
      <div className="scanlines absolute inset-0 -z-10">
        <LazyVideo src="/media/v/boss08.mp4" poster="/media/p/boss08.jpg" className="h-full w-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-night via-night/70 to-night" />
      </div>
      <div className="mx-auto max-w-5xl px-5 text-center sm:px-8">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.9, ease }}>
          <Logo size="lg" />
        </motion.div>
        <motion.p initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.2, duration: 0.7, ease }} className="mx-auto mt-6 max-w-xl text-lg text-bone/70">
          66 million years in the making. Free, offline, and one click away from your next lost connection.
        </motion.p>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.3, duration: 0.7, ease }} className="mt-10 flex flex-wrap justify-center gap-3">
          <a href={LINKS.chrome} className="btn-chunky rounded-2xl bg-gradient-to-b from-[#ffe08a] via-sun to-ember px-8 py-4 font-mono text-sm font-extrabold uppercase tracking-[0.18em] text-[#2a1205] transition-transform hover:-translate-y-0.5">
            Add to Chrome
          </a>
          <a href={LINKS.ios} className="btn-chunky rounded-2xl border border-white/15 bg-white/[.07] px-7 py-4 font-mono text-sm font-bold uppercase tracking-[0.16em] backdrop-blur hover:bg-white/[.12]">
            Get it on iPhone
          </a>
          <a href="#demo" className="rounded-2xl px-5 py-4 font-mono text-sm font-bold uppercase tracking-[0.16em] text-bone/70 hover:text-bone">
            ▶ Play in browser
          </a>
        </motion.div>

        <motion.ol
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          variants={{ show: { transition: { staggerChildren: 0.1, delayChildren: 0.3 } } }}
          className="mt-20 grid gap-3 text-left sm:grid-cols-2 lg:grid-cols-4"
        >
          {STEPS.map(([n, t, d]) => (
            <motion.li key={n} variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="rounded-2xl border border-white/10 bg-night/70 p-5 backdrop-blur">
              <span className="font-pixel text-3xl text-sun">{n}</span>
              <p className="mt-2 font-mono text-xs font-extrabold uppercase tracking-[0.16em]">{t}</p>
              <p className="mt-1.5 font-mono text-[12px] leading-relaxed text-bone/55">{d}</p>
            </motion.li>
          ))}
        </motion.ol>
        <p className="mt-4 font-mono text-[11px] text-bone/40">Running from source? These are the developer-mode steps. iOS builds with `npm run ios` and Xcode.</p>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="border-t border-white/10 py-10">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-5 font-mono text-[11px] uppercase tracking-[0.18em] text-bone/40 sm:px-8">
        <span className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={20} height={20} className="pixelated h-5 w-5 rounded" />
          Dino Odyssey
        </span>
        <span>All footage is real gameplay, captured from the game.</span>
        <a href="#top" className="hover:text-bone">
          Back to top ↑
        </a>
      </div>
    </footer>
  );
}
