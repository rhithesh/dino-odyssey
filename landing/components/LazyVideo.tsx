"use client";

import { useEffect, useRef, useState } from "react";

type Props = {
  src: string;
  poster?: string;
  className?: string;
  /** Start loading before the video scrolls in (px). */
  margin?: string;
  /** Load immediately instead of waiting for the viewport (hero). */
  eager?: boolean;
  /** Pause while off screen. */
  pauseOffscreen?: boolean;
  label?: string;
};

// Muted, looping gameplay footage that only downloads and plays while it is near the viewport.
export default function LazyVideo({ src, poster, className = "", margin = "300px", eager = false, pauseOffscreen = true, label }: Props) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(eager);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setLoad(true);
          if (!reduce) v.play().catch(() => {});
        } else if (pauseOffscreen) v.pause();
      },
      { rootMargin: margin },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [margin, pauseOffscreen]);

  return (
    <video
      ref={ref}
      className={className}
      poster={poster}
      muted
      loop
      playsInline
      preload={load ? "auto" : "none"}
      aria-label={label}
      src={load ? src : undefined}
      onLoadedData={(e) => {
        if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) e.currentTarget.play().catch(() => {});
      }}
    />
  );
}
