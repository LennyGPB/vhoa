'use client';

import { useEffect, useState } from 'react';

import { ArrowIcon } from './icons';
import { Logo } from './Logo';

export interface MenuItem {
  href: string;
  label: string;
}

/**
 * Barre mobile posée au-dessus du cadre en verre : logo + bouton burger.
 * Le menu s'ouvre dans un panneau en verre qui descend du haut.
 */
export function MobileMenu({ items, cta }: { items: MenuItem[]; cta: MenuItem }) {
  const [open, setOpen] = useState(false);

  // Échap ferme le menu ; la page ne défile pas derrière tant qu'il est ouvert.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <div className="md:hidden">
      <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between">
        <a href="#" aria-label="VHOA, retour en haut" className="pl-1">
          <Logo height={30} />
        </a>
        <button
          type="button"
          aria-label={open ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
          className="glass relative z-50 grid size-12 place-items-center rounded-full">
          {/* Trois traits qui se croisent en X à l'ouverture. */}
          <span aria-hidden className="relative block h-3.5 w-5">
            <span
              className={`absolute left-0 top-0 h-[2px] w-5 rounded-full bg-white transition-transform duration-300 ${
                open ? 'translate-y-[6px] rotate-45' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[6px] h-[2px] w-5 rounded-full bg-white transition-opacity duration-200 ${
                open ? 'opacity-0' : ''
              }`}
            />
            <span
              className={`absolute left-0 top-[12px] h-[2px] w-5 rounded-full bg-white transition-transform duration-300 ${
                open ? '-translate-y-[6px] -rotate-45' : ''
              }`}
            />
          </span>
        </button>
      </div>

      {/* Fond assombri + panneau */}
      <div
        className={`fixed inset-0 z-40 bg-black/50 backdrop-blur-sm transition-opacity duration-300 ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={close}
        aria-hidden
      />
      <nav
        id="menu-mobile"
        aria-label="Menu"
        inert={!open}
        className={`glass-frame fixed inset-x-3 top-3 z-40 rounded-[32px] px-6 pb-6 pt-20 transition-[opacity,transform] duration-500 ease-[cubic-bezier(0.2,0.9,0.2,1)] ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-6 opacity-0'
        }`}>
        <ul className="flex flex-col">
          {items.map((item) => (
            <li key={item.label} className="border-b border-white/[0.07] last:border-0">
              <a
                href={item.href}
                onClick={close}
                className="flex items-center justify-between py-4 text-[22px] font-semibold tracking-tight text-white">
                {item.label}
                <ArrowIcon size={18} className="text-white/40" />
              </a>
            </li>
          ))}
        </ul>
        <a
          href={cta.href}
          onClick={close}
          className="mt-6 flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
          {cta.label}
        </a>
      </nav>
    </div>
  );
}
