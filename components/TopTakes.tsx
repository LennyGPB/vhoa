'use client';

import { Fragment, useEffect, useRef } from 'react';

import type { DemoTake } from '@/lib/demo';

import { BlobBridge } from './BlobBridge';
import { HeartCheckIcon } from './icons';

/** Hauteurs de la petite onde audio, fixes pour que le rendu serveur et navigateur soient identiques. */
const WAVE = [0.35, 0.6, 0.9, 0.5, 0.75, 1, 0.55, 0.8, 0.4, 0.7, 0.95, 0.5, 0.65, 0.3, 0.85, 0.6, 0.45, 0.7];

/* Indicateur : points espacés de STEP, goutte active large de PILL au repos. */
const DOT = 7;
const STEP = 20;
const PILL = 20;
const PAD = PILL / 2;

function duration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Goutte active à la position `p` (0 = 1re carte, 1 = 2e…). Entre deux cartes, le bord avant file
 * vite et le bord arrière traîne : la goutte s'étire et se pince au milieu (comme les LiquidTabs).
 */
function pillPath(p: number) {
  const i = Math.floor(p);
  const t = p - i;
  const from = PAD + i * STEP;
  const left = from - PILL / 2 + STEP * t * t;
  const right = Math.max(from + PILL / 2 + STEP * (1 - (1 - t) * (1 - t)), left + DOT);
  const r = DOT / 2;
  const cx = (left + right) / 2;
  const stretch = Math.max(0, (right - left - PILL) / PILL);
  const pinch = Math.min(DOT * 0.3, stretch * DOT * 0.5) * 2;
  return [
    `M ${left + r} 0`,
    `Q ${cx} ${pinch} ${right - r} 0`,
    `A ${r} ${r} 0 0 1 ${right - r} ${DOT}`,
    `Q ${cx} ${DOT - pinch} ${left + r} ${DOT}`,
    `A ${r} ${r} 0 0 1 ${left + r} 0`,
    'Z',
  ].join(' ');
}

/** Positions de défilement où chaque carte est calée à gauche (bornées par la fin du défilement). */
function snapStops(scroller: HTMLElement) {
  const max = scroller.scrollWidth - scroller.clientWidth;
  const first = scroller.querySelector<HTMLElement>('[data-card]');
  const offset = first?.offsetLeft ?? 0;
  return [...scroller.querySelectorAll<HTMLElement>('[data-card]')].map((card) =>
    Math.min(card.offsetLeft - offset, max),
  );
}

function TakeCard({ take, rank }: { take: DemoTake; rank: number }) {
  return (
    <article className="glass-solid flex h-[300px] w-[210px] shrink-0 flex-col justify-between rounded-[26px] p-4">
      {/* Pas de contour sur la carte : le pont doit s'y fondre sans ligne de raccord. */}
      <div className="flex items-center justify-between text-[11px] font-semibold">
        <span className="rounded-full bg-accent/15 px-2.5 py-1 text-accent">#{rank}</span>
        <span className="text-white/45">
          {take.category} · {duration(take.duration)}
        </span>
      </div>

      <p className="text-[15px] font-semibold leading-snug text-white/90">« {take.excerpt} »</p>

      <div className="flex flex-col gap-3">
        <div aria-hidden className="flex h-6 items-center gap-[3px]">
          {WAVE.map((h, i) => (
            <span
              key={i}
              className="w-[3px] rounded-full bg-gradient-to-t from-accent-strong to-azure"
              style={{ height: `${h * 100}%`, opacity: 0.45 + h * 0.5 }}
            />
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="flex min-w-0 items-center gap-2">
            <span className="size-7 shrink-0 rounded-full ring-2 ring-white/10" style={{ background: take.color }} />
            <span className="truncate text-[13px] font-semibold text-white/85">{take.author}</span>
          </span>
          <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-azure">
            <HeartCheckIcon size={13} />
            {take.convinced}
          </span>
        </div>
      </div>
    </article>
  );
}

/**
 * Les meilleures prises du thème, reliées par le pont liquide.
 * Sur mobile : carrousel (une carte centrée, les voisines dépassent) avec un indicateur en goutte.
 * Sur ordinateur : les trois côte à côte.
 */
export function TopTakes({ takes }: { takes: DemoTake[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<SVGPathElement>(null);
  const shown = takes.slice(0, 3);

  // L'indicateur suit le défilement en continu (sans re-rendu React).
  useEffect(() => {
    const scroller = scrollerRef.current;
    const pill = pillRef.current;
    if (!scroller || !pill) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      // Position de défilement où chaque carte est calée (la dernière s'arrête au bout du défilement),
      // puis interpolation entre les deux cartes qui encadrent la position actuelle.
      const stops = snapStops(scroller);
      const x = scroller.scrollLeft;
      let p = 0;
      for (let i = 0; i < stops.length - 1; i++) {
        if (x >= stops[i + 1]) p = i + 1;
        else if (x > stops[i]) p = i + (x - stops[i]) / (stops[i + 1] - stops[i]);
      }
      pill.setAttribute('d', pillPath(Math.min(p, stops.length - 1 - 1e-6)));
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    scroller.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      scroller.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(raf);
    };
  }, [shown.length]);

  const goTo = (i: number) => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    scroller.scrollTo({ left: snapStops(scroller)[i], behavior: 'smooth' });
  };

  // Au lancement, peu de prises : on n'affiche la rangée qu'à partir de trois.
  if (shown.length < 3) return null;

  return (
    <div>
      <div
        ref={scrollerRef}
        className="-mx-3 snap-x snap-mandatory scroll-px-3 overflow-x-auto pb-4 sm:-mx-6 sm:scroll-px-6 md:mx-0 [scrollbar-width:none] md:snap-none md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {/* Le carrousel prend toute la largeur de l’écran ; la 1re carte s'aligne sur le bord gauche du cadre. */}
        <ul aria-label="Meilleures prises du thème" className="flex w-max items-center px-3 sm:px-6 md:mx-auto">          {shown.map((take, i) => (
            <Fragment key={take.id}>
              {i > 0 && (
                <li aria-hidden className="-mx-px">
                  <BlobBridge orientation="horizontal" phase={i * 1.7} />
                </li>
              )}
              <li data-card className="snap-start">
                <TakeCard take={take} rank={i + 1} />
              </li>
            </Fragment>
          ))}
        </ul>
      </div>

      {/* Indicateur en goutte (mobile). */}
      <div className="relative mx-auto mt-2 md:hidden" style={{ width: PAD * 2 + STEP * (shown.length - 1), height: 24 }}>
        <svg
          aria-hidden
          width={PAD * 2 + STEP * (shown.length - 1)}
          height={DOT}
          className="absolute left-0 top-1/2 -translate-y-1/2 overflow-visible">
          {shown.map((t, i) => (
            <circle key={t.id} cx={PAD + i * STEP} cy={DOT / 2} r={DOT / 2} fill="rgb(255 255 255 / 0.22)" />
          ))}
          <path ref={pillRef} d={pillPath(0)} fill="var(--color-accent)" />
        </svg>
        <div className="absolute inset-0 flex">
          {shown.map((t, i) => (
            <button
              key={t.id}
              type="button"
              aria-label={`Voir la prise n° ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-full flex-1"
            />
          ))}
        </div>
      </div>
    </div>
  );
}
