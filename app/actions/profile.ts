'use server';

import { api } from '@/lib/api';
import {
  AVATAR_KEY_RE,
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  PASSWORD_HINT,
  PASSWORD_RE,
  USERNAME_HINT,
  USERNAME_RE,
} from '@/lib/profile-rules';
import { accessToken, noTokenError, saveTokens, saveUser, type Tokens } from '@/lib/session';

/**
 * Modification du profil du membre connecté (page /profil/modifier).
 * Mêmes règles que l'API (vhoa-api/src/users/users.dto.ts, auth.dto.ts) : on refuse ici ce qu'elle
 * refuserait, pour ne pas lui envoyer de requêtes inutiles. Après chaque changement visible
 * (nom, pseudo, avatar), le cookie d'affichage est réécrit : l'en-tête montre tout de suite le nouveau.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const AUTH = { ok: false, code: 'AUTH', message: 'Ta session a expiré, reconnecte-toi.' } as const;
const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;

export interface AlertSettings {
  interactions: boolean;
  themes: boolean;
  progress: boolean;
}

export interface EditableProfile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  /** Chaîne vide si pas de photo. */
  avatarUrl: string;
  /** Moyens de connexion : password, google, apple. */
  providers: string[];
  notifications: AlertSettings;
}

type Me = EditableProfile & Record<string, unknown>;

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<T>(path, { method, body, token });
  if (res.ok) return { ok: true, data: res.data };
  if (res.status === 401) return AUTH;
  return { ok: false, code: res.code, message: res.message };
}

/** Ne garde que ce dont la page a besoin (GET /me renvoie aussi l'email, le quota IA…). */
function pick(me: Me): EditableProfile {
  return {
    id: me.id,
    username: me.username,
    displayName: me.displayName,
    bio: me.bio ?? '',
    avatarUrl: me.avatarUrl ?? '',
    providers: me.providers ?? [],
    notifications: me.notifications,
  };
}

/** Réécrit le cookie d'affichage (avatar et pseudo de l'en-tête). */
async function refreshShownUser(p: EditableProfile) {
  await saveUser({ id: p.id, username: p.username, displayName: p.displayName, avatarUrl: p.avatarUrl || null });
}

export async function loadEditableProfile(): Promise<Result<EditableProfile>> {
  const res = await call<Me>('/me');
  return res.ok ? { ok: true, data: pick(res.data) } : res;
}

/* ---------- Nom, pseudo, bio ---------- */

/** Seuls les champs fournis sont modifiés (l'API modère chaque texte envoyé). */
export async function updateProfile(input: {
  displayName?: unknown;
  username?: unknown;
  bio?: unknown;
}): Promise<Result<EditableProfile>> {
  const body: { displayName?: string; username?: string; bio?: string } = {};
  if (input.displayName !== undefined) {
    if (typeof input.displayName !== 'string') return BAD;
    const v = input.displayName.trim();
    if (v.length < 1 || v.length > DISPLAY_NAME_MAX) {
      return { ok: false, code: 'INVALID', message: `Nom affiché : 1 à ${DISPLAY_NAME_MAX} caractères.` };
    }
    body.displayName = v;
  }
  if (input.username !== undefined) {
    if (typeof input.username !== 'string') return BAD;
    const v = input.username.trim().toLowerCase();
    if (!USERNAME_RE.test(v)) {
      return { ok: false, code: 'INVALID', message: USERNAME_HINT };
    }
    body.username = v;
  }
  if (input.bio !== undefined) {
    if (typeof input.bio !== 'string') return BAD;
    const v = input.bio.trim();
    if (v.length > BIO_MAX) return { ok: false, code: 'INVALID', message: `Bio : ${BIO_MAX} caractères maximum.` };
    body.bio = v;
  }
  if (!Object.keys(body).length) return BAD;

  const res = await call<Me>('/me', 'PATCH', body);
  if (!res.ok) return res;
  const profile = pick(res.data);
  await refreshShownUser(profile);
  return { ok: true, data: profile };
}

/* ---------- Alertes ---------- */

export async function updateSettings(input: Partial<Record<keyof AlertSettings, unknown>>): Promise<Result<AlertSettings>> {
  const body: Partial<AlertSettings> = {};
  for (const key of ['interactions', 'themes', 'progress'] as const) {
    const v = input[key];
    if (v === undefined) continue;
    if (typeof v !== 'boolean') return BAD;
    body[key] = v;
  }
  if (!Object.keys(body).length) return BAD;
  const res = await call<Me>('/me/settings', 'PATCH', body);
  return res.ok ? { ok: true, data: res.data.notifications } : res;
}

/* ---------- Photo de profil ---------- */

/**
 * 1. L'API donne une adresse d'envoi signée vers R2 ;
 * 2. le navigateur y envoie l'image directement ;
 * 3. confirmAvatar : l'API vérifie l'image (taille, type, modération) et l'adopte.
 */
export async function prepareAvatar(input: {
  mimeType: unknown;
  sizeBytes: unknown;
}): Promise<Result<{ key: string; uploadUrl: string; headers: Record<string, string> }>> {
  const { mimeType, sizeBytes } = input;
  if (typeof mimeType !== 'string' || !AVATAR_TYPES.includes(mimeType)) {
    return { ok: false, code: 'INVALID', message: 'Format accepté : JPEG, PNG ou WebP.' };
  }
  if (typeof sizeBytes !== 'number' || !Number.isInteger(sizeBytes) || sizeBytes < 1) return BAD;
  if (sizeBytes > AVATAR_MAX_BYTES) return { ok: false, code: 'TOO_LARGE', message: 'Image trop lourde (2 Mo maximum).' };
  const res = await call<{ key: string; uploadUrl: string; headers: Record<string, string> }>(
    '/me/avatar/upload-url',
    'POST',
    { mimeType, sizeBytes },
  );
  return res.ok ? { ok: true, data: { key: res.data.key, uploadUrl: res.data.uploadUrl, headers: res.data.headers } } : res;
}

export async function confirmAvatar(key: unknown): Promise<Result<EditableProfile>> {
  if (typeof key !== 'string' || key.length > 200 || !AVATAR_KEY_RE.test(key)) return BAD;
  const res = await call<Me>('/me/avatar', 'POST', { key });
  if (!res.ok) return res;
  const profile = pick(res.data);
  await refreshShownUser(profile);
  return { ok: true, data: profile };
}

/* ---------- Mot de passe ---------- */

/**
 * Comptes email seulement. L'API ferme toutes les autres sessions et renvoie de nouveaux jetons
 * pour celle-ci : on les enregistre, sinon le membre serait déconnecté au prochain renouvellement.
 */
export async function changePassword(input: {
  currentPassword: unknown;
  newPassword: unknown;
}): Promise<Result<null>> {
  const { currentPassword, newPassword } = input;
  if (typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 128) return BAD;
  if (typeof newPassword !== 'string' || !PASSWORD_RE.test(newPassword)) {
    return { ok: false, code: 'INVALID', message: PASSWORD_HINT };
  }
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<Tokens>('/auth/password', { method: 'POST', body: { currentPassword, newPassword }, token });
  if (!res.ok) {
    // 401 « mot de passe actuel incorrect » ≠ session expirée : on affiche le message de l'API.
    if (res.status === 401 && res.code !== 'INVALID_CREDENTIALS') return AUTH;
    return { ok: false, code: res.code, message: res.message };
  }
  await saveTokens(res.data);
  return { ok: true, data: null };
}
