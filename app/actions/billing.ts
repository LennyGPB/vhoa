'use server';

import { api } from '@/lib/api';
import { accessToken, noTokenError } from '@/lib/session';

/**
 * Abonnement Premium (Stripe). Le site ne voit jamais de données de carte : le paiement se fait
 * sur la page Stripe, et l'API active Premium d'après Stripe (webhook + vérification au retour).
 */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const AUTH = { ok: false, code: 'AUTH', message: 'Ta session a expiré, reconnecte-toi.' } as const;
const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<T>(path, { method, body, token });
  if (res.ok) return { ok: true, data: res.data };
  if (res.status === 401) return AUTH;
  return { ok: false, code: res.code, message: res.message };
}

export type Plan = 'monthly' | 'yearly';

/** Tarifs en centimes d'euro, TTC. */
export interface Offer {
  enabled: boolean;
  monthly: number | null;
  yearly: number | null;
  /** Offre de lancement (1re année), avec le nombre réel de places restantes. */
  launch: { price: number; total: number; remaining: number } | null;
}

export type Subscription =
  | {
      source: 'stripe';
      plan: Plan;
      status: string;
      /** Montant des renouvellements (centimes). */
      amount: number | null;
      currentPeriodEnd: string;
      cancelAtPeriodEnd: boolean;
      premiumUntil: string;
      canManage: boolean;
    }
  | { source: 'app' | null; premiumUntil: string | null; canManage: false };

/** Tarifs publics de la page Premium. */
export async function loadOffer(): Promise<Result<Offer>> {
  const res = await api<Offer>('/billing/offer');
  return res.ok ? { ok: true, data: res.data } : { ok: false, code: res.code, message: res.message };
}

/** Ouvre le paiement Stripe et renvoie son adresse. */
export async function startCheckout(plan: unknown): Promise<Result<{ url: string }>> {
  if (plan !== 'monthly' && plan !== 'yearly') return BAD;
  const res = await call<{ url: string }>('/me/subscription/checkout', 'POST', { plan });
  // Seule une page de paiement Stripe est acceptée comme destination.
  if (res.ok && !res.data.url.startsWith('https://checkout.stripe.com/')) return BAD;
  return res;
}

/** Retour de paiement : vérifie auprès de Stripe et active Premium tout de suite. */
export async function confirmCheckout(sessionId: unknown): Promise<Result<{ isPremium: boolean; premiumUntil: string | null }>> {
  const id = typeof sessionId === 'string' && /^cs_[A-Za-z0-9_]{10,250}$/.test(sessionId) ? sessionId : undefined;
  return call('/me/subscription/confirm', 'POST', id ? { sessionId: id } : {});
}

export async function loadSubscription(): Promise<Result<Subscription>> {
  return call('/me/subscription');
}

/** Résilier (fin de la période payée) ou annuler la résiliation. */
export async function setCancel(cancel: unknown): Promise<Result<Subscription>> {
  if (typeof cancel !== 'boolean') return BAD;
  return call(`/me/subscription/${cancel ? 'cancel' : 'resume'}`, 'POST');
}

/** Portail Stripe : moyen de paiement et factures. */
export async function openPortal(): Promise<Result<{ url: string }>> {
  const res = await call<{ url: string }>('/me/subscription/portal', 'POST');
  if (res.ok && !res.data.url.startsWith('https://billing.stripe.com/')) return BAD;
  return res;
}
