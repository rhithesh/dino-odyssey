import LazyVideo from "./LazyVideo";

// A simple phone bezel around a portrait gameplay video.
export default function Phone({ src, poster, eager, className = "", label }: { src: string; poster?: string; eager?: boolean; className?: string; label?: string }) {
  return (
    <div className={`relative rounded-[2.6rem] bg-gradient-to-b from-[#2b2638] to-[#100d18] p-[10px] shadow-[0_40px_120px_rgba(0,0,0,.7),0_0_0_1px_rgba(255,255,255,.08),inset_0_1px_0_rgba(255,255,255,.12)] ${className}`}>
      <div className="relative aspect-[9/16] overflow-hidden rounded-[2rem] bg-black">
        <LazyVideo src={src} poster={poster} eager={eager} label={label} className="absolute inset-0 h-full w-full object-cover" />
        <div className="pointer-events-none absolute left-1/2 top-2 h-[22px] w-[34%] -translate-x-1/2 rounded-full bg-black" />
        <div className="pointer-events-none absolute inset-0 rounded-[2rem] shadow-[inset_0_0_0_1px_rgba(255,255,255,.06)]" />
      </div>
      <div className="absolute -right-[3px] top-28 h-16 w-[3px] rounded-r bg-[#2b2638]" />
      <div className="absolute -left-[3px] top-24 h-10 w-[3px] rounded-l bg-[#2b2638]" />
      <div className="absolute -left-[3px] top-36 h-10 w-[3px] rounded-l bg-[#2b2638]" />
    </div>
  );
}
