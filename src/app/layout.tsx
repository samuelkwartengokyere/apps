import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { LANDING_SCRIPT } from "@/components/cinematic/landing";
import { SectionTransition } from "@/components/cinematic/SectionTransition";
import "./globals.css";

export const metadata: Metadata = {
  title: "SecureVault — Your digital life. Protected in one vault.",
  description:
    "Securely manage passwords, private information and developer secrets with client-side encryption designed to keep your vault under your control.",
};

export const viewport: Viewport = {
  themeColor: "#07111F",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: LANDING_SCRIPT }} />
        {/* Without JavaScript nothing could ever lift the loading screen */}
        <noscript>
          <style>{"#loading-screen{display:none}"}</style>
        </noscript>
      </head>
      <body>
        <SectionTransition />
        {children}
      </body>
    </html>
  );
}
