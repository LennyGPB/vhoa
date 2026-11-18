'use client';

import { useMemo, useSyncExternalStore } from 'react';

/** Utilisateur connecté tel qu'affiché (cookie vhoa_user, posé par le serveur à la connexion). */
export interface ViewerUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  /** Effet Premium autour de la photo (null = aucun). */
  avatarEffect?: string | null;
}

const EVENT = 'vhoa-session';

function readCookie() {
  const match = document.cookie.match(/(?:^|;\s*)vhoa_user=([^;]*)/);
  return match ? match[1] : '';
}

function subscribe(onChange: () => void) {
  window.addEventListener(EVENT, onChange);
  window.addEventListener('focus', onChange);
  return () => {
    window.removeEventListener(EVENT, onChange);
    window.removeEventListener('focus', onChange);
  };
}

/** À appeler après une connexion ou une déconnexion : les composants relisent la session. */
export function notifySessionChange() {
  window.dispatchEvent(new Event(EVENT));
}

/**
 * Utilisateur connecté, ou null. Toujours null au premier rendu (serveur et hydratation) :
 * les pages restent statiques, l'avatar apparaît juste après le chargement.
 */
export function useSessionUser(): ViewerUser | null {
  const raw = useSyncExternalStore(subscribe, readCookie, () => '');
  return useMemo(() => {
    if (!raw) return null;
    try {
      // Le cookie est encodé deux fois : par nous (encodeURIComponent) puis par Next.
      let text = decodeURIComponent(raw);
      if (text.startsWith('%')) text = decodeURIComponent(text);
      return JSON.parse(text) as ViewerUser;
    } catch {
      return null;
    }
  }, [raw]);
}
