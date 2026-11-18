'use client';

import { useEffect, useRef, useSyncExternalStore, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

const noop = () => () => {};

import { CloseIcon } from '../icons';

/**
 * Panneau opaque qui monte du bas (D.A. de l'app). Échap ou un appui sur le fond le ferment.
 * Sur grand écran, il reste centré et ne prend pas toute la largeur.
 */
export function Sheet({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  const panelRef = useRef<HTMLDivElement>(null);
  // Rendu dans <body> (après le chargement) : un parent avec du flou (backdrop-filter) ou une
  // transformation deviendrait sinon le repère du `fixed`, et le panneau fermé resterait visible.
  const isClient = useSyncExternalStore(
    noop,
    () => true,
    () => false,
  );

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    panelRef.current?.focus();
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!isClient) return null;

  return createPortal(
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div
        onClick={onClose}
        className={`absolute inset-0 bg-black/55 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        inert={!open}
        className={`absolute inset-x-0 bottom-0 mx-auto flex max-h-[80svh] max-w-lg flex-col rounded-t-[28px] bg-[#16171b] shadow-[0_-20px_60px_rgb(0_0_0/0.5),inset_0_1px_0_rgb(255_255_255/0.06)] outline-none transition-transform duration-[420ms] ease-[cubic-bezier(0.2,0.9,0.2,1)] ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <div className="flex items-center justify-between px-5 pb-2 pt-3">
          <span className="w-9" />
          <span aria-hidden className="h-1 w-10 rounded-full bg-white/20" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-9 place-items-center rounded-full text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white">
            <CloseIcon size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
