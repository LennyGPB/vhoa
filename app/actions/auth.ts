'use server';

import { redirect } from 'next/navigation';

import { api } from '@/lib/api';
import {
  accessToken,
  clearSession,
  noTokenError,
  refreshTokenValue,
  saveTokens,
  saveUser,
  type SessionUser,
  type Tokens,
} from '@/lib/session';

/**
 * Inscription, connexion et déconnexion. Le navigateur ne voit jamais les jetons :
 * ils partent directement de l'API vers les cookies httpOnly (lib/session).
 * L'API valide tout (formats, âge, limitation de débit) ; ici, on refuse juste les entrées absurdes.
 */

export type AuthResult =
  | { ok: true; isNewUser?: boolean }
  | { ok: false; code: string; message: string };

type SessionResponse = Tokens & { user: SessionUser; isNewUser?: boolean };

const INVALID: AuthResult = { ok: false, code: 'INVALID', message: 'Champs invalides.' };

const str = (v: unknown, max: number): v is string => typeof v === 'string' && v.length > 0 && v.length <= max;

async function open(path: string, body: unknown): Promise<AuthResult> {
  const res = await api<SessionResponse>(path, { method: 'POST', body });
  if (!res.ok) return { ok: false, code: res.code, message: res.message };
  await saveTokens(res.data);
  await saveUser(res.data.user);
  return { ok: true, isNewUser: res.data.isNewUser };
}

export async function register(input: {
  email: unknown;
  password: unknown;
  username: unknown;
  ageConfirmed: unknown;
}): Promise<AuthResult> {
  const { email, password, username, ageConfirmed } = input;
  if (!str(email, 254) || !str(password, 128) || !str(username, 30) || ageConfirmed !== true) return INVALID;
  return open('/auth/register', { email, password, username, ageConfirmed: true });
}

export async function login(input: { email: unknown; password: unknown }): Promise<AuthResult> {
  const { email, password } = input;
  if (!str(email, 254) || !str(password, 128)) return INVALID;
  return open('/auth/login', { email, password });
}

/**
 * Connexion Google avec le jeton d'identité reçu dans le navigateur.
 * Nouveau compte sans confirmation d'âge : l'API répond AGE_CONFIRMATION_REQUIRED,
 * le site pose la question puis rappelle avec `ageConfirmed`.
 */
export async function googleSignIn(input: { idToken: unknown; ageConfirmed?: unknown }): Promise<AuthResult> {
  const { idToken, ageConfirmed } = input;
  if (!str(idToken, 4000)) return INVALID;
  return open('/auth/google', { idToken, ...(ageConfirmed === true ? { ageConfirmed: true } : {}) });
}

export async function logout() {
  const token = await accessToken();
  const refreshToken = await refreshTokenValue();
  // Révoque la session côté API ; même en cas d'échec, on efface les cookies.
  if (token) await api('/auth/logout', { method: 'POST', token, body: refreshToken ? { refreshToken } : {} });
  await clearSession();
  redirect('/');
}

/**
 * Déconnecte toutes les sessions du compte (téléphones, autres navigateurs), celle-ci comprise :
 * l'API révoque tous les jetons de renouvellement. Retour à la connexion.
 */
export async function logoutEverywhere(): Promise<AuthResult> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api('/auth/logout-all', { method: 'POST', token });
  if (!res.ok && res.status !== 401) return { ok: false, code: res.code, message: res.message };
  await clearSession();
  redirect('/connexion');
}

/**
 * Suppression définitive du compte (RGPD) : l'API efface le compte, ses prises (et leurs fichiers),
 * commentaires, votes et abonnements. Mot de passe exigé pour un compte email.
 * Les cookies de session sont effacés ; la page redirige ensuite vers l'accueil.
 */
export async function deleteAccount(input: { password?: unknown }): Promise<AuthResult> {
  const { password } = input;
  if (password !== undefined && !str(password, 128)) return INVALID;
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api('/me', { method: 'DELETE', token, body: password ? { password } : {} });
  if (!res.ok) return { ok: false, code: res.code, message: res.message };
  await clearSession();
  return { ok: true };
}
