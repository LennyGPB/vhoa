'use server';

import { api } from '@/lib/api';
import {
  fromApiComment,
  fromApiPost,
  type ApiComment,
  type ApiFeedPost,
  type FeedComment,
  type FeedPost,
} from '@/lib/feed';
import { accessToken, noTokenError } from '@/lib/session';

/**
 * Feed et interactions du membre connecté. Chaque action relit (et renouvelle si besoin)
 * le jeton d'accès : sans session valide, elle répond AUTH et la page propose de se connecter.
 */

export type ActionResult<T = undefined> =
  | { ok: true; data: T }
  | { ok: false; code: string; message: string };

const AUTH = { ok: false, code: 'AUTH', message: 'Connecte-toi pour continuer.' } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function call<T>(path: string, method = 'GET', body?: unknown): Promise<ActionResult<T>> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<T>(path, { method, body, token });
  if (res.ok) return { ok: true, data: res.data };
  if (res.status === 401) return AUTH;
  return { ok: false, code: res.code, message: res.message };
}

const bad = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;

/** Lecture ouverte aux visiteurs : le jeton est joint s'il existe (état « aimé »… du membre). */
async function read<T>(path: string): Promise<ActionResult<T>> {
  const token = (await accessToken()) ?? undefined;
  const res = await api<T>(path, { token });
  if (res.ok) return { ok: true, data: res.data };
  return { ok: false, code: res.status === 401 ? 'AUTH' : res.code, message: res.message };
}

const CURSOR = /^[A-Za-z0-9_-]{1,400}$/;

/** Une page du feed ; `cursor` = page suivante (null à la fin). */
export async function loadFeed(
  tab: unknown,
  cursor?: unknown,
): Promise<ActionResult<{ items: FeedPost[]; nextCursor: string | null }>> {
  if (cursor !== undefined && (typeof cursor !== 'string' || !CURSOR.test(cursor))) return bad;
  const after = cursor ? `&cursor=${cursor}` : '';
  // « Pour toi » est public ; « Abonnements » demande un compte.
  const res =
    tab === 'following'
      ? await call<{ items: ApiFeedPost[]; nextCursor: string | null }>(`/feed?tab=following&limit=20${after}`)
      : await read<{ items: ApiFeedPost[]; nextCursor: string | null }>(`/feed?limit=20${after}`);
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      items: res.data.items.filter((p) => p.status === 'published').map(fromApiPost),
      nextCursor: res.data.nextCursor ?? null,
    },
  };
}

type Toggle = 'like' | 'save' | 'convinced';

export async function setPostState(postId: unknown, kind: unknown, on: unknown): Promise<ActionResult> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return bad;
  if (kind !== 'like' && kind !== 'save' && kind !== 'convinced') return bad;
  const res = await call(`/posts/${postId}/${kind satisfies Toggle}`, on === true ? 'PUT' : 'DELETE');
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function setFollow(userId: unknown, on: unknown): Promise<ActionResult> {
  if (typeof userId !== 'string' || !UUID.test(userId)) return bad;
  const res = await call(`/users/${userId}/follow`, on === true ? 'PUT' : 'DELETE');
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function countShare(postId: unknown): Promise<ActionResult> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return bad;
  const res = await call(`/posts/${postId}/share`, 'POST');
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function setCommentLike(commentId: unknown, on: unknown): Promise<ActionResult> {
  if (typeof commentId !== 'string' || !UUID.test(commentId)) return bad;
  const res = await call(`/comments/${commentId}/like`, on === true ? 'PUT' : 'DELETE');
  return res.ok ? { ok: true, data: undefined } : res;
}

export async function loadComments(postId: unknown): Promise<ActionResult<FeedComment[]>> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return bad;
  const res = await read<{ items: ApiComment[] }>(`/posts/${postId}/comments?limit=30`);
  return res.ok ? { ok: true, data: res.data.items.map(fromApiComment) } : res;
}

export async function addComment(postId: unknown, text: unknown): Promise<ActionResult<FeedComment>> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return bad;
  if (typeof text !== 'string' || !text.trim() || text.length > 500) return bad;
  const res = await call<ApiComment>(`/posts/${postId}/comments`, 'POST', { text: text.trim() });
  return res.ok ? { ok: true, data: fromApiComment(res.data) } : res;
}

/**
 * Vues (prise restée au moins 2 s à l'écran), envoyées par lots. Membres seulement : l'API
 * compte une vue par membre et par prise. Sans session, rien n'est envoyé (pas d'erreur).
 */
export async function recordViews(postIds: unknown): Promise<void> {
  if (!Array.isArray(postIds)) return;
  const ids = [...new Set(postIds.filter((id): id is string => typeof id === 'string' && UUID.test(id)))].slice(0, 50);
  if (!ids.length) return;
  const token = await accessToken();
  if (!token) return;
  await api('/views', { method: 'POST', body: { postIds: ids }, token });
}
