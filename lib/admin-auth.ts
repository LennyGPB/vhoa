import 'server-only';

import { api } from './api';
import { accessToken } from './session';

/**
 * Accès au back-office : réservé aux comptes dont le rôle est « admin » dans l'API.
 * Pas de mot de passe séparé : la session du compte suffit. C'est l'API qui fait foi
 * (chaque route /admin y est protégée par le rôle) ; ce contrôle sert aux parties du
 * back-office qui lisent directement la base (liste d'attente).
 *
 * Utilisable seulement dans une Server Action ou un Route Handler (renouvellement de session).
 */
export async function adminToken(): Promise<string | null> {
  const token = await accessToken();
  if (!token) return null;
  const me = await api<{ role: string }>('/me', { token });
  return me.ok && me.data.role === 'admin' ? token : null;
}

export async function isAdmin(): Promise<boolean> {
  return (await adminToken()) !== null;
}
