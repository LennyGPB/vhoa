'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { loadSubscription, openPortal, setCancel, type Subscription } from '@/app/actions/billing';
import { notifySessionChange } from '@/lib/use-session';

import { Sheet } from '../feed/Sheet';
import { BackIcon, SparkIcon } from '../icons';
import { euros, longDate } from './shared';

const PLAN = { monthly: 'Premium mensuel', yearly: 'Premium annuel' } as const;

/** « Mon abonnement » : état, prochain prélèvement, factures, résiliation en deux appuis. */
export function SubscriptionScreen() {
  const router = useRouter();
  const [sub, setSub] = useState<Subscription | null | 'error'>(null);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    loadSubscription().then((res) => {
      if (!res.ok && res.code === 'AUTH') {
        notifySessionChange();
        router.replace('/connexion');
        return;
      }
      setSub(res.ok ? res.data : 'error');
    });
  }, [router]);

  const run = (fn: () => Promise<void>) => {
    setError(null);
    startTransition(fn);
  };

  const cancel = (value: boolean) =>
    run(async () => {
      const res = await setCancel(value);
      if (res.ok) {
        setSub(res.data);
        setConfirm(false);
      } else setError(res.message);
    });

  const portal = () =>
    run(async () => {
      const res = await openPortal();
      if (res.ok) window.location.assign(res.data.url);
      else setError(res.message);
    });

  const stripe = sub && sub !== 'error' && sub.source === 'stripe' ? sub : null;
  const end = stripe ? longDate.format(new Date(stripe.currentPeriodEnd)) : '';

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -right-48 -top-48 size-[560px] opacity-50" />
      </div>
      <main className="relative mx-auto flex max-w-lg flex-col gap-6 px-5 pb-40 pt-[max(env(safe-area-inset-top),16px)]">
        <header className="flex items-center gap-3">
          <Link href="/profil" aria-label="Retour au profil" className="glass grid size-11 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </Link>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">Mon abonnement</h1>
        </header>

        {sub === null && <span aria-label="Chargement" className="h-[180px] animate-pulse rounded-[28px] bg-white/[0.04]" />}
        {sub === 'error' && <p className="py-16 text-center text-[15px] text-white/55">Impossible de charger ton abonnement. Réessaie plus tard.</p>}

        {stripe && (
          <>
            <section className="glass-frame rounded-[28px] p-6">
              <div className="flex items-center gap-3">
                <span className="grid size-12 place-items-center rounded-full bg-accent text-white">
                  <SparkIcon size={22} />
                </span>
                <div className="min-w-0">
                  <h2 className="text-[19px] font-bold">{PLAN[stripe.plan]}</h2>
                  <p className="text-[14px] text-white/55">
                    {stripe.amount !== null && `${euros(stripe.amount)} par ${stripe.plan === 'yearly' ? 'an' : 'mois'}`}
                  </p>
                </div>
              </div>
              <p className="mt-5 rounded-2xl bg-white/[0.04] px-4 py-3 text-[14px] leading-snug text-white/75">
                {stripe.cancelAtPeriodEnd ? (
                  <>
                    Résilié. Tu gardes Premium jusqu’au <b className="text-white">{end}</b>, sans autre prélèvement.
                  </>
                ) : (
                  <>
                    Prochain prélèvement{stripe.amount !== null && <> de <b className="text-white">{euros(stripe.amount)}</b></>} le{' '}
                    <b className="text-white">{end}</b>.
                  </>
                )}
              </p>
              {stripe.status === 'past_due' && (
                <p role="alert" className="mt-3 text-[14px] font-medium text-[#FF6B81]">
                  Le dernier paiement a échoué. Mets à jour ton moyen de paiement pour garder Premium.
                </p>
              )}
            </section>

            <div className="flex flex-col gap-2.5">
              {stripe.canManage && (
                <button
                  type="button"
                  onClick={portal}
                  disabled={pending}
                  className="h-13 rounded-full bg-white/[0.08] text-[15px] font-semibold transition-colors hover:bg-white/[0.12] disabled:opacity-60">
                  Moyen de paiement et factures
                </button>
              )}
              {stripe.cancelAtPeriodEnd ? (
                <button
                  type="button"
                  onClick={() => cancel(false)}
                  disabled={pending}
                  className="h-13 rounded-full bg-accent text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
                  Réactiver mon abonnement
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirm(true)}
                  disabled={pending}
                  className="h-13 rounded-full text-[15px] font-semibold text-[#FF6B81] transition-colors hover:bg-[#FF6B81]/10 disabled:opacity-60">
                  Résilier mon abonnement
                </button>
              )}
              {error && (
                <p role="alert" className="text-center text-[14px] font-medium text-[#FF6B81]">
                  {error}
                </p>
              )}
            </div>
          </>
        )}

        {sub && sub !== 'error' && sub.source === 'app' && (
          <section className="glass-frame rounded-[28px] p-6 text-center">
            <h2 className="text-[19px] font-bold">Premium via l’app mobile</h2>
            <p className="mt-2 text-[14px] leading-snug text-white/60">
              Ton abonnement se gère depuis les réglages de ton téléphone (App Store ou Google Play).
            </p>
          </section>
        )}

        {sub && sub !== 'error' && sub.source === null && (
          <section className="glass-frame flex flex-col items-center rounded-[28px] p-6 text-center">
            <h2 className="text-[19px] font-bold">Aucun abonnement</h2>
            <p className="mt-2 text-[14px] leading-snug text-white/60">Le coach, les gels de série et les effets de profil t’attendent.</p>
            <Link
              href="/premium"
              className="mt-5 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-110">
              Découvrir Premium
            </Link>
          </section>
        )}
      </main>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Résilier l’abonnement">
        <div className="flex flex-col gap-3 px-5 pb-6 pt-2">
          <h2 className="text-[20px] font-bold">Résilier ton abonnement ?</h2>
          <p className="text-[15px] leading-snug text-white/65">
            Tu gardes Premium jusqu’au <b className="text-white">{end}</b>. Ensuite, plus aucun prélèvement : tu repasses
            simplement en gratuit, sans rien perdre de tes prises.
          </p>
          <button
            type="button"
            onClick={() => cancel(true)}
            disabled={pending}
            className="mt-2 h-13 rounded-full bg-[#FF6B81] text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
            {pending ? 'Résiliation…' : 'Confirmer la résiliation'}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            className="h-13 rounded-full bg-white/[0.08] text-[15px] font-semibold transition-colors hover:bg-white/[0.12]">
            Garder Premium
          </button>
        </div>
      </Sheet>
    </div>
  );
}
