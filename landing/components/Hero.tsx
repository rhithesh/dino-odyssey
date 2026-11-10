"use client";

import { motion, useScroll, useTransform, useSpring, useMotionValue } from "framer-motion";
import { useRef } from "react";
import LazyVideo from "./LazyVideo";
import Logo from "./Logo";
import Phone from "./Phone";
import Sprite from "./Sprite";
import { DINOS, LINKS } from "@/lib/content";

const STATS = [
  ["12", "worlds"],
  ["3", "bosses"],
  ["20", "dinosaurs"],
  ["0", "bars of signal needed"],
];

const RUNNERS = ["trex", "raptor", "stego", "unicorn", "ankylo", "galli", "spino", "compy"];

const ease = [0.22, 1, 0.36, 1] as const;

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "25%"]);
  const textY = useTransform(scrollYProgress, [0, 1], [0, -120]);
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  // Phone tilts toward the cursor.
  const mx = useMotionValue(0), my = useMotionValue(0);
  const rx = useSpring(useTransform(my, [-1, 1], [8, -8]), { stiffness: 120, damping: 18 });
  const ry = useSpring(useTransform(mx, [-1, 1], [-12, 12]), { stiffness: 120, damping: 18 });

  return (
    <section
      id="top"
      ref={ref}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        mx.set(((e.clientX - r.left) / r.width) * 2 - 1);
        my.set(((e.clientY - r.top) / r.height) * 2 - 1);
      }}
      className="relative isolate flex min-h-[100svh] items-center overflow-hidden pt-24 pb-36"
    >
      {/* Background reel */}
      <motion.div style={{ y: bgY }} className="scanlines absolute inset-0 -z-10">
        <LazyVideo src="/media/v/hero-wide.mp4" poster="/media/p/hero-wide.jpg" eager className="pixelated h-full w-full scale-110 object-cover opacity-55 blur-[2px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_40%,rgba(7,5,13,.35),rgba(7,5,13,.92)_70%)]" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-night to-transparent" />
        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-night/80 to-transparent" />
      </motion.div>

      <div className="mx-auto grid w-full max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-[1.15fr_.85fr]">
        <motion.div style={{ y: textY, opacity: fade }} className="text-center lg:text-left">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6, ease }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 font-mono text-[11px] tracking-wide text-bone/80 backdrop-blur"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cherry opacity-70" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-cherry shadow-[0_0_8px_#ff3b5c]" />
            </span>
            You&apos;re offline. Perfect timing.
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.92, filter: "blur(12px)" }}
            animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.45, duration: 0.9, ease }}
            className="animate-float"
          >
            <span className="sr-only">Dino Odyssey</span>
            <Logo size="xl" />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7, ease }}
            className="mx-auto mt-6 max-w-xl text-balance text-lg leading-relaxed text-bone/75 sm:text-xl lg:mx-0"
          >
            The offline dino game, <em className="not-italic text-sun">reimagined</em>. Twelve cinematic worlds, three bosses, twenty dinosaurs and a chiptune
            soundtrack written by code. It lives in your Chrome side panel and on your iPhone.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.7, ease }}
            className="mt-9 flex flex-wrap items-center justify-center gap-3 lg:justify-start"
          >
            <a href="#demo" className="btn-chunky group rounded-2xl bg-gradient-to-b from-[#ffe08a] via-sun to-ember px-7 py-4 font-mono text-sm font-extrabold uppercase tracking-[0.18em] text-[#2a1205] transition-transform hover:-translate-y-0.5">
              ▶ Play in browser
            </a>
            <a href={LINKS.chrome} className="btn-chunky rounded-2xl border border-white/15 bg-white/[.07] px-6 py-4 font-mono text-sm font-bold uppercase tracking-[0.16em] text-bone backdrop-blur transition hover:bg-white/[.12]">
              Add to Chrome
            </a>
            <a href={LINKS.ios} className="rounded-2xl px-4 py-4 font-mono text-sm font-bold uppercase tracking-[0.16em] text-bone/70 underline-offset-4 transition hover:text-bone hover:underline">
              iPhone ↗
            </a>
          </motion.div>

          <motion.dl
            initial="hidden"
            animate="show"
            variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 1.2 } } }}
            className="mt-12 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4"
          >
            {STATS.map(([n, l]) => (
              <motion.div key={l} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} className="border-l border-white/10 pl-4 text-left">
                <dt className="font-pixel text-4xl text-bone">{n}</dt>
                <dd className="font-mono text-[11px] uppercase tracking-[0.14em] text-bone/50">{l}</dd>
              </motion.div>
            ))}
          </motion.dl>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 60, rotate: 6 }}
          animate={{ opacity: 1, y: 0, rotate: 0 }}
          transition={{ delay: 0.5, duration: 1.1, ease }}
          className="relative mx-auto w-[min(78vw,330px)] [perspective:1200px]"
        >
          <div className="absolute -inset-16 -z-10 rounded-full bg-[radial-gradient(circle,rgba(255,140,60,.35),transparent_65%)] blur-2xl" />
          <motion.div style={{ rotateX: rx, rotateY: ry }} className="[transform-style:preserve-3d]">
            <Phone src="/media/v/hero-phone.mp4" poster="/media/p/hero-phone.jpg" eager label="Dino Odyssey gameplay reel" />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.5, duration: 0.6, ease }}
            className="absolute -right-6 top-16 hidden rotate-3 rounded-xl border border-white/10 bg-night/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-ice shadow-xl backdrop-blur sm:block"
          >
            Real gameplay ·<br /> no edits
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.7, duration: 0.6, ease }}
            className="absolute -left-10 bottom-24 hidden -rotate-3 rounded-xl border border-white/10 bg-night/80 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-sun shadow-xl backdrop-blur sm:block"
          >
            ♪ Procedural <br />chiptune
          </motion.div>
        </motion.div>
      </div>

      <RunnerStrip />
    </section>
  );
}

// A strip of ground along the bottom of the hero with dinos running across it.
function RunnerStrip() {
  const list = RUNNERS.map((id) => DINOS.find((d) => d.id === id)!).filter(Boolean);
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 overflow-hidden" aria-hidden>
      <div className="absolute inset-x-0 bottom-9 h-px bg-gradient-to-r from-transparent via-sun/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-9 bg-[repeating-linear-gradient(90deg,rgba(255,207,74,.08)_0_2px,transparent_2px_26px)]" />
      {list.map((d, i) => (
        <motion.div
          key={d.id}
          className="absolute bottom-9"
          initial={{ x: "-12vw" }}
          animate={{ x: "112vw" }}
          transition={{ duration: 16 + (i % 3) * 3, repeat: Infinity, ease: "linear", delay: i * 2.4 }}
        >
          <Sprite id={d.id} w={d.w} h={d.h} scale={2} speed={0.4} />
        </motion.div>
      ))}
    </div>
  );
}
