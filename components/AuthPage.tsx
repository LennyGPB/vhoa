import Link from 'next/link';
import type { ReactNode } from 'react';

import { Logo } from './Logo';

/** Mise en page des pages d'inscription / connexion : un panneau de verre centré sur des lueurs bleues. */
export function AuthPage({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="relative isolate flex min-h-svh flex-col overflow-x-clip px-4 pb-16 pt-6 sm:px-8 sm:pt-10">
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
        <span className="soft-blob -left-40 -top-40 size-[620px]" />
        <span
          className="soft-blob -bottom-60 -right-40 size-[680px]"
          style={{ ['--dx' as string]: '-60px', ['--dy' as string]: '-40px', ['--dur' as string]: '18s' }}
        />
      </div>

      <header className="mx-auto flex w-full max-w-md items-center justify-between">
        <Link href="/" aria-label="VHOA, retour à l’accueil" className="transition-opacity hover:opacity-80">
          <Logo height={30} />
        </Link>
        <Link
          href="/"
          className="glass rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white">
          ← Retour
        </Link>
      </header>

      <main className="glass-frame rise mx-auto mt-10 w-full max-w-md rounded-[32px] px-6 py-9 sm:mt-16 sm:px-9 sm:py-11">
        <h1 className="text-[clamp(28px,6vw,34px)] font-bold leading-tight tracking-[-0.03em]">{title}</h1>
        <p className="mt-2 text-[15px] text-white/55">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </main>
    </div>
  );
}
