import type { Metadata } from "next";
import { Suspense } from "react";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false } };

export default function LoginPage() {
  return (
    <div className="mx-auto flex min-h-[70dvh] max-w-sm items-center px-4">
      <div className="w-full rounded-2xl border border-line bg-surface p-8 shadow-[0_0_60px_-20px] shadow-amber/40">
        <p className="text-center font-display text-lg font-bold tracking-[0.2em] text-parchment">
          <span className="text-amber">◆</span> ANCIENT LORE
        </p>
        <p className="mt-1 text-center text-xs uppercase tracking-[0.3em] text-muted">Admin</p>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
