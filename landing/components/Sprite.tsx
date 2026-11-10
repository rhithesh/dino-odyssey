// A dino's 4-frame run cycle from /media/dinos/<id>.png, scaled up with crisp pixels.
export default function Sprite({ id, w, h, scale = 3, speed = 0.5, paused = false, className = "", style }: { id: string; w: number; h: number; scale?: number; speed?: number; paused?: boolean; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      role="img"
      aria-label={id}
      className={`sprite ${className}`}
      style={{
        width: w * scale,
        height: h * scale,
        backgroundImage: `url(/media/dinos/${id}.png)`,
        animationDuration: `${speed}s`,
        animationPlayState: paused ? "paused" : "running",
        ['--fw' as string]: `${w * scale}px`,
        ...style,
      }}
    />
  );
}
