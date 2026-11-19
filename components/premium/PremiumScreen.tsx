'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import { loadOffer, type Offer } from '@/app/actions/billing';
import { loadProfile } from '@/app/actions/me';
import { useSessionUser } from '@/lib/use-session';

import { UserAvatar } from '../AccountNav';
import { AvatarEffect, EFFECTS, type EffectId } from '../AvatarEffect';
import { BlobBadge } from '../BlobBadge';
import { BlobBridge } from '../BlobBridge';
import { BackIcon, CheckIcon, FlameIcon, SparkIcon, StepsIcon } from '../icons';
import { LiquidBlob } from '../LiquidBlob';
import { isReady, OfferPending, PayFooter, PlanPicker, useCheckout } from './Checkout';
import { euros, PREMIUM_ANALYSES } from './shared';

/** Carte d'avantage : fond plein #16171b, comme le pont liquide qui la relie aux autres. */
function Card({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <div className={`glass-solid relative overflow-hidden rounded-[26px] p-4 ${className}`}>
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-12 size-40 rounded-full bg-[radial-gradient(closest-side,rgb(74_168_255/0.16),transparent)]"
      />
      <div className="relative">{children}</div>
    </div>
  );
}

/** Pont liquide vertical, centré sous une colonne de la grille 1fr / 40px / 1fr. */
function DownBridge({ column, phase }: { column: 1 | 3; phase: number }) {
  return (
    <div aria-hidden className="-my-px grid grid-cols-[1fr_40px_1fr]">
      <span className={`flex justify-center ${column === 3 ? 'col-start-3' : ''}`}>
        <BlobBridge orientation="vertical" span={112} phase={phase} />
      </span>
    </div>
  );
}

