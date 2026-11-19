import { Fragment, type ReactNode } from 'react';


import { BlobBadge } from './BlobBadge';
import { CardBridge } from './BlobBridge';
import { CardDeck } from './CardDeck';
import { ThemeSubject } from './HomeTheme';
import { HeartCheckIcon, SparkIcon, VoiceWaveIcon } from './icons';

/** Mini aperçus posés en bas de chaque carte (exemples illustratifs). */
function ThemePreview() {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45 xl:text-[12px]">Sujet de la semaine</div>
      <ThemeSubject
        className="mt-2 text-[15px] font-semibold leading-snug text-white/90 xl:text-[17px]"
        fallback="Un nouveau sujet chaque semaine, choisi pour faire débattre."
      />
    </div>
  );
}

/** Enregistrement en cours : chrono et barre de progression sur 60 s. */
function RecordPreview() {
  return (
    <div className="flex items-center gap-4 rounded-2xl bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <span className="relative grid size-10 shrink-0 place-items-center rounded-full bg-accent/15">
        <span className="size-3.5 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)]" />
      </span>
      <div className="flex-1">
        <div className="flex justify-between text-[12px] font-semibold xl:text-[14px]">
          <span className="text-white/60">Enregistrement</span>
          <span className="tabular-nums text-azure">0:42 / 1:00</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-white/[0.08]">
          <div className="h-full w-[70%] rounded-full bg-gradient-to-r from-accent-strong to-azure" />
        </div>
      </div>
    </div>
  );
}

function VotePreview() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 pl-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <div className="flex -space-x-2">
        {['#7CC4FA', '#4AA8FF', '#2F8FE8', '#1840A8'].map((c) => (
          <span key={c} className="size-7 rounded-full ring-2 ring-[#16171b] xl:size-9" style={{ background: c }} />
        ))}
      </div>
      <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white xl:px-5 xl:py-2.5 xl:text-[15px] shadow-[0_8px_24px_-8px_var(--color-accent)]">
        <HeartCheckIcon size={15} />
        Convaincu
      </span>
    </div>
  );
}

const STEPS: { Icon: typeof VoiceWaveIcon; title: string; preview: ReactNode }[] = [
  { Icon: SparkIcon, title: 'Un thème chaque semaine.', preview: <ThemePreview /> },
  { Icon: VoiceWaveIcon, title: '60 secondes pour convaincre.', preview: <RecordPreview /> },
  { Icon: HeartCheckIcon, title: 'Le public tranche.', preview: <VotePreview /> },
];

function StepCard({ step, index }: { step: (typeof STEPS)[number]; index: number }) {
  const { Icon, title, preview } = step;
  return (
    <article className="glass-solid group relative flex h-full flex-col overflow-hidden rounded-[32px] p-6 sm:p-8 2xl:p-10">
      {/* Halo bleu en haut, loin des bords où s'accrochent les ponts. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.14),transparent)] transition-[filter] duration-500 group-hover:brightness-150"
      />
      <div className="relative flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <BlobBadge size={56} seed={index * 2.1}>
            <Icon size={22} />
          </BlobBadge>
          <span className="text-[44px] font-black leading-none tracking-[-0.05em] text-white/[0.08]">{index + 1}</span>
        </div>
        <h3 className="mt-6 text-balance text-[26px] font-bold leading-[1.1] tracking-[-0.03em] xl:text-[30px] 2xl:text-[34px]">{title}</h3>
        <div className="mt-auto pt-7">{preview}</div>
      </div>
    </article>
  );
}

/**
 * Comment ça marche : trois étapes.
 * Mobile : paquet de cartes à faire glisser. Ordinateur : trois cartes reliées par des ponts liquides.
 */
export function Concept() {
  return (
    <section id="concept" className="relative scroll-mt-10 px-5 py-7 sm:px-10 sm:py-16 xl:py-24">
      <div className="mx-auto max-w-6xl 2xl:max-w-7xl">
        <h2 className="max-w-4xl text-balance text-[clamp(34px,5.2vw,64px)] font-bold 2xl:text-[80px] leading-[1.02] tracking-[-0.035em]">
          Un thème. Une minute.
          <br />
          <span className="text-white/40">Un verdict.</span>
        </h2>

        <div className="mt-10 md:hidden">
          <CardDeck
            label="Les trois étapes"
            cards={STEPS.map((step, i) => (
              <StepCard key={step.title} step={step} index={i} />
            ))}
          />
        </div>

        <ol className="mt-16 hidden md:grid md:grid-cols-[1fr_40px_1fr_40px_1fr]">
          {STEPS.map((step, i) => (
            <Fragment key={step.title}>
              {i > 0 && (
                // `grid` : le pont occupe toute la hauteur de la rangée et se centre dessus.
                <li aria-hidden className="grid list-none">
                  <CardBridge phase={i * 1.7} />
                </li>
              )}
              <li>
                <StepCard step={step} index={i} />
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
