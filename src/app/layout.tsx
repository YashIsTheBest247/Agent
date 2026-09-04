import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://overturn.vercel.app"),
  title: {
    default: "Overturn — Get back what you're owed",
    template: "%s · Overturn",
  },
  description:
    "Overturn is an AI appeals desk for denied insurance claims and incorrect medical bills. A supervised agent team reads your denial, finds the governing policy language, and drafts a citation-backed appeal you approve before anything is sent.",
  keywords: [
    "insurance claim appeal",
    "denied claim",
    "medical billing errors",
    "prior authorization denial",
    "external review",
    "AI agent",
  ],
  openGraph: {
    title: "Overturn — Get back what you're owed",
    description:
      "An AI appeals desk for denied claims. Citation-verified appeals, drafted in minutes, approved by you.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#eceee8",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${jakarta.variable} ${inter.variable}`}>
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
