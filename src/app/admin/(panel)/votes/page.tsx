import Link from "next/link";
import { getVoteResults } from "@/lib/queries";

export const dynamic = "force-dynamic";

export default async function VotesPage() {
  const rows = await getVoteResults();
  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <div className="mt-8">
      <h1 className="font-display text-2xl tracking-[0.15em] text-parchment">Vote results</h1>
      <p className="mt-1 text-sm text-muted">
        {total} votes across {rows.length} heroes. Heroes that already have an episode can no longer be voted for.
      </p>
      {rows.length === 0 ? (
        <p className="mt-10 text-muted">No votes yet.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl border border-line">
          <table className="w-full min-w-[520px] text-sm">
            <thead className="bg-surface text-left text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-4 py-3">#</th>
                <th className="px-4 py-3">Hero</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-right">Last 7 days</th>
                <th className="px-4 py-3 text-right">Today</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id} className="border-t border-line/60">
                  <td className="px-4 py-3 text-muted">{i + 1}</td>
                  <td className="px-4 py-3">
                    <Link href={`/hero/${r.slug}`} className="flex items-center gap-2 hover:text-amber">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={r.iconUrl} alt="" className="h-6 w-6" />
                      {r.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold tabular-nums text-amber">{r.total}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.last7}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{r.today}</td>
                  <td className="px-4 py-3">
                    {r.covered ? (
                      <span className="rounded-full bg-agi/15 px-2 py-0.5 text-xs text-agi">Covered</span>
                    ) : (
                      <span className="rounded-full bg-amber/15 px-2 py-0.5 text-xs text-amber">Waiting</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
