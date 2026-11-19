'use client';

import { useSyncExternalStore } from 'react';

/**
 * Installation de VHOA comme une app (PWA).
 * - 'prompt'    : Android / Chrome / Edge : le navigateur propose sa vraie fenêtre d'installation ;
 * - 'ios'       : iPhone / iPad : Apple impose « Partager → Sur l'écran d'accueil » ;
 * - 'manual'    : autres navigateurs : via leur menu ;
 * - 'installed' : déjà ouverte en app (rien à proposer) ;
 * - 'unknown'   : rendu serveur / avant chargement.
 */
export type InstallMode = 'prompt' | 'ios' | 'manual' | 'installed' | 'unknown';

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
let ready = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function standalone() {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as { standalone?: boolean }).standalone === true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}

/** À appeler une fois au chargement (le navigateur annonce l'installation possible très tôt). */
export function initPwa() {
  if (ready || typeof window === 'undefined') return;
  ready = true;
  installed = standalone();
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault(); // on garde la fenêtre pour notre bouton « Installer l'app »
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    deferred = null;
    emit();
  });
  // Service worker (notifications) : aide aussi certains navigateurs à proposer l'installation.
  navigator.serviceWorker?.register('/sw.js').catch(() => {});
  emit();
}

function mode(): InstallMode {
  if (!ready) return 'unknown';
  if (installed) return 'installed';
  if (deferred) return 'prompt';
  return isIos() ? 'ios' : 'manual';
}

export function useInstallMode(): InstallMode {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    mode,
    () => 'unknown',
  );
}

/** Ouvre la fenêtre d'installation du navigateur. Vrai si l'utilisateur a accepté. */
export async function promptInstall(): Promise<boolean> {
  if (!deferred) return false;
  const event = deferred;
  deferred = null;
  emit();
  await event.prompt();
  const { outcome } = await event.userChoice;
  return outcome === 'accepted';
}

/* ---------- Propositions d'installation ---------- */

export type InstallReason = 'settings' | 'signup' | 'feed';

const EVENT = 'vhoa:install';
const SIGNUP_FLAG = 'vhoa_install_after_signup';
const SNOOZE_KEY = 'vhoa_install_snoozed_at';
/** Après « Plus tard », pas de nouvelle proposition automatique pendant 14 jours. */
const SNOOZE_MS = 14 * 24 * 3600_000;

const storage = {
  get: (s: Storage, k: string) => {
    try {
      return s.getItem(k);
    } catch {
      return null;
    }
  },
  set: (s: Storage, k: string, v: string) => {
    try {
      s.setItem(k, v);
    } catch {
      /* navigation privée : tant pis */
    }
  },
  del: (s: Storage, k: string) => {
    try {
      s.removeItem(k);
    } catch {
      /* rien */
    }
  },
};

/** Demande l'ouverture de la fenêtre d'installation (gérée par InstallManager). */
export function openInstall(reason: InstallReason) {
  window.dispatchEvent(new CustomEvent<InstallReason>(EVENT, { detail: reason }));
}

export function onOpenInstall(handler: (reason: InstallReason) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<InstallReason>).detail);
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}

/**
 * Inscription réussie : la proposition s'affiche sur la page d'arrivée. Navigation interne :
 * l'événement part après un court délai. Rechargement complet : InstallManager reprend le drapeau.
 */
export function markSignupInstall() {
  storage.set(sessionStorage, SIGNUP_FLAG, '1');
  setTimeout(() => {
    if (takeSignupInstall()) openInstall('signup');
  }, 1500);
}

export function takeSignupInstall() {
  const flagged = storage.get(sessionStorage, SIGNUP_FLAG) === '1';
  if (flagged) storage.del(sessionStorage, SIGNUP_FLAG);
  return flagged;
}

export function snoozeInstall() {
  storage.set(localStorage, SNOOZE_KEY, String(Date.now()));
}

export function installSnoozed() {
  const at = Number(storage.get(localStorage, SNOOZE_KEY));
  return Number.isFinite(at) && at > 0 && Date.now() - at < SNOOZE_MS;
}
