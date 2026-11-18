'use client';

import { useLayoutEffect, useRef, useState } from 'react';

/* Bord avant rapide, bord arrière en retard : la pastille s'étire comme une goutte (LiquidTabs de l'app). */
const LEAD = 'cubic-bezier(0.2, 0.9, 0.3, 1.15) 280ms';
const TRAIL = 'cubic-bezier(0.3, 0.8, 0.3, 1) 460ms 40ms';

/** Onglets « liquides » (D.A. VHOA) : une pastille bleue suit l'onglet choisi en s'étirant. */
export function LiquidTabs<K extends string>({
  tabs,
  value,
  onChange,
  label,
  className = '',
}: {
  tabs: { key: K; label: string; badge?: number }[];
  value: K;
  onChange: (key: K) => void;
  label: string;
  className?: string;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = useState<{ left: number; right: number; dir: 1 | -1 } | null>(null);
  const index = Math.max(
    0,
    tabs.findIndex((t) => t.key === value),
  );

  useLayoutEffect(() => {
    const el = refs.current[index];
    if (!el) return;
    const left = el.offsetLeft;
    const right = el.offsetLeft + el.offsetWidth;
    setBox((prev) => ({ left, right, dir: prev && left < prev.left ? -1 : 1 }));
  }, [index, tabs.length]);

  return (
    <div role="tablist" aria-label={label} className={`relative flex rounded-full bg-white/[0.05] p-1 ${className}`}>
      {box && (
        <span
          aria-hidden
          className="absolute inset-y-1 rounded-full bg-accent shadow-[0_6px_20px_-6px_var(--color-accent)]"
          style={{
            left: box.left,
            right: `calc(100% - ${box.right}px)`,
            transition: box.dir === 1 ? `right ${LEAD}, left ${TRAIL}` : `left ${LEAD}, right ${TRAIL}`,
          }}
        />
      )}
      {tabs.map((t, i) => {
        const selected = t.key === value;
        return (
          <button
            key={t.key}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="tab"
            aria-selected={selected}
            onClick={() => onChange(t.key)}
            className={`relative flex h-9 flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-3 text-[13px] font-semibold transition-colors ${
              selected ? 'text-white' : 'text-white/55 hover:text-white/85'
            }`}>
            {t.label}
            {t.badge ? (
              <span
                className={`grid h-[18px] min-w-[18px] place-items-center rounded-full px-1 text-[10px] ${
                  selected ? 'bg-white/25' : 'bg-accent text-white'
                }`}>
                {t.badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
