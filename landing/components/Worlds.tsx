"use client";

import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import { useLayoutEffect, useRef, useState } from "react";
import LazyVideo from "./LazyVideo";
import { MODE_LABEL, WORLDS, type World } from "@/lib/content";

// Vertical scroll drives a horizontal track of world cards while the section is pinned.
export default function Worlds() {
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [dist, setDist] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      const t = track.current;
      if (t) setDist(Math.max(0, t.scrollWidth - window.innerWidth));
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (track.current) ro.observe(track.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const { scrollYProgress } = useScroll({ target: section, offset: ["start start", "end end"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });
  const x = useTransform(smooth, (v) => -v * dist);

  return (
    <section id="worlds" ref={section} className="relative" style={{ height: `calc(100svh + ${dist}px)` }}>
      <div className="sticky top-0 flex h-[100svh] flex-col justify-center overflow-hidden">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_50%_0%,rgba(255,42,109,.12),transparent_60%)]" />
        <div className="mx-auto mb-6 flex w-full max-w-6xl items-end justify-between gap-6 px-5 sm:mb-8 sm:px-8">
          <div>
            <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-neon">Twelve worlds</p>
            <h2 className="font-pixel text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.9] text-bone">
              Every world
              <br />
              <span className="text-sun">breaks a rule.</span>
            </h2>
          </div>
          <p className="hidden max-w-xs text-sm leading-relaxed text-bone/60 md:block">
            Swim through the abyss, flip gravity on a space station, outrun a tsunami. Each world has its own palette, weather, music key and twist.
          </p>
        </div>

        <motion.div ref={track} style={{ x }} className="flex w-max gap-4 px-5 sm:gap-5 sm:px-8 lg:px-[max(2rem,calc((100vw-72rem)/2+2rem))]">
          {WORLDS.map((w, i) => (
            <WorldCard key={w.id} w={w} i={i} />
          ))}
          <EndCard />
        </motion.div>

        <Progress p={smooth} />
      </div>
    </section>
  );
}

function WorldCard({ w, i }: { w: World; i: number }) {
  const light = w.id === 11;
  return (
    <motion.article
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.6, delay: Math.min(i, 4) * 0.06, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -8 }}
      className="group relative w-[min(290px,64vw,calc((100svh-290px)*0.5625))] shrink-0"
    >
      <div
        className="relative aspect-[9/16] overflow-hidden rounded-[1.4rem] border border-white/10 bg-ink shadow-[0_30px_60px_rgba(0,0,0,.5)] transition-shadow duration-300"
        style={{ boxShadow: `0 30px 60px rgba(0,0,0,.5), 0 0 0 1px ${w.accent}10` }}
      >
        <LazyVideo src={`/media/v/${w.slug}.mp4`} poster={`/media/p/${w.slug}.jpg`} margin="600px" label={`${w.name} gameplay`} className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
        <div
          className="absolute inset-0 rounded-[1.4rem] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{ boxShadow: `inset 0 0 0 2px ${w.accent}, 0 0 50px ${w.accent}55` }}
        />
        <div className="absolute left-3 top-3 flex items-center gap-1.5">
          <span className="rounded-md bg-black/60 px-2 py-1 font-mono text-[10px] font-extrabold tracking-[0.16em] text-bone backdrop-blur">W{String(w.id).padStart(2, "0")}</span>
          <span className="rounded-md px-2 py-1 font-mono text-[10px] font-extrabold tracking-[0.16em] text-black" style={{ background: w.accent2 }}>
            {MODE_LABEL[w.mode]}
          </span>
          {w.boss && <span className="rounded-md bg-cherry px-2 py-1 font-mono text-[10px] font-extrabold tracking-[0.16em] text-white">BOSS</span>}
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="font-mono text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: light ? "#e9e9e9" : w.accent }}>
            {w.twist}
          </p>
          <h3 className="mt-1 font-pixel text-[2rem] leading-none text-white">{w.name}</h3>
          <p className="mt-2 line-clamp-3 text-[13px] leading-snug text-white/70 transition-all duration-300 sm:max-h-0 sm:opacity-0 sm:group-hover:max-h-24 sm:group-hover:opacity-100">{w.detail}</p>
        </div>
      </div>
    </motion.article>
  );
}

function EndCard() {
  return (
    <div className="flex w-[min(290px,64vw,calc((100svh-290px)*0.5625))] shrink-0 flex-col justify-center rounded-[1.4rem] border border-dashed border-white/15 p-6">
      <p className="font-pixel text-5xl leading-none text-sun">+ ∞</p>
      <h3 className="mt-3 font-pixel text-3xl leading-none">Endless mode</h3>
      <p className="mt-3 text-sm leading-relaxed text-bone/60">No finish line. The scenery rotates through the worlds every 250 m while the speed ramps. Shields, magnets and double score drop in along the way.</p>
      <a href="#demo" className="mt-6 inline-block font-mono text-xs font-bold uppercase tracking-[0.2em] text-ice hover:underline">
        Try it now →
      </a>
    </div>
  );
}

function Progress({ p }: { p: MotionValue<number> }) {
  const scaleX = useTransform(p, [0, 1], [0.02, 1]);
  return (
    <div className="mx-auto mt-8 w-full max-w-6xl px-5 sm:px-8">
      <div className="h-[6px] overflow-hidden rounded-full border border-white/10 bg-black/40">
        <motion.div style={{ scaleX }} className="h-full origin-left rounded-full bg-gradient-to-r from-ember to-sun shadow-[0_0_12px_#ffcf4a]" />
      </div>
      <div className="mt-2 flex justify-between font-mono text-[10px] font-bold tracking-[0.2em] text-bone/40">
        <span>DESERT DAWN</span>
        <span>⚑ INDIRANAGAR</span>
      </div>
    </div>
  );
}
