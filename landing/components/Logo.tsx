// The game's title lockup: chunky gold "DINO" over a red script "Odyssey" (see sidepanel.html, title screen).
// ByteBounce caps are small inside their em box, so the script is sized well below the pixel word.
const SIZES = {
  xl: { dino: "text-[clamp(5rem,13vw,10rem)]", script: "text-[clamp(2.9rem,7.2vw,5.6rem)] -mt-[0.42em]" },
  lg: { dino: "text-[clamp(4rem,9vw,7rem)]", script: "text-[clamp(2.3rem,5vw,3.9rem)] -mt-[0.42em]" },
  sm: { dino: "text-[2.3rem] -mt-[0.2em]", script: "text-[1.35rem] -mt-[0.72em]" },
};

export default function Logo({ size = "lg" }: { size?: keyof typeof SIZES }) {
  const s = SIZES[size];
  const glow = size !== "sm";
  return (
    <span className="inline-flex flex-col items-center leading-[0.9] select-none">
      <span
        className={`${s.dino} font-pixel tracking-[0.04em] bg-gradient-to-b from-[#fff6d5] via-sun to-ember bg-clip-text text-transparent`}
        style={{ filter: glow ? "drop-shadow(0 6px 0 #3a1408) drop-shadow(0 0 30px rgba(255,140,60,.45))" : "drop-shadow(0 2px 0 #3a1408)" }}
      >
        DINO
      </span>
      <span
        className={`${s.script} relative z-[1] font-script leading-[1.3] text-cherry px-[0.15em]`}
        style={{ textShadow: glow ? "0 4px 0 #4a0010, 0 0 40px rgba(255,59,92,.35)" : "0 2px 0 #4a0010" }}
      >
        Odyssey
      </span>
    </span>
  );
}
