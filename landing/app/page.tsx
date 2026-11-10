import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Worlds from "@/components/Worlds";
import Bosses from "@/components/Bosses";
import Hatch from "@/components/Hatch";
import Dex from "@/components/Dex";
import Features from "@/components/Features";
import Demo from "@/components/Demo";
import Finale, { Footer, Marquee } from "@/components/Finale";

export default function Home() {
  return (
    <main className="grain relative overflow-x-clip">
      <Nav />
      <Hero />
      <Marquee />
      <Worlds />
      <Bosses />
      <Hatch />
      <Dex />
      <Features />
      <Demo />
      <Finale />
      <Footer />
    </main>
  );
}
