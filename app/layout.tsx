import type { Metadata, Viewport } from "next";
import "./globals.css";
import { I18nProvider } from "@/components/I18nProvider";
import { Nav } from "@/components/Nav";

export const metadata: Metadata = {
  title: "SimShorts Lab — Oddly satisfying physics machines",
  description: "30+ oddly satisfying ball & physics simulations for YouTube Shorts, Reels and TikTok. Procedural ASMR audio and one-click 9:16 video recording.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#05050b",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="flex h-dvh flex-col overflow-hidden">
        <I18nProvider>
          <Nav />
          <main className="relative min-h-0 flex-1">{children}</main>
        </I18nProvider>
      </body>
    </html>
  );
}
