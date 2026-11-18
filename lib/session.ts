import 'server-only';

import { cookies } from 'next/headers';

import { api } from './api';

/**
 * Session du visiteur, gardée dans des cookies httpOnly : le JavaScript de la page n'y a jamais
 * accès (un script injecté ne peut pas voler la session).
 * - vhoa_at : jeton d'accès (15 min) ;
 * - vhoa_rt : jeton de renouvellement (60 j, à usage unique : l'API le remplace à chaque fois) ;
 * - vhoa_user : pseudo et nom, pour l'affichage uniquement (aucun droit n'en dépend),
 *   lisible par la page (voir lib/use-session).
 */

const ACCESS = 'vhoa_at';
const REFRESH = 'vhoa_rt';
const USER = 'vhoa_user';
const REFRESH_MAX_AGE = 60 * 24 * 3600;

export interface Tokens {
  accessToken: string;
  refreshToken: string;
  /** Durée de vie du jeton d'accès, en secondes. */
  expiresIn: number;
}

export interface SessionUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  /** Effet Premium autour de la photo (null = aucun). */
  avatarEffect?: string | null;
}

function base() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
}

/** À appeler dans une Server Action ou un Route Handler (seuls endroits où l'on peut écrire un cookie). */
export async function saveTokens(tokens: Tokens) {
  const jar = await cookies();
  // Un peu avant l'expiration réelle : on renouvelle avant que l'API ne refuse le jeton.
  jar.set(ACCESS, tokens.accessToken, { ...base(), maxAge: Math.max(60, tokens.expiresIn - 30) });
  jar.set(REFRESH, tokens.refreshToken, { ...base(), maxAge: REFRESH_MAX_AGE });
}

export async function saveUser(user: SessionUser) {
  const jar = await cookies();
  // Effet non fourni (ex. modification du nom) : on garde celui du cookie actuel.
  const avatarEffect = user.avatarEffect !== undefined ? user.avatarEffect : ((await currentUser())?.avatarEffect ?? null);
  const shown = { id: user.id, username: user.username, displayName: user.displayName, avatarUrl: user.avatarUrl, avatarEffect };
  // Lisible par la page (httpOnly: false) : elle affiche l'avatar sans appel serveur, et les pages
  // restent statiques. Ce cookie ne donne aucun droit : tout passe par les jetons httpOnly.
  jar.set(USER, encodeURIComponent(JSON.stringify(shown)), {
    ...base(),
    httpOnly: false,
    maxAge: REFRESH_MAX_AGE,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(ACCESS);
  jar.delete(REFRESH);
  jar.delete(USER);
}

/** Utilisateur affiché (lecture seule, possible partout côté serveur). */
export async function currentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  if (!jar.has(REFRESH)) return null;
  try {
    const raw = jar.get(USER)?.value;
    return raw ? (JSON.parse(decodeURIComponent(raw)) as SessionUser) : null;
  } catch {
    return null;
  }
}

/**
 * Jeton d'accès valide, renouvelé si besoin. Uniquement dans une Server Action ou un Route Handler.
 * Session expirée ou révoquée : les cookies sont effacés et la fonction renvoie null.
 */
export async function accessToken(): Promise<string | null> {
  const jar = await cookies();
  const current = jar.get(ACCESS)?.value;
  if (current) return current;
  const refreshToken = jar.get(REFRESH)?.value;
  if (!refreshToken) {
    // Plus de session : on efface aussi le cookie d'affichage, sinon la page se croirait connectée.
    if (jar.has(USER)) await clearSession();
    return null;
  }
  const res = await api<Tokens>('/auth/refresh', { method: 'POST', body: { refreshToken } });
  if (!res.ok) {
    // Panne réseau : on garde la session pour réessayer plus tard. Jeton refusé : on déconnecte.
    if (res.status !== 0 && res.status < 500) await clearSession();
    return null;
  }
  await saveTokens(res.data);
  return res.data.accessToken;
}

/** Jeton de renouvellement (pour la déconnexion). */
export async function refreshTokenValue() {
  return (await cookies()).get(REFRESH)?.value;
}

/**
 * Pourquoi accessToken() n'a rien donné : plus de session (AUTH → reconnexion), ou session
 * toujours là mais API injoignable (NETWORK → on l'affiche, sans déconnecter personne).
 */
export async function noTokenError() {
  const stillLoggedIn = (await cookies()).has(REFRESH);
  return stillLoggedIn
    ? ({ ok: false, code: 'NETWORK', message: 'Impossible de joindre le serveur, réessaie dans un instant.' } as const)
    : ({ ok: false, code: 'AUTH', message: 'Ta session a expiré, reconnecte-toi.' } as const);
}
