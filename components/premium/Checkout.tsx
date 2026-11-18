'use client';

import Link from 'next/link';
import { useState, useTransition, type ReactNode } from 'react';

import { startCheckout, type Offer, type Plan } from '@/app/actions/billing';

import { ArrowIcon, CheckIcon } from '../icons';
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
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  price: ReactNode;
  per: string;
  children?: ReactNode;
  badge?: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={`relative flex w-full items-start gap-3 rounded-[24px] p-4 text-left transition-[background-color,box-shadow] ${
        selected ? 'bg-accent/10 shadow-[inset_0_0_0_2px_var(--color-accent)]' : 'bg-white/[0.04] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:bg-white/[0.06]'
      }`}>
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
        {children && <span className="mt-1 block text-[13px] leading-snug text-white/55">{children}</span>}
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-[20px] font-black leading-none tracking-[-0.02em]">{price}</span>
        <span className="mt-1 block text-[12px] text-white/45">{per}</span>
      </span>
    </button>
  );
}

/** Le bouton principal : bleu, plein, avec la flèche dans une pastille. */
export function ctaClass(extra = '') {
  return `group inline-flex h-14 w-full items-center justify-between rounded-full bg-accent pl-6 pr-1.5 text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-60 ${extra}`;
}

/**
 * Choix de la formule, accord CGV / renonciation à la rétractation, puis paiement sur Stripe.
 * Partagé par la page Premium et la fenêtre Premium (paywall).
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
  /** Retour après inscription (visiteur). */
  next?: string;
}) {
  const [plan, setPlan] = useState<Plan>('yearly');
  const [waiver, setWaiver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (offer === null) return <span aria-label="Chargement" className="h-[260px] animate-pulse rounded-[28px] bg-white/[0.04]" />;

  const ready = offer !== 'error' && offer.enabled && offer.monthly !== null && offer.yearly !== null;
  if (!ready) {
    return (
      <section className="glass-frame rounded-[28px] px-6 py-8 text-center">
        <h2 className="text-[22px] font-bold">{offer === 'error' ? 'Tarifs indisponibles' : 'Bientôt disponible'}</h2>
        <p className="mt-1.5 text-[15px] text-white/55">
          {offer === 'error'
            ? 'Impossible de charger les tarifs pour le moment. Réessaie plus tard.'
            : 'L’abonnement ouvre très vite. Reviens dans quelques jours !'}
        </p>
      </section>
    );
  }

  const monthly = offer.monthly!;
  const yearly = offer.yearly!;
  const launch = offer.launch;

  const pay = () => {
    setError(null);
    if (!waiver) {
      setError('Coche la case ci-dessus pour continuer.');
      return;
    }
    startTransition(async () => {
      const res = await startCheckout(plan, true);
      if (res.ok) window.location.assign(res.data.url);
      else setError(res.message);
    });
  };

  return (
    <section aria-label="Choisir une formule" className="flex flex-col gap-3">
      <div role="radiogroup" aria-label="Formule" className="flex flex-col gap-2.5">
        <PlanCard
          selected={plan === 'yearly'}
          onSelect={() => setPlan('yearly')}
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
          per={launch ? 'la 1re année' : 'par an'}>
          {launch ? (
            <>
              Offre de lancement, puis {euros(yearly)} par an.{' '}
              <span className="font-semibold text-azure">
                Plus que {launch.remaining} {launch.remaining > 1 ? 'places' : 'place'} sur {launch.total}.
              </span>
            </>
          ) : (
            <>Soit {euros(Math.round(yearly / 12))} par mois.</>
          )}
        </PlanCard>
        <PlanCard selected={plan === 'monthly'} onSelect={() => setPlan('monthly')} title="Mensuel" price={euros(monthly)} per="par mois" />
      </div>

      {signedIn ? (
        <>
          <label className="mt-2 flex cursor-pointer items-start gap-3 rounded-[20px] bg-white/[0.03] p-3.5">
            <input
              type="checkbox"
              checked={waiver}
              onChange={(e) => {
                setWaiver(e.target.checked);
                setError(null);
              }}
              className="peer sr-only"
            />
            <span
              aria-hidden
              className={`mt-0.5 grid size-5 shrink-0 place-items-center rounded-md transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-accent ${
                waiver ? 'bg-accent text-white' : 'shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.3)]'
              }`}>
              {waiver && <CheckIcon size={13} />}
            </span>
            <span className="text-[13px] leading-snug text-white/65">
              Je veux profiter de Premium tout de suite et je renonce à mon droit de rétractation de 14 jours. J’accepte les{' '}
              <Link href="/cgv" className="font-semibold text-azure underline-offset-2 hover:underline">
                conditions générales de vente
              </Link>
              .
            </span>
          </label>

          {error && (
            <p role="alert" className="px-1 text-[14px] font-medium text-[#FF6B81]">
              {error}
            </p>
          )}

          <button type="button" onClick={pay} disabled={pending} className={ctaClass('mt-1')}>
            {pending ? 'Ouverture du paiement…' : cta}
            <span className="grid size-11 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
              <ArrowIcon size={18} />
            </span>
          </button>
        </>
      ) : (
        <Link href={`/inscription?next=${encodeURIComponent(next)}`} className={ctaClass('mt-2')}>
          Créer mon compte pour continuer
          <span className="grid size-11 place-items-center rounded-full bg-white/20">
            <ArrowIcon size={18} />
          </span>
        </Link>
      )}

      <p className="px-2 text-center text-[12px] leading-relaxed text-white/40">
        Sans engagement, résiliable à tout moment depuis ton profil. Renouvellement automatique, prix TTC. Paiement sécurisé
        par Stripe : VHOA ne voit jamais ta carte.
      </p>
    </section>
  );
}
