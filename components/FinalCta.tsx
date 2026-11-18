import Link from 'next/link';

import { DEMO_THEME } from '@/lib/demo';
import { CREATE_HREF } from '@/lib/site';

import { ArrowIcon, VoiceWaveIcon } from './icons';
import { LiquidBlob } from './LiquidBlob';
import { ThemeCountdown } from './ThemeCountdown';

/** Dernier appel : le sujet de la semaine, le temps restant et le bouton pour prendre la parole. */
export function FinalCta() {
  return (
    <section className="relative isolate overflow-x-clip px-3 pb-20 pt-7 sm:px-6 sm:pb-32 sm:pt-16 lg:px-12">
      {/* Grand blob derrière le cadre, comme dans le hero. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[200vw] -translate-x-1/2 -translate-y-1/2 opacity-80 sm:w-[min(120vw,1400px)]">
        <LiquidBlob className="h-auto w-full" speed={0.25} seed={9} glow={false} />
      </div>

      <div className="glass-frame mx-auto flex max-w-5xl flex-col items-center rounded-[28px] px-6 py-16 text-center sm:rounded-[36px] sm:px-12 sm:py-24">
        <p className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85">
          <span aria-hidden className="relative flex size-2">
            <span className="absolute inset-0 animate-ping rounded-full bg-accent opacity-70 motion-reduce:hidden" />
            <span className="relative size-2 rounded-full bg-accent" />
          </span>
          Le thème se termine
          <span className="text-azure">
            <ThemeCountdown />
          </span>
        </p>

        <h2 className="mt-8 text-balance text-[clamp(36px,6vw,72px)] font-bold leading-[1.02] tracking-[-0.04em]">
          À toi de prendre
          <br />
          la parole.
        </h2>
        <p className="mt-6 max-w-xl text-balance text-[clamp(17px,2vw,20px)] font-semibold leading-snug text-white/70">
          « {DEMO_THEME.subject} »
        </p>

        <Link
          href={CREATE_HREF}
          className="group mt-10 inline-flex h-16 w-full items-center justify-between gap-5 rounded-full bg-accent pl-7 pr-2 text-[17px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] sm:w-auto">
          <span className="flex items-center gap-2.5 whitespace-nowrap">
            <VoiceWaveIcon size={20} />
            Prendre la parole
          </span>
          <span className="grid size-12 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
            <ArrowIcon size={20} />
          </span>
        </Link>
        <p className="mt-4 text-[13px] text-white/45">Gratuit · Une minute suffit</p>
      </div>
    </section>
  );
}
