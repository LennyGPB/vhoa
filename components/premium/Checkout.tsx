'use client';

import Link from 'next/link';
import { useState, useTransition, type ReactNode } from 'react';

import { startCheckout, type Offer, type Plan } from '@/app/actions/billing';

import { ArrowIcon, CheckIcon, FlameIcon } from '../icons';
import { euros } from './shared';

/** Carte d'une formule : sélectionnée = contour bleu (jamais noir, D.A.). */
function PlanCard({
  selected,
  onSelect,
  title,
  price,
  per,
  children,
  badge,
  footer,
  compact = false,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: ReactNode;
  per: string;
  children?: ReactNode;
  badge?: string;
  /** Pleine largeur sous la carte (jauge de l'offre de lancement). */
  footer?: ReactNode;
  compact?: boolean;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex w-full flex-col text-left transition-[background-color,box-shadow] ${
        compact ? 'rounded-[20px] px-3.5 py-3' : 'rounded-[24px] p-4'
      } ${
        selected ? 'bg-accent/10 shadow-[inset_0_0_0_2px_var(--color-accent)]' : 'bg-white/[0.04] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/[0.06]'
      }`}>
      <span className="flex w-full items-start gap-3">
      <span
        aria-hidden
        className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full transition-colors ${
          selected ? 'bg-accent text-white' : 'shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.25)]'
        }`}>
        {selected && <CheckIcon size={14} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="text-[16px] font-bold">{title}</span>
          {badge && <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-white">{badge}</span>}
        </span>
        {children && <span className={`block leading-snug text-white/55 ${compact ? 'mt-0.5 text-[12.5px]' : 'mt-1 text-[13px]'}`}>{children}</span>}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[20px] font-black leading-none tracking-[-0.02em]">{price}</span>
        <span className="mt-1 block text-[12px] text-white/45">{per}</span>
      </span>
      </span>
      {footer}
    </button>
  );
}

/**
 * Offre de lancement : places restantes (nombre réel, lu chez Stripe) et jauge des places prises.
 */
function LaunchMeter({ price, remaining, total, compact }: { price: number; remaining: number; total: number; compact: boolean }) {
  const taken = Math.max(0, total - remaining);
  return (
    <span className={`block w-full rounded-2xl bg-accent/12 shadow-[inset_0_0_0_1px_rgb(74_168_255/0.25)] ${compact ? 'mt-2 px-3 py-2' : 'mt-3 px-3.5 py-3'}`}>
      <span className="flex items-center gap-1.5 whitespace-nowrap text-[13px] text-white/80">
        <FlameIcon size={14} className="shrink-0 text-accent" />
        Plus que{' '}
        <b className="font-bold text-white">
          {remaining} {remaining > 1 ? 'places' : 'place'}
        </b>{' '}
        à {euros(price)}
        <span className="ml-auto text-[12px] font-semibold text-azure">
          {taken}/{total} prises
        </span>
      </span>
      {/* Places déjà prises sur le total. */}
      <span aria-hidden className="mt-2 block h-1.5 overflow-hidden rounded-full bg-white/10">
        <span
          className="block h-full rounded-full bg-gradient-to-r from-accent-strong to-azure"
          style={{ width: `${Math.max(3, (taken / Math.max(1, total)) * 100)}%` }}
        />
      </span>
    </span>
  );
}

/** Le bouton principal : bleu, plein, avec la flèche dans une pastille. */
export function ctaClass(extra = '') {
  return `group inline-flex h-14 w-full items-center justify-between rounded-full bg-accent pl-6 pr-1.5 text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-60 ${extra}`;
}

/** Offre prête à être vendue (prix chargés et abonnement ouvert). */
export function isReady(offer: Offer | null | 'error'): offer is Offer & { monthly: number; yearly: number } {
  return offer !== null && offer !== 'error' && offer.enabled && offer.monthly !== null && offer.yearly !== null;
}

/** État du paiement, partagé entre le choix de la formule et le pied (bouton). */
export function useCheckout() {
  const [plan, setPlan] = useState<Plan>('yearly');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const pay = () => {
    setError(null);
    startTransition(async () => {
      const res = await startCheckout(plan);
      if (res.ok) window.location.assign(res.data.url);
      else setError(res.message);
    });
  };

  return {
    plan,
    setPlan,
    error,
    pending,
    pay,
  };
}
export type CheckoutState = ReturnType<typeof useCheckout>;

/** Chargement, ou abonnement pas encore ouvert / tarifs indisponibles. */
export function OfferPending({ offer }: { offer: Offer | null | 'error' }) {
  if (offer === null) return <span aria-label="Chargement" className="block h-[180px] animate-pulse rounded-[24px] bg-white/[0.04]" />;
  return (
    <section className="glass-frame rounded-[24px] px-6 py-7 text-center">
      <h2 className="text-[20px] font-bold">{offer === 'error' ? 'Tarifs indisponibles' : 'Bientôt disponible'}</h2>
      <p className="mt-1.5 text-[14px] text-white/55">
        {offer === 'error'
          ? 'Impossible de charger les tarifs pour le moment. Réessaie plus tard.'
          : 'L’abonnement ouvre très vite. Reviens dans quelques jours !'}
      </p>
    </section>
  );
}

/** Les deux formules : annuel (offre de lancement le cas échéant) et mensuel. */
export function PlanPicker({ offer, state, compact = false }: { offer: Offer & { monthly: number; yearly: number }; state: CheckoutState; compact?: boolean }) {
  const { monthly, yearly, launch } = offer;
  return (
    <div role="radiogroup" aria-label="Formule" className={`flex flex-col ${compact ? 'gap-2' : 'gap-2.5'}`}>
      <PlanCard
        compact={compact}
        selected={state.plan === 'yearly'}
        onSelect={() => state.setPlan('yearly')}
        title="Annuel"
        badge={launch ? 'Lancement' : `−${Math.floor((1 - yearly / (monthly * 12)) * 100)} %`}
        price={
          launch ? (
            <>
              <s className="mr-1.5 text-[14px] font-semibold text-white/40">{euros(yearly)}</s>
              {euros(launch.price)}
            </>
          ) : (
            euros(yearly)
          )
        }
        per={launch ? 'la 1re année' : 'par an'}
        footer={launch && <LaunchMeter price={launch.price} remaining={launch.remaining} total={launch.total} compact={compact} />}>
        {launch ? (
          <>Puis {euros(yearly)} par an.</>
        ) : (
          <>Soit {euros(Math.round(yearly / 12))} par mois.</>
        )}
      </PlanCard>
      <PlanCard compact={compact} selected={state.plan === 'monthly'} onSelect={() => state.setPlan('monthly')} title="Mensuel" price={euros(monthly)} per="par mois" />
    </div>
  );
}

/** Le bouton de paiement (ou d'inscription), puis le rappel des CGV. */
export function PayFooter({
  state,
  signedIn,
  cta,
  next,
  disabled = false,
  compact = false,
}: {
  state: CheckoutState;
  signedIn: boolean;
  cta: string;
  /** Retour après inscription (visiteur). */
  next: string;
  /** Offre pas prête : bouton inactif. */
  disabled?: boolean;
  compact?: boolean;
}) {
  if (!signedIn) {
    return (
      <Link href={`/inscription?next=${encodeURIComponent(next)}`} className={ctaClass()}>
        Créer mon compte pour continuer
        <span className="grid size-11 place-items-center rounded-full bg-white/20">
          <ArrowIcon size={18} />
        </span>
      </Link>
    );
  }
  return (
    <div className={`flex flex-col ${compact ? 'gap-2.5' : 'gap-3'}`}>
      {state.error && (
        <p role="alert" className="px-1 text-[13px] font-medium text-[#FF6B81]">
          {state.error}
        </p>
      )}

      <button type="button" onClick={state.pay} disabled={state.pending || disabled} className={ctaClass()}>
        {state.pending ? 'Ouverture du paiement…' : cta}
        <span className="grid size-11 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
          <ArrowIcon size={18} />
        </span>
      </button>
      <p className={`px-2 text-center leading-snug text-white/45 ${compact ? 'text-[11.5px]' : 'text-[12px]'}`}>
        En payant, tu acceptes les{' '}
        <Link href="/cgv" className="font-semibold text-azure underline-offset-2 hover:underline">
          CGV
        </Link>
        .
      </p>
    </div>
  );
}

/**
 * Choix de la formule, puis paiement sur Stripe.
 * Version page (Premium) : tout à la suite.
 */
export function Checkout({
  offer,
  signedIn,
  cta = 'Passer Premium',
  next = '/premium',
}: {
  offer: Offer | null | 'error';
  signedIn: boolean;
  cta?: string;
  next?: string;
}) {
  const state = useCheckout();
  if (!isReady(offer)) return <OfferPending offer={offer} />;
  return (
    <section aria-label="Choisir une formule" className="flex flex-col gap-3">
      <PlanPicker offer={offer} state={state} />
      <PayFooter state={state} signedIn={signedIn} cta={cta} next={next} />
      <p className="px-2 text-center text-[12px] leading-relaxed text-white/40">
        Sans engagement, résiliable à tout moment depuis ton profil. Renouvellement automatique, prix TTC. Paiement sécurisé
        par Stripe : VHOA ne voit jamais ta carte.
      </p>
    </section>
  );
}
