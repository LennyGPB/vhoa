import Link from 'next/link';

import { COACH_HREF } from '@/lib/site';

import { BlobBadge } from './BlobBadge';
import { ArrowIcon, SparkIcon } from './icons';

/* Analyse fictive (même forme que l'Analysis de l'API), réduite à l'essentiel. */
const STATS = [
  { value: '142', label: 'Mots/min', note: 'Débit idéal' },
  { value: '7', label: 'Mots parasites', note: '« euh » ×4' },
  { value: '3', label: 'Silences', note: '1,8 s max' },
];
const TIP = 'Remplace tes « euh » par une courte pause. Elle donne du poids à ce qui suit.';

/** Coach IA : un titre court et une carte d'analyse (3 chiffres + 1 conseil). */
export function CoachDemo() {
  return (
    <section id="coach" className="relative scroll-mt-10 px-5 py-7 sm:px-10 sm:py-16">
      {/* Lueur bleue derrière la carte. Centrée par `left` : l'animation `drift` écrase `transform`. */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <span className="soft-blob left-[calc(50%-300px)] top-1/4 size-[600px] opacity-50" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.1fr] md:items-center md:gap-16">
        <div>
          <h2 className="text-balance text-[clamp(34px,5.2vw,64px)] font-bold leading-[1.02] tracking-[-0.035em]">
            Ton coach.
            <br />
            <span className="text-white/40">Au mot près.</span>
          </h2>
          <Link
            href={COACH_HREF}
            className="group mt-8 hidden h-12 items-center gap-3 rounded-full pl-5 pr-1.5 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06] md:inline-flex">
            Essayer le coach
            <span className="grid size-9 place-items-center rounded-full bg-accent transition-transform group-hover:translate-x-0.5">
              <ArrowIcon size={16} />
            </span>
          </Link>
        </div>

        <article className="glass-solid relative overflow-hidden rounded-[32px] p-6 sm:p-8">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.14),transparent)]"
          />

          {/* Les 3 chiffres clés. */}
          <dl className="relative grid grid-cols-3 gap-3">
            {STATS.map((s) => (
              <div key={s.label} className="flex flex-col">
                <dt className="order-2 mt-1 text-[12px] font-medium leading-tight text-white/50">{s.label}</dt>
                <dd className="order-1 text-[clamp(28px,8vw,40px)] font-bold leading-none tracking-[-0.04em] text-white">
                  {s.value}
                </dd>
                <dd className="order-3 mt-2 text-[12px] font-semibold text-azure">{s.note}</dd>
              </div>
            ))}
          </dl>

          {/* Le conseil du coach. */}
          <div className="relative mt-7 flex gap-3 border-t border-white/[0.07] pt-6">
            <BlobBadge size={40} seed={3.3}>
              <SparkIcon size={16} />
            </BlobBadge>
            <p className="text-[16px] font-medium leading-snug text-white/85">{TIP}</p>
          </div>
        </article>

        {/* Mobile : le bouton sous la carte. */}
        <Link
          href={COACH_HREF}
          className="group -mt-2 inline-flex h-12 items-center justify-between gap-3 rounded-full pl-5 pr-1.5 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] md:hidden">
          Essayer le coach · 1 analyse offerte
          <span className="grid size-9 place-items-center rounded-full bg-accent">
            <ArrowIcon size={16} />
          </span>
        </Link>
      </div>
    </section>
  );
}
