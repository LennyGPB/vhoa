import type { Metadata } from 'next';
import Link from 'next/link';

import { LiquidBlob } from '@/components/LiquidBlob';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Page introuvable',
  robots: { index: false },
};

/** Page introuvable (lien cassé, prise supprimée, profil inexistant), dans la D.A. de VHOA. */
export default function NotFound() {
  return (
    <div className="relative flex min-h-svh items-center justify-center overflow-hidden bg-canvas px-6 pb-32">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-0 w-[160vw] -translate-x-1/2 -translate-y-1/2 opacity-50 sm:w-[min(90vh,900px)]">
        <LiquidBlob className="h-auto w-full" speed={0.2} seed={5} glow={false} />
      </div>
      <main className="glass-frame relative w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
        <p className="text-[13px] font-semibold uppercase tracking-[0.14em] text-azure">Erreur 404</p>
        <h1 className="mt-3 text-[28px] font-bold leading-tight tracking-[-0.03em]">Cette page n’existe pas</h1>
        <p className="mt-2 text-[15px] text-white/60">
          Le lien est peut-être cassé, ou la prise a été supprimée ou retirée.
        </p>
        <Link
          href="/feed"
          className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
          Écouter des prises
        </Link>
        <Link href="/" className="mt-3 inline-flex h-12 w-full items-center justify-center rounded-full text-[15px] font-semibold text-white/80 hover:text-white">
          Retour à l’accueil
        </Link>
      </main>
      <TabBar />
    </div>
  );
}
