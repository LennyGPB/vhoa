'use client';

import { useEffect, useRef } from 'react';

import { WAITLIST_HASH } from '@/lib/site';

import { BlobBadge } from './BlobBadge';
import { VoiceWaveIcon } from './icons';
import { LiquidBlob } from './LiquidBlob';
import { WaitlistForm } from './WaitlistForm';

const CLOSE_MS = 260;

/**
 * Modale de la liste d'attente. Elle s'ouvre quand l'adresse se termine par `#liste-attente`
 * (tous les boutons « Rejoindre la liste d'attente » pointent dessus) et retire ce lien en se fermant.
 */
export function WaitlistModal() {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    let raf = 0;

    const open = () => {
      if (window.location.hash !== WAITLIST_HASH) return;
      // Déjà ouverte (l'effet peut tourner deux fois en dev) : on relance juste l'animation.
      if (!dialog.open) {
        dialog.showModal();
        document.body.style.overflow = 'hidden';
      }
      cancelAnimationFrame(raf);
      // Laisse le navigateur peindre l'état fermé avant d'animer l'ouverture.
      raf = requestAnimationFrame(() => {
        dialog.dataset.visible = '';
        dialog.querySelector<HTMLInputElement>('input[type="email"]')?.focus();
      });
    };

    open();
    window.addEventListener('hashchange', open);
    return () => {
      window.removeEventListener('hashchange', open);
      cancelAnimationFrame(raf);
    };
  }, []);

  const close = () => {
    const dialog = dialogRef.current;
    if (!dialog?.open) return;
    delete dialog.dataset.visible;
    window.setTimeout(() => {
      dialog.close();
      document.body.style.overflow = '';
      // Retire #liste-attente pour pouvoir rouvrir la modale avec le même lien.
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }, CLOSE_MS);
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="waitlist-title"
      // Échap : on anime la fermeture au lieu de laisser le navigateur fermer d'un coup.
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      // Clic sur le fond (hors du panneau) : ferme.
      onClick={(e) => e.target === e.currentTarget && close()}
      className="group m-auto w-[min(100%-24px,480px)] overflow-visible bg-transparent p-0 text-ink opacity-0 transition-opacity duration-300 backdrop:bg-black/60 backdrop:backdrop-blur-md data-visible:opacity-100">
      <div
        className="relative transition-transform duration-500 ease-[cubic-bezier(0.2,1.3,0.4,1)] translate-y-6 scale-[0.96] group-data-visible:translate-y-0 group-data-visible:scale-100">
        {/* Goutte qui dépasse du panneau, derrière le verre. */}
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 w-56 opacity-90 sm:-right-20 sm:w-64">
          <LiquidBlob speed={0.8} intensity={1.6} seed={2} />
        </div>
        <div aria-hidden className="pointer-events-none absolute -bottom-14 -left-12 w-36 opacity-80">
          <LiquidBlob speed={0.7} intensity={1.6} seed={5} glow={false} />
        </div>

        <div className="glass-frame relative overflow-hidden rounded-[32px] p-7 sm:p-9">
          {/* Halo bleu en haut du panneau */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-[radial-gradient(60%_100%_at_30%_0%,rgb(74_168_255/0.22),transparent)]"
          />

          <button
            type="button"
            onClick={close}
            aria-label="Fermer"
            className="glass absolute right-4 top-4 z-10 grid size-10 place-items-center rounded-full text-white/70 transition-colors hover:text-white">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden>
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>

          <div className="relative">
            <BlobBadge size={60}>
              <VoiceWaveIcon size={22} />
            </BlobBadge>
            <h2 id="waitlist-title" className="mt-7 text-[28px] font-bold leading-tight tracking-tight sm:text-[32px]">
              Rejoins la liste d’attente
            </h2>
            <p className="mt-2 text-[15px] leading-relaxed text-muted">
              Sois parmi les premiers à prendre la parole sur VHOA. On te prévient dès la sortie.
            </p>
            <div className="mt-8">
              <WaitlistForm />
            </div>
          </div>
        </div>
      </div>
    </dialog>
  );
}
