'use client';

import { useLayoutEffect, useRef, useState } from 'react';

import { AccountNav } from '../AccountNav';
import { Logo } from '../Logo';

export type FeedTab = 'forYou' | 'following';

const TABS: { key: FeedTab; label: string }[] = [
  { key: 'forYou', label: 'Pour toi' },
  { key: 'following', label: 'Abonnements' },
];

/* Bord avant rapide, bord arrière en retard : la pastille s'étire comme une goutte (LiquidTabs). */
const LEAD = 'cubic-bezier(0.2, 0.9, 0.3, 1.15) 280ms';
const TRAIL = 'cubic-bezier(0.3, 0.8, 0.3, 1) 460ms 40ms';

/** En-tête posé sur le feed : onglets en verre au centre ; logo et connexion sur grand écran. */
export function FeedHeader({ tab, onTabChange }: { tab: FeedTab; onTabChange: (tab: FeedTab) => void }) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const [box, setBox] = useState<{ left: number; right: number; dir: 1 | -1 } | null>(null);
  const index = TABS.findIndex((t) => t.key === tab);

  useLayoutEffect(() => {
    const el = refs.current[index];
    if (!el) return;
    const left = el.offsetLeft;
    const right = el.offsetLeft + el.offsetWidth;
    setBox((prev) => ({ left, right, dir: prev && left < prev.left ? -1 : 1 }));
  }, [index]);

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-center px-4 pt-[max(env(safe-area-inset-top),12px)] md:justify-between md:px-8 md:pt-9">
      {/* Sur ordinateur, le logo est dans le rail de navigation : on garde juste la place (centrage des onglets). */}
      <span aria-hidden className="invisible hidden md:block">
        <Logo height={30} />
      </span>

      <div role="tablist" aria-label="Feed" className="glass pointer-events-auto relative flex rounded-full p-1">
        {box && (
          <span
            aria-hidden
            className="absolute inset-y-1 rounded-full bg-accent shadow-[0_6px_20px_-6px_var(--color-accent)]"
            style={{
              left: box.left,
              right: `calc(100% - ${box.right}px)`,
              transition:
                box.dir === 1 ? `right ${LEAD}, left ${TRAIL}` : `left ${LEAD}, right ${TRAIL}`,
            }}
          />
        )}
        {TABS.map((t, i) => {
          const selected = t.key === tab;
          return (
            <button
              key={t.key}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => onTabChange(t.key)}
              className={`relative h-[34px] rounded-full px-4 text-[13px] font-semibold transition-colors ${
                selected ? 'text-white' : 'text-white/60 hover:text-white/85'
              }`}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="pointer-events-auto hidden md:block">
        <AccountNav />
      </div>
    </header>
  );
}
