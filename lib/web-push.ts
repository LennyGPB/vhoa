'use client';

import { loadWebPushKey, removeWebPush, saveWebPush } from '@/app/actions/push';

/**
 * Notifications du site, côté navigateur.
 * - 'unsupported' : navigateur sans Web Push ;
 * - 'ios-install' : iPhone/iPad hors écran d'accueil (Apple n'autorise les notifications
 *   qu'une fois le site ajouté à l'écran d'accueil) ;
 * - 'denied' : refusées dans les réglages du navigateur ;
 * - 'off' / 'on' : désactivées / activées sur ce navigateur.
 */
export type PushState = 'unsupported' | 'ios-install' | 'denied' | 'off' | 'on';

const SW_URL = '/sw.js';

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

function supported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}

/** Clé VAPID (base64url) au format attendu par pushManager.subscribe. */
function keyBytes(base64: string) {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function registration() {
  return (await navigator.serviceWorker.getRegistration(SW_URL)) ?? navigator.serviceWorker.register(SW_URL);
}

export async function pushState(): Promise<PushState> {
  if (!supported()) return isIos() && !isStandalone() ? 'ios-install' : 'unsupported';
  if (Notification.permission === 'denied') return 'denied';
  const reg = await navigator.serviceWorker.getRegistration(SW_URL);
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'on' : 'off';
}

/** Demande l'autorisation, abonne ce navigateur et l'enregistre côté API. */
export async function enablePush(): Promise<{ ok: true } | { ok: false; message: string }> {
  if (!supported()) return { ok: false, message: 'Ton navigateur ne gère pas les notifications.' };
  const key = await loadWebPushKey();
  if (!key) return { ok: false, message: 'Les notifications arrivent bientôt.' };
  const permission = await Notification.requestPermission();
  if (permission !== 'granted')
    return { ok: false, message: 'Notifications refusées. Tu peux les autoriser dans les réglages du navigateur.' };
  try {
    const reg = await registration();
    await navigator.serviceWorker.ready;
    const sub =
      (await reg.pushManager.getSubscription()) ??
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) }));
    const res = await saveWebPush(sub.toJSON());
    if (!res.ok) {
      await sub.unsubscribe().catch(() => {});
      return { ok: false, message: res.message };
    }
    return { ok: true };
  } catch {
    return { ok: false, message: 'Impossible d’activer les notifications pour le moment.' };
  }
}

/** Désabonne ce navigateur (aussi appelé à la déconnexion : plus de notifications d'un compte quitté). */
export async function disablePush() {
  if (!supported()) return;
  try {
    const reg = await navigator.serviceWorker.getRegistration(SW_URL);
    const sub = await reg?.pushManager.getSubscription();
    if (!sub) return;
    await removeWebPush(sub.endpoint);
    await sub.unsubscribe();
  } catch {
    /* rien à faire : au pire, l'API oubliera l'abonnement au prochain envoi refusé */
  }
}
