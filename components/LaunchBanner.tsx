'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { loadOffer, type Offer } from '@/app/actions/billing';

import { ArrowIcon, FlameIcon } from './icons';
import { euros } from './premium/shared';

/**
 * Bandeau fin en haut de l'accueil : l'offre de lancement Premium, avec le nombre réel de places
 * restantes (lu chez Stripe). Rien n'est affiché si l'offre n'existe pas ou est épuisée.
 */
export function LaunchBanner() {
  const [launch, setLaunch] = useState<NonNullable<Offer['launch']> | null>(null);

  useEffect(() => {
    loadOffer()
      .then((res) => {
        if (res.ok && res.data.enabled && res.data.launch && res.data.launch.remaining > 0) setLaunch(res.data.launch);
      })
      .catch(() => {});
  }, []);

  if (!launch) return null;

  return (
    <Link
      href="/premium"
      className="group relative flex h-10 items-center justify-center gap-2 overflow-hidden bg-[linear-gradient(90deg,#1F66D1,#4AA8FF_50%,#1F66D1)] px-4 text-[13px] text-white sm:h-11 sm:text-[14px]">
      {/* Reflet qui traverse doucement le bandeau. */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 animate-[banner-shine_5s_ease-in-out_infinite] bg-[linear-gradient(90deg,transparent,rgb(255_255_255/0.25),transparent)] motion-reduce:hidden"
      />
      <FlameIcon size={14} className="relative shrink-0" />
      {/* Mobile : version courte, sur une ligne. */}
      <span className="relative truncate sm:hidden">
        Premium <b className="font-bold">{euros(launch.price)}</b> la 1re année ·{' '}
        <b className="font-bold">
          {launch.remaining} {launch.remaining > 1 ? 'places' : 'place'}
        </b>
      </span>
      <span className="relative hidden truncate sm:inline">
        <b className="font-bold">Offre de lancement</b> · Premium à <b className="font-bold">{euros(launch.price)}</b> la 1re
        année pour les {launch.total} premiers
        <span className="text-white/85">
          {' '}
          · plus que {launch.remaining} {launch.remaining > 1 ? 'places' : 'place'}
        </span>
      </span>
      <span className="relative grid size-6 shrink-0 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
        <ArrowIcon size={13} />
      </span>
    </Link>
  );
}
