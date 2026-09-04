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
  metadataBase: new URL("https://overturn.vercel.app"),
  title: {
    default: "Overturn — Where a denial meets an argument",
    template: "%s · Overturn",
  },
  description:
    "Overturn is an AI appeals desk for denied insurance claims and incorrect medical bills. Nine agents read your denial, find the policy language that contradicts it, and draft a citation-verified appeal you approve before anything is sent.",
  keywords: [
    "insurance claim appeal",
    "denied claim",
    "medical billing errors",
    "prior authorization denial",
    "external review",
    "AI agent",
  ],
  openGraph: {
    title: "Overturn — Where a denial meets an argument",
    description:
      "An AI appeals desk for denied claims. Citation-verified appeals, drafted by nine agents, approved by you.",
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
