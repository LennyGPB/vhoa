import { Fragment, type ReactNode } from 'react';

import { BlobBadge } from './BlobBadge';
import { CardBridge } from './BlobBridge';
import { HeartCheckIcon, SparkIcon, VoiceWaveIcon } from './icons';

/** Mini aperçus de l'app, posés en bas de chaque carte (exemples illustratifs). */
function ThemePreview() {
  return (
    <div className="rounded-2xl bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-white/45">
        Thème de la semaine
        <span className="rounded-full bg-accent/15 px-2 py-0.5 tracking-normal text-accent">1:00</span>
      </div>
      <p className="mt-2 text-[15px] font-semibold leading-snug text-white/90">
        « Les réseaux sociaux nous rendent-ils plus seuls ? »
      </p>
    </div>
  );
}

function VotePreview() {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] p-3 pl-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      <div className="flex -space-x-2">
        {['#7CC4FA', '#4AA8FF', '#2F8FE8', '#1840A8'].map((c) => (
          <span key={c} className="size-7 rounded-full ring-2 ring-[#16171b]" style={{ background: c }} />
        ))}
      </div>
      <span className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white shadow-[0_8px_24px_-8px_var(--color-accent)]">
        <HeartCheckIcon size={15} />
        Convaincu
      </span>
    </div>
  );
}

function CoachPreview() {
  const rows = [
    { label: 'Rythme', value: 78, note: 'Idéal' },
    { label: 'Clarté', value: 64, note: 'Bien' },
  ];
  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/[0.04] p-4 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
      {rows.map((row) => (
        <div key={row.label}>
          <div className="flex justify-between text-[12px] font-medium">
            <span className="text-white/60">{row.label}</span>
            <span className="text-azure">{row.note}</span>
          </div>
          <div className="mt-1.5 h-1.5 rounded-full bg-white/[0.08]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent-strong to-azure"
              style={{ width: `${row.value}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

const FEATURES: { Icon: typeof VoiceWaveIcon; title: string; text: string; preview: ReactNode }[] = [
  {
    Icon: VoiceWaveIcon,
    title: 'Un thème par semaine',
    text: 'Chaque semaine, un nouveau sujet. Tu as une minute pour défendre ton point de vue, face caméra.',
    preview: <ThemePreview />,
  },
  {
    Icon: HeartCheckIcon,
    title: 'Le vote « Convaincu »',
    text: 'La communauté écoute et vote. Les prises les plus convaincantes montent dans le feed.',
    preview: <VotePreview />,
  },
  {
    Icon: SparkIcon,
    title: 'Ton coach IA',
    text: 'Rythme, clarté, argumentation : un retour concret après chaque prise pour progresser.',
    preview: <CoachPreview />,
  },
];

export function Concept() {
  return (
    <section id="concept" className="relative scroll-mt-10 px-5 py-28 sm:px-10 sm:py-36">
      <div className="mx-auto max-w-6xl">
        <h2 className="max-w-4xl text-balance text-[clamp(34px,5.2vw,64px)] font-bold leading-[1.02] tracking-[-0.035em]">
          Un thème. Une minute.
          <br />
          <span className="text-white/40">Toute une communauté à convaincre.</span>
        </h2>

        {/* Trois cartes reliées par des ponts liquides. */}
        <ol className="mt-16 flex flex-col md:grid md:grid-cols-[1fr_40px_1fr_40px_1fr]">
          {FEATURES.map(({ Icon, title, text, preview }, i) => (
            <Fragment key={title}>
              {i > 0 && (
                // `grid` : le pont occupe toute la hauteur de la rangée et se centre dessus.
                <li aria-hidden className="grid list-none">
                  <CardBridge phase={i * 1.7} />
                </li>
              )}
              <li className="glass-solid group relative flex flex-col overflow-hidden rounded-[32px] p-7 sm:p-8">
                {/* Halo bleu en haut, loin des bords où s'accrochent les ponts. */}
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-0 top-0 h-48 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.14),transparent)] transition-[filter] duration-500 group-hover:brightness-150"
                />

                <div className="relative flex flex-1 flex-col">
                  <BlobBadge size={64} seed={i * 2.1}>
                    <Icon size={24} />
                  </BlobBadge>
                  <h3 className="mt-8 text-[21px] font-bold tracking-tight">{title}</h3>
                  <p className="mt-2.5 text-[15px] leading-relaxed text-muted">{text}</p>
                  <div className="mt-auto pt-8">{preview}</div>
                </div>
              </li>
            </Fragment>
          ))}
        </ol>
      </div>
    </section>
  );
}