/** Petite courbe qui descend (moins de mots parasites) : illustration, pas des données. */
function MiniCurve() {
  return (
    <svg aria-hidden viewBox="0 0 120 44" className="mt-3 h-11 w-full">
      <defs>
        <linearGradient id="premium-curve" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#4AA8FF" stopOpacity="0.3" />
          <stop offset="1" stopColor="#4AA8FF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d="M2 8 C20 10 26 20 42 18 S66 30 80 28 S104 38 118 36 L118 44 L2 44 Z" fill="url(#premium-curve)" />
      <path d="M2 8 C20 10 26 20 42 18 S66 30 80 28 S104 38 118 36" fill="none" stroke="#4AA8FF" strokeWidth="2.2" strokeLinecap="round" />
      <circle cx="118" cy="36" r="3.5" fill="#4AA8FF" stroke="#16171b" strokeWidth="1.5" />
    </svg>
  );
}

const SHOWCASE: EffectId[] = ['liquid', 'aura', 'orbit', 'sparkle', 'neon'];

/** Page Premium : avantages, formules, offre de lancement, paiement Stripe. */
export function PremiumScreen() {
  const user = useSessionUser();
  const [offer, setOffer] = useState<Offer | null | 'error'>(null);
  const [isPremium, setIsPremium] = useState(false);

  useEffect(() => {
    loadOffer().then((res) => setOffer(res.ok ? res.data : 'error'));
  }, []);

  useEffect(() => {
    if (!user) return;
    loadProfile().then((res) => res.ok && setIsPremium(res.data.isPremium));
  }, [user]);

  const checkout = useCheckout();
  const router = useRouter();
  const ready = isReady(offer);
  const face = { username: user?.username ?? 'V', avatarUrl: user?.avatarUrl ?? null };
  const launch = offer && offer !== 'error' && offer.enabled ? offer.launch : null;

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      {/* Retour : la page n'a pas de barre d'onglets (le bouton d'achat occupe le bas de l'écran). */}
      <button
        type="button"
        onClick={() => (window.history.length > 1 ? router.back() : router.push('/feed'))}
        aria-label="Retour"
        className="glass fixed left-4 top-[max(env(safe-area-inset-top),16px)] z-30 grid size-11 place-items-center rounded-full text-white">
        <BackIcon size={20} />
      </button>

      <main
        className={`relative mx-auto flex max-w-lg flex-col gap-8 px-4 pt-[max(env(safe-area-inset-top),28px)] lg:grid lg:max-w-5xl lg:grid-cols-[1.1fr_1fr] lg:items-start lg:gap-x-12 ${
          isPremium ? 'pb-16' : 'pb-[calc(env(safe-area-inset-bottom)+150px)]'
        }`}>
        {/* En-tête : la photo du membre avec l'effet Aura, sur une goutte liquide. */}
        <header className="relative flex flex-col items-center pt-10 text-center lg:col-span-2">
          <div className="relative isolate grid place-items-center">
            <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[240px] -translate-x-1/2 -translate-y-1/2 opacity-60">
              <LiquidBlob className="h-auto w-full" speed={0.25} seed={3} glow={false} />
            </div>
            {user ? (
              <AvatarEffect effect="aura" size={96}>
                <UserAvatar user={face} size={96} noEffect />
              </AvatarEffect>
            ) : (
              <BlobBadge size={96} seed={2.3}>
                <SparkIcon size={36} />
              </BlobBadge>
            )}
          </div>
          <h1 className="mt-12 text-[clamp(34px,10vw,46px)] font-black leading-none tracking-[-0.04em]">
            VHOA <span className="bg-gradient-to-r from-azure to-accent bg-clip-text text-transparent">Premium</span>
          </h1>
          <p className="mt-3 max-w-[300px] text-[16px] leading-snug text-white/65">
            Progresse plus vite avec le coach, et fais-toi remarquer.
          </p>
          {launch && !isPremium && (
            <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-accent/12 py-1.5 pl-1.5 pr-3.5 text-[13px] font-semibold text-azure shadow-[inset_0_0_0_1px_rgb(74_168_255/0.25)]">
              <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">Lancement</span>
              {euros(launch.price)} la 1re année · plus que {launch.remaining} places
            </span>
          )}
        </header>

        {/* Avantages : quatre cartes reliées en serpentin par le pont liquide (D.A.).
            Coach ↓ Progression → Gels ↓ Effets. */}
        <section aria-label="Ce que comprend Premium" className="flex flex-col">
          <Card>
            <div className="flex items-center gap-4">
              <BlobBadge size={52} seed={1.4}>
                <SparkIcon size={22} />
              </BlobBadge>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/45">Coach IA</p>
                <p className="mt-0.5 flex items-baseline gap-2 whitespace-nowrap">
                  <span className="text-[34px] font-black leading-none tracking-[-0.04em]">{PREMIUM_ANALYSES}</span>
                  <span className="text-[15px] font-semibold text-white/85">analyses par mois</span>
                </p>
                <p className="mt-1 text-[12.5px] font-medium text-azure">au lieu d’une en gratuit</p>
              </div>
            </div>
            <p className="mt-3 text-[14px] leading-snug text-white/55">
              Un retour détaillé sur ton argumentation, ton rythme et tes mots parasites, avec 3 conseils concrets.
            </p>
          </Card>
          <DownBridge column={1} phase={0} />
          <div className="grid grid-cols-[1fr_40px_1fr] items-center">
            <Card className="h-[168px]">
            <StepsIcon size={20} className="text-accent" />
              <p className="mt-2 text-[15px] font-bold leading-tight">Ta progression</p>
              <p className="mt-0.5 text-[13px] leading-snug text-white/50">Courbes et historique</p>
              <MiniCurve />
            </Card>
            <span aria-hidden className="-mx-px flex justify-center">
              <BlobBridge orientation="horizontal" span={128} phase={1.4} />
            </span>
            <Card className="h-[168px]">
            <FlameIcon size={20} className="text-accent" />
              <p className="mt-2 text-[15px] font-bold leading-tight">Gels de série</p>
              <p className="mt-0.5 text-[13px] leading-snug text-white/50">Une semaine sans poster ne casse plus ta série.</p>
            </Card>
          </div>
          <DownBridge column={3} phase={2.6} />
          <Card>
            <div className="flex items-baseline justify-between gap-3">
              <p className="text-[15px] font-bold">Un effet autour de ta photo</p>
              <p className="shrink-0 text-[12px] font-semibold text-white/45">{EFFECTS.length} au choix</p>
            </div>
            <p className="mt-0.5 text-[13px] leading-snug text-white/50">Visible partout : feed, profil, commentaires.</p>
            <div aria-hidden className="mt-4 flex justify-between px-1">
              {SHOWCASE.map((id) => (
                <AvatarEffect key={id} effect={id} size={38}>
                  <UserAvatar user={face} size={38} noEffect />
                </AvatarEffect>
              ))}
            </div>
          </Card>
        </section>

        {/* Formules (sur grand écran : colonne de droite, qui reste visible au défilement). */}
        <div className="lg:sticky lg:top-10">
          {isPremium ? (
            <section className="glass-frame flex flex-col items-center rounded-[28px] px-6 py-8 text-center">
              <span className="grid size-12 place-items-center rounded-full bg-accent text-white">
                <CheckIcon size={22} />
              </span>
              <h2 className="mt-4 text-[22px] font-bold">Tu es Premium</h2>
              <p className="mt-1.5 text-[15px] text-white/55">Merci de soutenir VHOA !</p>
              <Link
                href="/profil/abonnement"
                className="mt-6 inline-flex h-12 items-center rounded-full bg-white/[0.08] px-6 text-[15px] font-semibold transition-colors hover:bg-white/[0.12]">
                Gérer mon abonnement
              </Link>
            </section>
          ) : ready ? (
            <section aria-label="Choisir une formule" className="flex flex-col gap-3">
              <PlanPicker offer={offer} state={checkout} />
              <p className="px-2 text-center text-[12px] leading-relaxed text-white/40">
                Sans engagement, résiliable à tout moment depuis ton profil. Renouvellement automatique, prix TTC. Paiement
                sécurisé par Stripe : VHOA ne voit jamais ta carte.
              </p>
            </section>
          ) : (
            <OfferPending offer={offer} />
          )}
        </div>
      </main>

      {/* Bouton d'achat fixé en bas de l'écran, toujours visible. */}
      {!isPremium && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.06] bg-[#0a0a0b]/85 px-4 pb-[max(env(safe-area-inset-bottom),14px)] pt-3 backdrop-blur-xl">
          <div className="mx-auto max-w-lg">
            <PayFooter state={checkout} signedIn={!!user} cta="Passer Premium" next="/premium" disabled={!ready} compact />
          </div>
        </div>
      )}
    </div>
  );
}
