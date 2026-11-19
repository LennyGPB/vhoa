'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';

import { loadOffer, type Offer } from '@/app/actions/billing';
import { COACH_HREF } from '@/lib/site';

import { UserAvatar } from '../AccountNav';
import { AvatarEffect, EFFECTS, type EffectId } from '../AvatarEffect';
import { BlobBadge } from '../BlobBadge';
import { BlobBridge } from '../BlobBridge';
import { Sheet } from '../feed/Sheet';
import { FlameIcon, ShieldIcon, SparkIcon, StepsIcon } from '../icons';
import { LiquidBlob } from '../LiquidBlob';
import { Logo } from '../Logo';
import { isReady, OfferPending, PayFooter, PlanPicker, useCheckout } from './Checkout';
import { PREMIUM_ANALYSES } from './shared';

/** Ce qui a ouvert la fenêtre : un effet de profil touché, ou l'onglet Coach IA. */
export type PaywallTopic = { kind: 'effect'; effect: EffectId } | { kind: 'coach' };

/** Fond des pastilles d'avantages ; le pont liquide qui les relie a la même couleur. */
const PERK_FILL = '#202128';

/**
 * Fenêtre Premium qui monte du bas, quand un membre gratuit touche un effet de profil ou
 * l'onglet Coach IA. Le contenu défile si besoin ; le bouton d'achat reste toujours en bas.
 */
export function PaywallSheet({
  topic,
  onClose,
  face = null,
  signedIn = true,
}: {
  /** null = fenêtre fermée. */
  topic: PaywallTopic | null;
  onClose: () => void;
  /** Photo du membre (aperçu de l'effet). */
  face?: { username: string; avatarUrl: string | null } | null;
  /** Visiteur : le bouton mène à l'inscription. */
  signedIn?: boolean;
}) {
  const [offer, setOffer] = useState<Offer | null | 'error'>(null);
  const checkout = useCheckout();
  // Le dernier sujet reste affiché pendant l'animation de fermeture.
  const [shown, setShown] = useState<PaywallTopic>(topic ?? { kind: 'coach' });
  // Comparé par valeur : le parent recrée l'objet à chaque rendu.
  const key = (t: PaywallTopic) => (t.kind === 'effect' ? `effect:${t.effect}` : 'coach');
  if (topic && key(topic) !== key(shown)) setShown(topic);

  const open = topic !== null;
  useEffect(() => {
    if (!open || offer !== null) return;
    loadOffer().then((res) => setOffer(res.ok ? res.data : 'error'));
  }, [open, offer]);

  const effectName = shown.kind === 'effect' ? (EFFECTS.find((e) => e.id === shown.effect)?.name ?? 'cet effet') : '';
  const ready = isReady(offer);

  return (
    <Sheet open={open} onClose={onClose} title="Passer Premium" tall>
      {/* Contenu : défile seulement sur les petits écrans. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-3">
        {shown.kind === 'effect' ? (
          <Hero
            visual={
              <AvatarEffect effect={shown.effect} size={84}>
                <UserAvatar user={face ?? { username: 'V', avatarUrl: null }} size={84} noEffect />
              </AvatarEffect>
            }
            pill={`Effet « ${effectName} »`}
            title={
              <>
                Fais-toi <span className="text-accent">remarquer</span>
              </>
            }
            text="Ton effet brille autour de ta photo, partout sur VHOA : feed, profil, commentaires."
          />
        ) : (
          <Hero
            visual={
              <BlobBadge size={80} seed={1.6}>
                <Logo height={34} />
              </BlobBadge>
            }
            pill="Coach IA"
            title={
              <>
                Progresse à <span className="text-accent">chaque prise</span>
              </>
            }
            text={`${PREMIUM_ANALYSES} analyses détaillées par mois, au lieu d’une.`}
          />
        )}

        {/* Les autres avantages : trois pastilles reliées par le pont liquide (D.A.). */}
        <ul className="mt-5 grid grid-cols-[1fr_16px_1fr_16px_1fr] items-center">
          {shown.kind === 'effect' ? (
            <Perk icon={<SparkIcon size={15} />} seed={1.2} title="Coach IA">
              {PREMIUM_ANALYSES} analyses/mois
            </Perk>
          ) : (
            <Perk icon={<StepsIcon size={15} />} seed={2.7} title="Progression">
              en courbes
            </Perk>
          )}
          <Bridge phase={0.4} />
          {shown.kind === 'effect' ? (
            <Perk icon={<StepsIcon size={15} />} seed={2.7} title="Progression">
              en courbes
            </Perk>
          ) : (
            <Perk icon={<FlameIcon size={15} />} seed={4.1} title="Gels de série">
              garde ta flamme
            </Perk>
          )}
          <Bridge phase={2.1} />
          {shown.kind === 'effect' ? (
            <Perk icon={<FlameIcon size={15} />} seed={4.1} title="Gels de série">
              garde ta flamme
            </Perk>
          ) : (
            <Perk icon={<ShieldIcon size={15} />} seed={5.3} title="Effets">
              sur ta photo
            </Perk>
          )}
        </ul>

        <div className="mt-5">{ready ? <PlanPicker offer={offer} state={checkout} compact /> : <OfferPending offer={offer} />}</div>

        <div className="mt-3 flex items-center justify-center gap-4 text-[13px] font-semibold">
          {shown.kind === 'coach' && (
            // Le gratuit garde son analyse du mois.
            <Link href={COACH_HREF} onClick={onClose} className="text-white/65 hover:text-white">
              Mon analyse offerte
            </Link>
          )}
          <Link href="/premium" onClick={onClose} className="text-azure hover:underline">
            Tous les avantages
          </Link>
        </div>
      </div>

      {/* Pied fixe : accord CGV et bouton d'achat, toujours visibles sans défiler. */}
      <div className="shrink-0 border-t border-white/[0.06] bg-[#16171b] px-5 pb-4 pt-3">
        <PayFooter
          state={checkout}
          signedIn={signedIn}
          cta={shown.kind === 'effect' ? `Débloquer « ${effectName} »` : 'Débloquer le coach'}
          next={shown.kind === 'coach' ? '/coach' : '/profil'}
          disabled={!ready}
          compact
        />
      </div>
    </Sheet>
  );
}

