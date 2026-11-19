'use server';

import { api } from '@/lib/api';
import { accessToken, noTokenError } from '@/lib/session';

/** Notifications du site (Web Push) : clé publique, abonnement et désabonnement de ce navigateur. */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;
const B64URL = /^[A-Za-z0-9_-]+=*$/;

/** Clé publique VAPID (null : notifications du site pas encore configurées côté API). */
export async function loadWebPushKey(): Promise<string | null> {
  const res = await api<{ publicKey: string | null }>('/push/web-key');
  return res.ok ? res.data.publicKey : null;
}

export async function saveWebPush(input: unknown): Promise<Result<unknown>> {
  const sub = input as { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } } | null;
  const endpoint = sub?.endpoint;
  const p256dh = sub?.keys?.p256dh;
  const auth = sub?.keys?.auth;
  if (
    typeof endpoint !== 'string' ||
    !endpoint.startsWith('https://') ||
    endpoint.length > 1000 ||
    typeof p256dh !== 'string' ||
    !B64URL.test(p256dh) ||
    p256dh.length > 200 ||
    typeof auth !== 'string' ||
    !B64URL.test(auth) ||
    auth.length > 100
  )
    return BAD;
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api('/me/web-push', { method: 'POST', body: { endpoint, p256dh, auth }, token });
  return res.ok ? { ok: true, data: null } : { ok: false, code: res.code, message: res.message };
}

export async function removeWebPush(endpoint: unknown): Promise<void> {
  if (typeof endpoint !== 'string' || endpoint.length > 1000) return;
  const token = await accessToken();
  if (!token) return;
  await api('/me/web-push', { method: 'DELETE', body: { endpoint }, token });
}
