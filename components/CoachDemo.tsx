import Link from 'next/link';

import { COACH_HREF } from '@/lib/site';

import { BlobBadge } from './BlobBadge';
import { ArrowIcon, SparkIcon } from './icons';

/* Exemple d'analyse (affiché comme tel), même forme que l'Analysis de l'API, réduite à l'essentiel. */
const STATS = [
  { value: '142', label: 'mots/min' },
  { value: '7', label: 'mots parasites' },
  { value: '3', label: 'silences' },
];
/** Le conseil, avec ses mots clés mis en évidence. */
const TIP = (
  <>
    Remplace tes <b className="font-semibold text-azure">« euh »</b> par une{' '}
    <b className="font-semibold text-azure">courte pause</b>. Elle donne du poids à ce qui suit.
  </>
);

/** Coach IA : un titre court et une carte d'analyse (3 chiffres + 1 conseil). */
export function CoachDemo() {
  return (
    <section id="coach" className="relative scroll-mt-10 px-5 py-7 sm:px-10 sm:py-16 xl:py-24">
      {/* Lueur bleue derrière la carte. Centrée par `left` : l'animation `drift` écrase `transform`. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="soft-blob left-[calc(50%-300px)] top-1/4 size-[600px] opacity-50" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 2xl:max-w-7xl md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16">
        <div>
          <h2 className="text-balance text-[clamp(34px,5.2vw,64px)] font-bold 2xl:text-[80px] leading-[1.02] tracking-[-0.035em]">
            Ton coach.
            <br />
            <span className="text-white/40">Au mot près.</span>
          </h2>
          <Link
            href={COACH_HREF}
            className="group mt-8 hidden h-12 items-center gap-3 rounded-full pl-5 pr-1.5 text-[15px] font-semibold xl:h-14 xl:pl-6 xl:text-[17px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06] md:inline-flex">
            Essayer le coach
            <span className="grid size-9 place-items-center rounded-full bg-accent transition-transform group-hover:translate-x-0.5">
              <ArrowIcon size={16} />
            </span>
          </Link>
        </div>

        <article className="glass-solid relative overflow-hidden rounded-[32px] p-6 sm:p-8 2xl:p-10">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.14),transparent)]"
          />

          {/* Illustration, clairement présentée comme telle. */}
          <p className="relative mb-5 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
            Exemple d’analyse
          </p>

          {/* Les 3 chiffres clés : un nombre, une légende. */}
          <dl className="relative grid grid-cols-3 divide-x divide-white/[0.08] text-center">
            {STATS.map((s) => (
              // Légende avant le nombre dans le code (dt puis dd), affichée sous le nombre.
              <div key={s.label} className="flex flex-col-reverse items-center justify-end px-2">
                <dt className="mt-2 text-[13px] leading-tight text-white/55 xl:text-[15px]">{s.label}</dt>
                <dd className="text-[clamp(32px,9vw,44px)] font-bold xl:text-[52px] 2xl:text-[60px] leading-none tracking-[-0.04em] text-white">{s.value}</dd>
              </div>
            ))}
          </dl>

          {/* Le conseil du coach. */}
          <div className="relative mt-6 overflow-hidden rounded-[22px] bg-[linear-gradient(135deg,rgb(74_168_255/0.16),rgb(74_168_255/0.04)_60%)] p-4 shadow-[inset_0_0_0_1px_rgb(74_168_255/0.22)]">
            {/* Halo dans le coin, derrière la goutte. */}
            <span
              aria-hidden
              className="pointer-events-none absolute -left-8 -top-10 size-28 rounded-full bg-[radial-gradient(closest-side,rgb(74_168_255/0.3),transparent)]"
            />
            <p className="relative flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-azure">
              <BlobBadge size={26} seed={3.3}>
                <SparkIcon size={12} />
              </BlobBadge>
              Conseil du coach
            </p>
            <p className="relative mt-2 text-[16px] leading-snug text-white/90 xl:text-[19px]">{TIP}</p>
          </div>
        </article>

        {/* Mobile : le bouton sous la carte, plein et bleu, avec l'offre bien visible. */}
        <Link
          href={COACH_HREF}
          className="group -mt-2 flex h-15 items-center gap-3 rounded-full bg-accent pl-2 pr-2 text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] active:brightness-95 md:hidden">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/20">
            <SparkIcon size={18} />
          </span>
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block text-[16px] font-semibold">Essayer le coach</span>
            <span className="block text-[12.5px] text-white/80">1 analyse offerte, sans carte</span>
          </span>
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white text-accent transition-transform group-active:translate-x-0.5">
            <ArrowIcon size={18} />
          </span>
        </Link>
      </div>
    </section>
  );
}
