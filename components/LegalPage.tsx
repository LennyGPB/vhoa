import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from './Logo';

/** Mise en page commune des pages légales : un grand panneau de verre, lisible et sobre. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <div className="relative isolate min-h-svh overflow-x-clip px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <span className="soft-blob -left-40 -top-40 size-[620px]" />
        <span
          className="soft-blob -bottom-60 -right-40 size-[680px]"
          style={{ ['--dx' as string]: '-60px', ['--dy' as string]: '-40px', ['--dur' as string]: '18s' }}
        />
      </div>

      <header className="mx-auto flex max-w-3xl items-center justify-between">
        <Link href="/" aria-label="VHOA, retour à l’accueil" className="transition-opacity hover:opacity-80">
          <Logo height={30} />
        </Link>
        <Link
          href="/"
          className="glass rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white">
          ← Retour au site
        </Link>
      </header>

      <main className="glass-frame mx-auto mt-8 max-w-3xl rounded-[32px] px-6 py-10 sm:px-12 sm:py-14">
        <h1 className="text-[clamp(30px,5vw,44px)] font-bold leading-tight tracking-[-0.03em]">{title}</h1>
        <p className="mt-3 text-[13px] text-white/45">Dernière mise à jour : {updated}</p>
        <div className="legal mt-10">{children}</div>
      </main>
    </div>
  );
}

/** Section titrée d'une page légale. */
export function LegalSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-white/[0.07] py-8 first:border-0 first:pt-0">
      <h2 className="text-[19px] font-bold tracking-tight">{title}</h2>
      <div className="mt-3 flex flex-col gap-3 text-[15px] leading-relaxed text-white/70">{children}</div>
    </section>
  );
}
