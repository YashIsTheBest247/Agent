import type { Metadata, Viewport } from "next";
import {
  Archivo,
  DM_Sans,
  Instrument_Serif,
  JetBrains_Mono,
} from "next/font/google";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const instrument = Instrument_Serif({
  subsets: ["latin"],
  weight: "400",
  style: ["italic", "normal"],
  variable: "--font-instrument",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://second-chair.vercel.app"),
  title: {
    default: "Second Chair — We do the preparation, you do the signing",
    template: "%s · Second Chair",
  },
  description:
    "Second Chair is three desks of AI agents for work that ends in a document someone has to sign: insurance appeals, field quoting, and purchase orders. Agents propose; code verifies every fact against the source; you sign.",
  keywords: [
    "AI agents",
    "insurance claim appeal",
    "construction quoting",
    "purchase order automation",
    "multi-agent system",
    "back office automation",
  ],
  openGraph: {
    title: "Second Chair — We do the preparation, you do the signing",
    description:
      "Three desks of agents for appeals, quoting and orders. Every fact checked by code, every document signed by you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e100f",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${instrument.variable} ${dmSans.variable} ${jetbrains.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
