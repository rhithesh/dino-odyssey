"use client";

import { AnimatePresence, motion, useAnimationControls } from "framer-motion";
import { useMemo, useState } from "react";
import Sprite from "./Sprite";
import { MY_COLORS, dinoNameFor } from "@/lib/content";

const ease = [0.22, 1, 0.36, 1] as const;

// Pixel egg drawn as SVG rects: a rasterised ellipse, a shaded right edge and green spots.
function Egg({ part = "whole" }: { part?: "whole" | "top" | "bottom" }) {
  const rects = useMemo(() => {
    const W = 18, H = 22, out: { x: number; y: number; c: string }[] = [];
    const spots = [[5, 7, 2], [11, 5, 1.4], [12, 13, 2.2], [6, 16, 1.6]];
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const dy = (y - 12) / (y < 12 ? 11.5 : 9.8), dx = (x - 8.5) / (8.8 - (y < 12 ? (12 - y) * 0.18 : 0));
        if (dx * dx + dy * dy > 1) continue;
        // jagged crack line across the middle
        const crack = 10 + ((x % 4) < 2 ? 0 : 1);
        if (part === "top" && y > crack) continue;
        if (part === "bottom" && y <= crack) continue;
        const edge = dx * dx + dy * dy > 0.78;
        let c = x > 11 ? "#e6d8b4" : "#f6ecd2";
        if (edge) c = "#b89a6a";
        for (const [sx, sy, r] of spots) if ((x - sx) ** 2 + (y - sy) ** 2 <= r * r && !edge) c = x > 11 ? "#4fa877" : "#6fd39a";
        if (x === 5 && y > 3 && y < 7) c = "#fffaf0";
        out.push({ x, y, c });
      }
    return out;
  }, [part]);
  return (
    <svg viewBox="0 0 18 22" className="h-full w-full" shapeRendering="crispEdges" aria-hidden>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={1.02} height={1.02} fill={r.c} />
      ))}
    </svg>
  );
}

