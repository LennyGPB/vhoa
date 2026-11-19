import type { Metadata } from 'next';
import Link from 'next/link';

import { CoachDemo } from '@/components/CoachDemo';
import { Concept } from '@/components/Concept';
import { FinalCta } from '@/components/FinalCta';
import { Hero } from '@/components/Hero';
import { LaunchBanner } from '@/components/LaunchBanner';
import { Logo } from '@/components/Logo';
import { StructuredData } from '@/components/StructuredData';
import { TabBar } from '@/components/TabBar';

/** Le canonical n'est plus posé par le layout (il s'appliquait à toutes les pages). */
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Home() {
  return (
    <>
      {/* Offre de lancement Premium, tout en haut (disparaît quand les places sont prises). */}
      <LaunchBanner />
      <main>
        <Hero />
        <Concept />
        <CoachDemo />
        <FinalCta />
      </main>
      {/* Sur mobile, on laisse la place de la barre d'onglets sous le pied de page. */}
      <footer className="border-t border-white/[0.06] px-5 pb-36 pt-10 sm:px-10 md:pb-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-[13px] 2xl:max-w-7xl text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3">
            <Logo height={22} className="bg-white/80" />
            <span>
              <span className="font-black tracking-tight text-white/80">VHOA</span> · Prends la parole.
            </span>
          </p>
          <nav aria-label="Liens légaux" className="flex gap-6">
            <Link href="/cgu" className="hover:text-white">
              CGU
            </Link>
            <Link href="/cgv" className="hover:text-white">
              CGV
            </Link>
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
      <TabBar />
      <StructuredData />
    </>
  );
}
