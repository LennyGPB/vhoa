'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { loadHomeTheme, type HomeTake, type HomeTheme } from '@/app/actions/public';

import { ThemeCountdown } from './ThemeCountdown';
import { TopTakes } from './TopTakes';

/**
 * Défi en cours et ses meilleures prises, pour l'accueil (vraies données de l'API).
 * Un seul appel par visite, partagé par tous les blocs de la page.
 */
let pending: Promise<{ theme: HomeTheme | null; takes: HomeTake[] }> | null = null;

/** undefined = en cours de chargement ; theme null = pas de défi ouvert. */
function useHomeTheme() {
  const [data, setData] = useState<{ theme: HomeTheme | null; takes: HomeTake[] } | undefined>(undefined);
  useEffect(() => {
    pending ??= loadHomeTheme().catch(() => {
      pending = null;
      return { theme: null, takes: [] };
    });
    pending.then(setData);
  }, []);
  return data;
}

/** Pastille « Défi de la semaine · encore … » au-dessus du cadre (rien sans défi ouvert). */
export function ThemePill({ className = '' }: { className?: string }) {
  const data = useHomeTheme();
  if (!data?.theme) return null;
  return (
    <Link
      href="/defis"
      className={`glass mx-auto inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white ${className}`}>
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-70 motion-reduce:hidden" />
        <span className="relative size-2 rounded-full bg-accent" />
      </span>
      Défi de la semaine
      <span className="text-white/45">·</span>
      <span className="text-azure">
        <ThemeCountdown endsAt={data.theme.endsAt} />
      </span>
    </Link>
  );
}

/** « Le thème se termine · encore … » (appel final) : rien sans défi ouvert. */
export function ThemeEndPill() {
  const data = useHomeTheme();
  if (!data?.theme) return null;
  return (
    <p className="glass mb-8 inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85">
      <span aria-hidden className="relative flex size-2">
        <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-70 motion-reduce:hidden" />
        <span className="relative size-2 rounded-full bg-accent" />
      </span>
      Le thème se termine
      <span className="text-azure">
        <ThemeCountdown endsAt={data.theme.endsAt} />
      </span>
    </p>
  );
}

/** En-tête de la carte du thème : « Sujet de la semaine » et le nombre réel de prises. */
export function ThemeCardHead() {
  const data = useHomeTheme();
  const theme = data?.theme;
  return (
    <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45 xl:text-[12.5px]">
      {theme || data === undefined ? 'Sujet de la semaine' : 'Le prochain défi arrive'}
      {theme && theme.participants > 0 && (
        <span className="normal-case tracking-normal text-white/55">
          {theme.participants} {theme.participants > 1 ? 'prises' : 'prise'}
        </span>
      )}
    </div>
  );
}

/**
 * Le sujet du défi en cours, entre guillemets. Sans défi : `fallback`.
 * Pendant le chargement, une ligne grisée garde la place.
 */
export function ThemeSubject({ className = '', fallback }: { className?: string; fallback: string }) {
  const data = useHomeTheme();
  if (data === undefined) return <span aria-hidden className={`block h-[1.3em] w-3/4 animate-pulse rounded-lg bg-white/[0.06] ${className}`} />;
  return <p className={className}>{data.theme ? `« ${data.theme.subject} »` : fallback}</p>;
}

/**
 * Les 3 meilleures prises du défi, qui chevauchent le bas du cadre du hero.
 * Rien (ni la place réservée) tant qu'il n'y en a pas trois.
 */
export function HomeTopTakes() {
  const data = useHomeTheme();
  if (!data || data.takes.length < 3) return null;
  return (
    <div id="prises" className="relative z-10 -mt-24 scroll-mt-10 sm:-mt-28 xl:-mt-36 2xl:-mt-44">
      <TopTakes takes={data.takes} />
    </div>
  );
}
