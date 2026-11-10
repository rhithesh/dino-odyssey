import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

// The game's own fonts: ByteBounce (pixel) for display type, Priestacy (script) for the "Odyssey" logotype.
const pixel = localFont({ src: "./fonts/ByteBounce.ttf", variable: "--nf-pixel", display: "swap" });
const script = localFont({ src: "./fonts/Priestacy.otf", variable: "--nf-script", display: "swap" });
const sans = Space_Grotesk({ subsets: ["latin"], variable: "--nf-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--nf-mono", display: "swap", weight: ["500", "700", "800"] });

export const metadata: Metadata = {
  title: "Dino Odyssey · The offline dino game, reimagined",
  description:
    "12 cinematic worlds, 3 bosses, 20 dinosaurs and procedural chiptune music. A pixel-art runner for the Chrome side panel and iPhone. No internet needed.",
  icons: { icon: "/icon.png", apple: "/icon.png" },
  openGraph: {
    title: "Dino Odyssey",
    description: "The offline dino game, reimagined. 12 worlds, 3 bosses, 20 dinos.",
    images: ["/media/og.jpg"],
  },
};

export const viewport: Viewport = { themeColor: "#07050d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${pixel.variable} ${script.variable} ${sans.variable} ${mono.variable} antialiased`}>
      <body className="min-h-dvh bg-night font-sans text-bone">{children}</body>
    </html>
  );
}
