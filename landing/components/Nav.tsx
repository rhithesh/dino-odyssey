"use client";

import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";
import { LINKS } from "@/lib/content";
import Logo from "./Logo";

const ITEMS = [
  ["Worlds", "#worlds"],
  ["Bosses", "#bosses"],
  ["Dino Dex", "#dex"],
  ["Play", "#demo"],
] as const;

export default function Nav() {
  const { scrollY } = useScroll();
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  useMotionValueEvent(scrollY, "change", (y) => setSolid(y > 40));

  return (
    <motion.header
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.2 }}
      className="fixed inset-x-0 top-0 z-50 px-4 pt-3 sm:px-6"
    >
      <nav
        className={`mx-auto flex max-w-6xl items-center justify-between rounded-2xl border px-3 py-2 transition-all duration-300 sm:px-4 ${
          solid ? "border-white/10 bg-night/75 shadow-[0_10px_40px_rgba(0,0,0,.45)] backdrop-blur-xl" : "border-transparent bg-transparent"
        }`}
      >
        <a href="#top" className="flex items-center gap-2.5" aria-label="Dino Odyssey home">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/icon.png" alt="" width={32} height={32} className="pixelated h-8 w-8 rounded-lg" />
          <Logo size="sm" />
        </a>
        <div className="hidden items-center gap-1 md:flex">
          {ITEMS.map(([label, href]) => (
            <a key={href} href={href} className="rounded-lg px-3 py-2 font-mono text-[12px] font-bold uppercase tracking-[0.18em] text-bone/70 transition hover:bg-white/5 hover:text-bone">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <a
            href={LINKS.chrome}
            className="btn-chunky hidden rounded-xl bg-gradient-to-b from-[#ffe08a] to-ember px-4 py-2 font-mono text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#2a1205] sm:inline-block"
          >
            Get the game
          </a>
          <button
            className="rounded-lg border border-white/15 px-3 py-2 font-mono text-xs font-bold md:hidden"
            onClick={() => setOpen((o) => !o)}
            aria-expanded={open}
            aria-label="Menu"
          >
            {open ? "✕" : "☰"}
          </button>
        </div>
      </nav>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-auto mt-2 flex max-w-6xl flex-col rounded-2xl border border-white/10 bg-night/95 p-2 backdrop-blur-xl md:hidden"
        >
          {ITEMS.map(([label, href]) => (
            <a key={href} href={href} onClick={() => setOpen(false)} className="rounded-lg px-4 py-3 font-mono text-sm font-bold uppercase tracking-[0.18em] text-bone/80 hover:bg-white/5">
              {label}
            </a>
          ))}
        </motion.div>
      )}
    </motion.header>
  );
}