export default function Hatch() {
  const [name, setName] = useState("");
  const [color, setColor] = useState(0);
  const [stage, setStage] = useState<"egg" | "shaking" | "hatched">("egg");
  const shake = useAnimationControls();
  const dino = dinoNameFor(name);

  async function hatch() {
    if (stage === "shaking") return;
    if (stage === "hatched") {
      setStage("egg");
      return;
    }
    setStage("shaking");
    await shake.start({ rotate: [0, -6, 6, -9, 9, -12, 12, -4, 0], x: [0, -2, 2, -3, 3, -4, 4, 0, 0], transition: { duration: 1.3, ease: "easeInOut" } });
    setStage("hatched");
  }

  const C = MY_COLORS[color];

  return (
    <section id="hatch" className="relative overflow-hidden py-28 sm:py-36">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_70%_50%,rgba(95,211,154,.12),transparent_60%)]" />
      <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 sm:px-8 lg:grid-cols-2">
        <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.7, ease }}>
          <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-[0.3em] text-[#5fd39a]">First launch</p>
          <h2 className="font-pixel text-[clamp(2.4rem,6vw,4.6rem)] leading-[0.9]">
            Something is
            <br />
            <span className="text-[#5fd39a]">about to hatch.</span>
          </h2>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-bone/65">
            Every new player hatches their own dinosaur, named after them. Pick its colour, and it becomes your starter. A short training run teaches the
            hop, the full jump, the duck and the fast-fall. Try it here:
          </p>

          <label className="mt-8 block font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-bone/50" htmlFor="hatch-name">
            Your name
          </label>
          <div className="mt-2 flex flex-wrap gap-3">
            <input
              id="hatch-name"
              value={name}
              maxLength={16}
              onChange={(e) => {
                setName(e.target.value);
                if (stage === "hatched") setStage("egg");
              }}
              onKeyDown={(e) => e.key === "Enter" && hatch()}
              placeholder="Type your name"
              autoComplete="off"
              className="min-w-0 flex-1 rounded-xl border border-white/15 bg-black/40 px-4 py-3.5 font-mono text-base font-bold uppercase tracking-[0.14em] text-bone outline-none placeholder:normal-case placeholder:tracking-normal placeholder:text-bone/30 focus:border-[#5fd39a] focus:shadow-[0_0_0_3px_rgba(95,211,154,.2)]"
            />
            <button
              onClick={hatch}
              className="btn-chunky rounded-xl bg-gradient-to-b from-[#ffe08a] to-ember px-6 py-3.5 font-mono text-sm font-extrabold uppercase tracking-[0.18em] text-[#2a1205]"
            >
              {stage === "hatched" ? "↻ Again" : "Hatch"}
            </button>
          </div>
          <div className="mt-5 flex items-center gap-2" role="radiogroup" aria-label="Dino colour">
            {MY_COLORS.map((c, i) => (
              <button
                key={c.name}
                role="radio"
                aria-checked={color === i}
                aria-label={c.name}
                onClick={() => setColor(i)}
                className={`h-9 w-9 rounded-full border-2 transition ${color === i ? "scale-110 border-white" : "border-white/10 hover:scale-105"}`}
                style={{ background: `linear-gradient(135deg, ${c.body} 60%, ${c.accent} 60%)` }}
              />
            ))}
            <span className="ml-2 font-mono text-[11px] font-bold uppercase tracking-[0.2em] text-bone/45">{C.name}</span>
          </div>
        </motion.div>

        <div className="relative mx-auto flex aspect-square w-full max-w-[440px] items-center justify-center">
          <div className="absolute inset-[12%] rounded-full blur-3xl transition-colors duration-500" style={{ background: `radial-gradient(circle, ${C.body}44, transparent 70%)` }} />
          {/* light rays while it shakes */}
          <AnimatePresence>
            {stage === "shaking" && (
              <motion.div
                key="rays"
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1.1, rotate: 30 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.3 }}
                className="absolute inset-0 rounded-full bg-[repeating-conic-gradient(from_0deg,rgba(255,220,140,.28)_0deg_6deg,transparent_6deg_24deg)] [mask-image:radial-gradient(circle,black_20%,transparent_65%)]"
              />
            )}
          </AnimatePresence>

          <div className="absolute bottom-[22%] h-6 w-44 rounded-[50%] bg-black/50 blur-md" />

          <AnimatePresence mode="popLayout">
            {stage !== "hatched" ? (
              <motion.div key="egg" animate={shake} exit={{ opacity: 0 }} className="relative h-[46%] w-[38%] origin-bottom">
                <Egg />
              </motion.div>
            ) : (
              <motion.div key="hatched" className="relative flex h-full w-full flex-col items-center justify-center">
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0 }} transition={{ duration: 0.5 }} className="pointer-events-none absolute inset-0 rounded-full bg-white/80 blur-2xl" />
                <motion.div initial={{ y: 0, x: 0, rotate: 0, opacity: 1 }} animate={{ y: -160, x: 70, rotate: 120, opacity: 0 }} transition={{ duration: 0.9, ease: "easeOut" }} className="absolute top-[27%] h-[46%] w-[38%]">
                  <Egg part="top" />
                </motion.div>
                <motion.div initial={{ opacity: 1 }} animate={{ opacity: 0, y: 20 }} transition={{ delay: 0.6, duration: 0.6 }} className="absolute top-[27%] h-[46%] w-[38%]">
                  <Egg part="bottom" />
                </motion.div>
                {[...Array(14)].map((_, k) => (
                  <motion.span
                    key={k}
                    className="absolute h-2 w-2"
                    style={{ background: k % 2 ? C.body : "#f6ecd2", top: "52%", left: "50%" }}
                    initial={{ x: 0, y: 0, opacity: 1 }}
                    animate={{ x: Math.cos((k / 14) * Math.PI * 2) * 150, y: Math.sin((k / 14) * Math.PI * 2) * 110 - 40, opacity: 0 }}
                    transition={{ duration: 0.9, ease: "easeOut" }}
                  />
                ))}
                <motion.div initial={{ scale: 0, y: 30 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 14, delay: 0.2 }} className="mt-6">
                  <Sprite id={`mine-${color}`} w={31} h={31} scale={6} speed={0.55} />
                </motion.div>
                <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="mt-3 font-mono text-[11px] font-bold uppercase tracking-[0.4em] text-bone/50">
                  Meet
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.p
            key={dino}
            initial={{ opacity: 0.4, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute bottom-[6%] max-w-full truncate px-2 font-pixel text-[clamp(2rem,5vw,3.2rem)] leading-none"
            style={{ color: C.body, textShadow: `0 4px 0 rgba(0,0,0,.6), 0 0 30px ${C.body}55` }}
          >
            {dino}
          </motion.p>
        </div>
      </div>
    </section>
  );
}
