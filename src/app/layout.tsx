import type { Metadata } from "next";
import { Inter, Instrument_Serif, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  subsets: ["latin"],
  weight: ["400"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "SIP vs Lump — A cinematic wealth calculator",
  description:
    "Same money. Different discipline. Watch your SIP vs Lump Sum story play out year by year — emotional, not just numerical.",
  keywords: [
    "SIP calculator",
    "Lump Sum calculator",
    "mutual funds",
    "India investing",
    "wealth growth",
    "CAGR",
    "cinematic finance",
  ],
  authors: [{ name: "SIPvsLump" }],
  openGraph: {
    title: "SIP vs Lump — A cinematic wealth calculator",
    description:
      "₹10,000 a month. 15 years. Two very different stories. Watch them play out as you scroll.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SIP vs Lump — A cinematic wealth calculator",
    description:
      "Same money. Different discipline. Watch the math play out as you scroll.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
      </body>
    </html>
  );
}
