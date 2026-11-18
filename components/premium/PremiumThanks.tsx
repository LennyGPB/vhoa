'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { confirmCheckout } from '@/app/actions/billing';

import { CheckIcon } from '../icons';
import { LiquidBlob } from '../LiquidBlob';
import { PREMIUM_ANALYSES } from './shared';

type State = 'checking' | 'done' | 'waiting' | 'error';

/**
 * Retour de Stripe après le paiement. L'API vérifie la session auprès de Stripe et active
 * Premium tout de suite ; si le paiement est encore en cours de validation, on réessaie un peu.
 */
export function PremiumThanks() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id');
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const attempt = async (n: number) => {
      const res = await confirmCheckout(sessionId);
      if (cancelled) return;
      if (res.ok && res.data.isPremium) setState('done');
      else if (n < 5) {
        setState(res.ok ? 'waiting' : 'checking');
        timer = setTimeout(() => attempt(n + 1), 2500);
      } else setState(res.ok ? 'waiting' : 'error');
    };
    attempt(0);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <main className="relative mx-auto flex min-h-svh max-w-lg flex-col items-center justify-center px-5 pb-40 pt-16 text-center">
        <div className="relative isolate grid place-items-center">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[110vw] -translate-x-1/2 -translate-y-1/2 opacity-70 sm:w-[560px]">
            <LiquidBlob className="h-auto w-full" speed={state === 'done' ? 0.45 : 0.25} seed={7} glow={false} />
          </div>
          <span
            className={`grid size-20 place-items-center rounded-full text-white transition-colors duration-500 ${
              state === 'done' ? 'bg-accent shadow-[0_18px_60px_-10px_var(--color-accent)]' : 'bg-white/[0.08]'
            }`}>
            {state === 'done' ? <CheckIcon size={36} /> : <span className="size-8 animate-spin rounded-full border-[3px] border-white/20 border-t-accent" />}
          </span>
        </div>

        {state === 'done' ? (
          <>
            <h1 className="mt-10 text-[32px] font-black leading-tight tracking-[-0.03em]">Bienvenue dans Premium !</h1>
            <p className="mt-3 max-w-xs text-[16px] leading-snug text-white/65">
              Tes {PREMIUM_ANALYSES} analyses du mois, tes gels de série et les effets de profil sont débloqués.
            </p>
            <div className="mt-8 flex w-full flex-col gap-2.5">
              <Link
                href="/profil"
                className="inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
                Choisir mon effet de profil
              </Link>
              <Link
                href="/creer"
                className="inline-flex h-14 items-center justify-center rounded-full bg-white/[0.08] text-[16px] font-semibold transition-colors hover:bg-white/[0.12]">
                Prendre la parole
              </Link>
            </div>
          </>
        ) : state === 'error' ? (
          <>
            <h1 className="mt-10 text-[26px] font-bold">Vérification impossible pour l’instant</h1>
            <p className="mt-3 max-w-xs text-[15px] leading-snug text-white/60">
              Si ton paiement est passé, Premium s’activera tout seul dans quelques minutes. Rien n’est débité deux fois.
            </p>
            <Link href="/profil" className="mt-8 text-[15px] font-semibold text-accent">
              Aller sur mon profil
            </Link>
          </>
        ) : (
          <>
            <h1 className="mt-10 text-[26px] font-bold">{state === 'waiting' ? 'Paiement en cours de validation…' : 'On active ton Premium…'}</h1>
            <p className="mt-3 max-w-xs text-[15px] leading-snug text-white/60">
              {state === 'waiting'
                ? 'Ta banque confirme le paiement. Premium s’activera tout seul dès que c’est fait, tu peux quitter cette page.'
                : 'Encore une seconde.'}
            </p>
            {state === 'waiting' && (
              <Link href="/profil" className="mt-8 text-[15px] font-semibold text-accent">
                Aller sur mon profil
              </Link>
            )}
          </>
        )}
      </main>
    </div>
  );
}