/** En-tête : visuel sur une goutte liquide, pastille, titre et phrase. */
function Hero({ visual, pill, title, text }: { visual: ReactNode; pill: string; title: ReactNode; text: string }) {
  return (
    <div className="relative isolate flex flex-col items-center pt-7 text-center">
      {/* Forme liquide centrée derrière le visuel (pt-7 + moitié du visuel ≈ 70 px). */}
      <div className="pointer-events-none absolute left-1/2 top-[70px] -z-10 w-[150px] -translate-x-1/2 -translate-y-1/2 opacity-60">
        <LiquidBlob className="h-auto w-full" speed={0.3} seed={4} glow={false} />
      </div>
      {visual}
      <span className="mt-5 rounded-full bg-accent/15 px-3 py-1 text-[12px] font-semibold text-azure">{pill}</span>
      <h2 className="mt-2.5 text-[26px] font-black leading-[1.05] tracking-[-0.03em]">{title}</h2>
      <p className="mt-2 max-w-[320px] text-[14px] leading-snug text-white/60">{text}</p>
    </div>
  );
}

function Perk({ icon, seed, title, children }: { icon: ReactNode; seed: number; title: string; children: ReactNode }) {
  return (
    <li
      className="relative flex h-[96px] min-w-0 flex-col items-center justify-center overflow-hidden rounded-[22px] px-1 text-center"
      style={{ background: PERK_FILL }}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-12 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.16),transparent)]"
      />
      <BlobBadge size={32} seed={seed}>
        {icon}
      </BlobBadge>
      <span className="relative mt-1.5 text-[13px] font-bold leading-tight text-white">{title}</span>
      <span className="relative mt-0.5 text-[11.5px] leading-tight text-white/50">{children}</span>
    </li>
  );
}

/** Pont liquide horizontal entre deux pastilles. */
function Bridge({ phase }: { phase: number }) {
  return (
    <li aria-hidden className="-mx-px flex justify-center">
      <BlobBridge orientation="horizontal" span={70} gap={18} fill={PERK_FILL} phase={phase} />
    </li>
  );
}
