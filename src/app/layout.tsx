import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import Link from "next/link";
import { VideoPlayerProvider } from "@/components/VideoPlayer";
import "@fontsource/cinzel/600.css";
import "@fontsource/cinzel/700.css";
import "@fontsource-variable/inter";
import "./globals.css";

const siteUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : "https://ancient-lore.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Ancient Lore — The Archive of Dota 2 Heroes", template: "%s · Ancient Lore" },
  description: "Cinematic Dota 2 hero lore. Find every Ancient Lore episode by hero and vote for the next one.",
};

export const viewport: Viewport = { themeColor: "#100D08" };

function channelUrl() {
  const id = process.env.YOUTUBE_CHANNEL_ID;
  return id ? `https://www.youtube.com/channel/${id}` : "https://www.youtube.com/";
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <VideoPlayerProvider>
        <header className="sticky top-0 z-40 border-b border-line/60 bg-ink/75 backdrop-blur-md">
          <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
            <Link href="/" className="group flex items-center gap-2">
              <span className="text-amber transition-transform duration-300 group-hover:rotate-45">◆</span>
              <span className="font-display text-lg font-bold tracking-[0.2em] text-parchment">ANCIENT LORE</span>
            </Link>
            <a
              href={channelUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 rounded-full border border-amber/40 px-3 py-1.5 text-sm text-amber transition hover:bg-amber hover:text-ink"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden="true">
                <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.3 3.6-6.3 3.6Z" />
              </svg>
              <span className="hidden sm:inline">YouTube</span>
            </a>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-line/60 py-6 text-center text-xs text-muted">
          <p>
            © {new Date().getFullYear()} Ancient Lore · Hero data from OpenDota · Not affiliated with Valve.
          </p>
        </footer>
        </VideoPlayerProvider>
        <Analytics />
      </body>
    </html>
  );
}
