'use server';

import { api } from '@/lib/api';
import { accessToken, noTokenError } from '@/lib/session';

/**
 * Création d'une prise, en 3 temps (même parcours que l'app) :
 * 1. prepareUpload : l'API crée le post et renvoie une URL signée vers R2 ;
 * 2. le navigateur envoie le fichier directement sur R2 (le serveur du site ne le voit pas passer) ;
 * 3. submitPost : titre, catégorie, mode… puis l'API convertit, transcrit et modère.
 * postStatus suit ensuite le traitement.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const AUTH = { ok: false, code: 'AUTH', message: 'Ta session a expiré, reconnecte-toi.' } as const;
const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<T>(path, { method, body, token });
  if (res.ok) return { ok: true, data: res.data };
  if (res.status === 401) return AUTH;
  return { ok: false, code: res.code, message: res.message };
}

export interface CurrentTheme {
  id: string;
  subject: string;
  endsAt: string;
}

/** Thème de la semaine en cours (null s'il n'y en a pas, ou s'il est clos). */
export async function currentTheme(): Promise<CurrentTheme | null> {
  const res = await call<{ weekly: (CurrentTheme & { phase: string }) | null }>('/themes/current');
  const t = res.ok ? res.data.weekly : null;
  return t && t.phase === 'open' ? { id: t.id, subject: t.subject, endsAt: t.endsAt } : null;
}

export async function prepareUpload(input: {
  type: unknown;
  mimeType: unknown;
  sizeBytes: unknown;
  duration: unknown;
}): Promise<Result<{ postId: string; uploadUrl: string; headers: Record<string, string> }>> {
  const { type, mimeType, sizeBytes, duration } = input;
  if (type !== 'video' && type !== 'audio') return BAD;
  if (typeof mimeType !== 'string' || mimeType.length > 60) return BAD;
  if (typeof sizeBytes !== 'number' || !Number.isInteger(sizeBytes) || sizeBytes < 1) return BAD;
  if (typeof duration !== 'number' || !(duration >= 0 && duration <= 65)) return BAD;
  return call('/posts', 'POST', { type, mimeType, sizeBytes, duration });
}

export type PublishMode = 'public' | 'draft' | 'ai';

export async function submitPost(input: {
  postId: unknown;
  mode: unknown;
  title: unknown;
  category: unknown;
  hashtags: unknown;
  joinTheme: unknown;
}): Promise<Result<{ status: string }>> {
  const { postId, mode, title, category, hashtags, joinTheme } = input;
  if (typeof postId !== 'string' || !UUID.test(postId)) return BAD;
  if (mode !== 'public' && mode !== 'draft' && mode !== 'ai') return BAD;
  if (typeof title !== 'string' || title.length > 100) return BAD;
  if (category !== null && typeof category !== 'string') return BAD;
  if (!Array.isArray(hashtags) || hashtags.length > 5 || hashtags.some((h) => typeof h !== 'string')) return BAD;
  return call(`/posts/${postId}/submit`, 'POST', {
    mode,
    ...(title.trim() ? { title: title.trim() } : {}),
    ...(category ? { category } : {}),
    hashtags,
    joinTheme: mode === 'public' && joinTheme === true,
  });
}

/** processing → published | draft | private | rejected | failed (+ message éventuel). */
export async function postStatus(postId: unknown): Promise<Result<{ status: string; message?: string }>> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return BAD;
  return call(`/posts/${postId}/status`);
}
