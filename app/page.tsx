import Link from 'next/link';

import { Concept } from '@/components/Concept';
import { Hero } from '@/components/Hero';
import { Join } from '@/components/Join';
import { Logo } from '@/components/Logo';
import { WaitlistModal } from '@/components/WaitlistModal';

export default function Home() {
  return (
    <>
      <main>
        <Hero />
        <Concept />
        <Join />
      </main>
      <footer className="border-t border-white/[0.06] px-5 py-10 sm:px-10">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 text-[13px] text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p className="flex items-center gap-3">
            <Logo height={22} className="bg-white/80" />
            <span>
              <span className="font-black tracking-tight text-white/80">VHOA</span> · Prends la parole.
            </span>
          </p>
          <nav aria-label="Liens légaux" className="flex gap-6">
            <Link href="/mentions-legales" className="hover:text-white">
              Mentions légales
            </Link>
            <Link href="/confidentialite" className="hover:text-white">
              Confidentialité
            </Link>
          </nav>
        </div>
      </footer>
      <WaitlistModal />
    </>
  );
}
