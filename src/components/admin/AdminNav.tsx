"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", label: "Videos" },
  { href: "/admin/topics", label: "Topics" },
  { href: "/admin/votes", label: "Votes" },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  return (
    <nav className="flex flex-wrap items-center gap-2 border-b border-line py-4">
      <span className="mr-4 font-display text-sm font-bold tracking-[0.3em] text-amber">ADMIN</span>
      {LINKS.map((l) => (
        <Link
          key={l.href}
          href={l.href}
          className={`rounded-full px-3 py-1 text-sm transition ${pathname === l.href ? "bg-amber/15 text-amber" : "text-muted hover:text-parchment"}`}
        >
          {l.label}
        </Link>
      ))}
      <Link href="/" className="ml-auto text-sm text-muted hover:text-parchment">
        View site ↗
      </Link>
      <button type="button" onClick={logout} className="rounded-full border border-line px-3 py-1 text-sm text-muted hover:border-str hover:text-str">
        Logout
      </button>
    </nav>
  );
}
