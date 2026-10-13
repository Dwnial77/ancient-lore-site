import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <p className="font-display text-5xl text-gradient-amber">Lost to the ages</p>
      <p className="mt-4 text-muted">This page doesn&apos;t exist in the archive.</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-amber px-5 py-2 font-medium text-ink">
        Back to all heroes
      </Link>
    </div>
  );
}
