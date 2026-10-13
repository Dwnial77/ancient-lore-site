"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PickerHero } from "@/lib/queries";
import { AttributeDot } from "../AttributeDot";

export function HeroPicker({
  heroes,
  exclude,
  onPick,
}: {
  heroes: PickerHero[];
  exclude: Set<number>;
  onPick: (hero: PickerHero) => void;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const options = useMemo(() => {
    const q = query.trim().toLowerCase();
    return heroes.filter((h) => !exclude.has(h.id) && (!q || h.name.toLowerCase().includes(q)));
  }, [heroes, exclude, query]);

  useEffect(() => setActive(0), [query]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [active]);

  function pick(hero: PickerHero) {
    onPick(hero);
    setQuery("");
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, options.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (options[active]) pick(options[active]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="rounded-full border border-dashed border-amber/60 px-3 py-1 text-sm text-amber transition hover:bg-amber/10"
      >
        + Add hero
      </button>
      {open ? (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-surface-2 p-2 shadow-2xl">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Search hero…"
            role="combobox"
            aria-expanded="true"
            aria-controls="hero-picker-list"
            className="w-full rounded-lg border border-line bg-ink px-3 py-2 text-sm text-parchment focus:border-amber focus:outline-none"
          />
          <ul ref={listRef} id="hero-picker-list" role="listbox" className="mt-2 max-h-64 overflow-y-auto">
            {options.length === 0 ? <li className="px-3 py-2 text-sm text-muted">No heroes found</li> : null}
            {options.map((h, i) => (
              <li
                key={h.id}
                data-index={i}
                role="option"
                aria-selected={i === active}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => {
                  e.preventDefault();
                  pick(h);
                }}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${i === active ? "bg-amber/15 text-amber" : "text-parchment"}`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={h.iconUrl} alt="" className="h-6 w-6" loading="lazy" />
                <span className="flex-1 truncate">{h.name}</span>
                <AttributeDot attribute={h.attribute} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
