'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { loadOffer, type Offer } from '@/app/actions/billing';

import { UserAvatar } from '../AccountNav';
import { AvatarEffect, EFFECTS, type EffectId } from '../AvatarEffect';
import { BlobBadge } from '../BlobBadge';
import { Sheet } from '../feed/Sheet';
import { FlameIcon, SparkIcon, StepsIcon } from '../icons';
import { LiquidBlob } from '../LiquidBlob';
import { Checkout } from './Checkout';
import { PREMIUM_ANALYSES } from './shared';

/**
 * Fenêtre Premium qui monte du bas quand un membre gratuit touche un effet de profil :
 * l'effet choisi en grand sur sa photo, les autres avantages, puis le paiement Stripe.
 */
export function PaywallSheet({
  effect,
  onClose,
  face,
}: {
  /** Effet touché ; null = fenêtre fermée. */
  effect: EffectId | null;
  onClose: () => void;
  face: { username: string; avatarUrl: string | null };
}) {
  const [offer, setOffer] = useState<Offer | null | 'error'>(null);
  // Le dernier effet reste affiché pendant l'animation de fermeture.
  const [shown, setShown] = useState<EffectId>(effect ?? 'aura');
  if (effect && effect !== shown) setShown(effect);

  const open = effect !== null;
  useEffect(() => {
    if (!open || offer !== null) return;
    loadOffer().then((res) => setOffer(res.ok ? res.data : 'error'));
  }, [open, offer]);

  const name = EFFECTS.find((e) => e.id === shown)?.name ?? 'Cet effet';

  return (
    <Sheet open={open} onClose={onClose} title="Passer Premium">
      <div className="overflow-y-auto overscroll-contain px-5 pb-6">
        {/* L'effet choisi, en grand, sur sa propre photo. */}
        <div className="relative isolate flex flex-col items-center pb-2 pt-12 text-center">
          {/* Forme liquide centrée derrière la photo (pt-12 + moitié de l'avatar = 100 px). */}
          <div className="pointer-events-none absolute left-1/2 top-[100px] -z-10 w-[210px] -translate-x-1/2 -translate-y-1/2 opacity-55">
            <LiquidBlob className="h-auto w-full" speed={0.3} seed={6} glow={false} />
          </div>
          <AvatarEffect effect={shown} size={104}>
            <UserAvatar user={face} size={104} noEffect />
          </AvatarEffect>
          <span className="mt-6 rounded-full bg-accent/15 px-3 py-1 text-[12px] font-semibold text-azure">Effet « {name} »</span>
          <h2 className="mt-3 text-[28px] font-black leading-[1.05] tracking-[-0.03em]">
            Fais-toi <span className="text-accent">remarquer</span>
          </h2>
          <p className="mt-2 max-w-xs text-[15px] leading-snug text-white/65">
            Ton effet brille autour de ta photo, partout sur VHOA : feed, profil, commentaires.
          </p>
        </div>

        {/* Le reste de Premium, en bref : trois pastilles côte à côte. */}
        <ul className="mt-5 grid grid-cols-3 gap-2">
          <Perk icon={<SparkIcon size={15} />} seed={1.2} title="Coach IA">
            {PREMIUM_ANALYSES} analyses/mois
          </Perk>
          <Perk icon={<StepsIcon size={15} />} seed={2.7} title="Ta progression">
            en courbes
          </Perk>
          <Perk icon={<FlameIcon size={15} />} seed={4.1} title="Gels de série">
            garde ta flamme
          </Perk>
        </ul>

        <div className="mt-5">
          <Checkout offer={offer} signedIn cta={`Débloquer « ${name} »`} />
        </div>

        <Link href="/premium" onClick={onClose} className="mt-3 block text-center text-[14px] font-semibold text-azure hover:underline">
          Voir tous les avantages
        </Link>
      </div>
    </Sheet>
  );
}

function Perk({ icon, seed, title, children }: { icon: React.ReactNode; seed: number; title: string; children: React.ReactNode }) {
  return (
    <li className="relative flex flex-col items-center overflow-hidden rounded-[20px] bg-white/[0.04] px-1.5 pb-3 pt-3.5 text-center shadow-[inset_0_1px_0_rgb(255_255_255/0.06)]">
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-14 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.16),transparent)]"
      />
      <BlobBadge size={34} seed={seed}>
        {icon}
      </BlobBadge>
      <span className="relative mt-2 text-[13px] font-bold leading-tight text-white">{title}</span>
      <span className="relative mt-0.5 text-[11.5px] leading-tight text-white/50">{children}</span>
    </li>
  );
}
