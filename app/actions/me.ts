'use server';

import { api } from '@/lib/api';
import { accessToken, noTokenError, saveUser } from '@/lib/session';

/**
 * Profil et alertes du membre connecté. Même principe que les autres actions :
 * jeton relu (et renouvelé) à chaque appel, AUTH si la session a expiré.
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

/* ---------- Profil ---------- */

export interface Badge {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

export interface Streak {
  current: number;
  best: number;
  freezes: number;
  postedThisWeek: boolean;
  weekEndsAt: string;
  /** 8 dernières semaines, la plus ancienne d'abord. */
  history: ('posted' | 'frozen' | 'missed')[];
}

export interface Profile {
  id: string;
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
  isPremium: boolean;
  /** Moyens de connexion : password, google, apple. */
  providers: string[];
  /** « admin » ou « user ». */
  role: string;
  avatarEffect: string | null;
  /** Premium ou admin : peut choisir un effet de profil. */
  canUseEffects: boolean;
  followers: number;
  following: number;
  postsCount: number;
  aiQuota: { used: number; total: number | null; isPremium: boolean };
  unreadNotifications: number;
  streak: Streak;
  badges: Badge[];
}

export async function loadProfile(): Promise<Result<Profile>> {
  const me = await call<Omit<Profile, 'streak' | 'badges'>>('/me');
  if (!me.ok) return me;
  // Série et badges : sur le profil public (le sien, donc avec les gels de série).
  const pub = await call<{ streak: Streak; badges: Badge[] }>(`/users/${me.data.id}`);
  if (!pub.ok) return pub;
  return { ok: true, data: { ...me.data, streak: pub.data.streak, badges: pub.data.badges } };
}

export interface PostTile {
  id: string;
  type: 'video' | 'audio';
  thumbnailUrl: string;
  duration: number;
  title: string;
  category: string | null;
  likes: number;
  comments: number;
  /** published | draft | private | processing | failed | rejected | removed */
  status?: string;
}

export type ProfileTab = 'posts' | 'drafts' | 'saved';

export async function loadTiles(tab: unknown, userId: unknown): Promise<Result<PostTile[]>> {
  if (typeof userId !== 'string' || !UUID.test(userId)) return BAD;
  const path =
    tab === 'drafts' ? '/me/drafts?limit=48' : tab === 'saved' ? '/me/saved?limit=48' : `/users/${userId}/posts?limit=48`;
  const res = await call<{ items: PostTile[] }>(path);
  return res.ok ? { ok: true, data: res.data.items } : res;
}

export async function publishDraft(postId: unknown): Promise<Result<unknown>> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return BAD;
  return call(`/posts/${postId}/publish`, 'POST', { joinTheme: false });
}

export async function deletePost(postId: unknown): Promise<Result<unknown>> {
  if (typeof postId !== 'string' || !UUID.test(postId)) return BAD;
  return call(`/posts/${postId}`, 'DELETE');
}

/* ---------- Alertes ---------- */

export type NotificationType =
  | 'like'
  | 'comment'
  | 'follow'
  | 'convinced'
  | 'themeNew'
  | 'themeResult'
  | 'badge'
  | 'streakRisk'
  | 'analysisReady'
  | 'moderation';

export interface AppNotification {
  id: string;
  type: NotificationType;
  actors: { id: string; username: string; avatarUrl: string; avatarEffect?: string | null }[];
  /** Nombre total d'acteurs quand il dépasse ceux affichés. */
  actorCount?: number;
  post?: { id: string; title: string; thumbnailUrl: string };
  text?: string;
  rank?: number;
  createdAt: string;
  read: boolean;
}

export type NotificationGroup = 'all' | 'interactions' | 'themes' | 'progress';

export async function loadNotifications(group: unknown): Promise<Result<AppNotification[]>> {
  const g = group === 'interactions' || group === 'themes' || group === 'progress' ? `&group=${group}` : '';
  const res = await call<{ items: AppNotification[] }>(`/notifications?limit=50${g}`);
  return res.ok ? { ok: true, data: res.data.items } : res;
}

export async function markAllRead(): Promise<Result<unknown>> {
  return call('/notifications/read-all', 'POST');
}

export async function markRead(id: unknown): Promise<Result<unknown>> {
  if (typeof id !== 'string' || !UUID.test(id)) return BAD;
  return call(`/notifications/${id}/read`, 'POST');
}

export async function unreadCount(): Promise<number> {
  const res = await call<{ count: number }>('/notifications/unread-count');
  return res.ok ? res.data.count : 0;
}

/* ---------- Effet de profil (Premium / admin) ---------- */

const EFFECT_IDS = new Set(['liquid', 'wave', 'aura', 'orbit', 'sparkle', 'echo', 'bubbles', 'comet', 'tide', 'neon']);

/**
 * Applique (ou retire, avec null) l'effet autour de la photo. L'API vérifie le droit (Premium ou admin).
 * Le cookie d'affichage est mis à jour : l'avatar de l'en-tête change tout de suite.
 */
export async function setAvatarEffect(effect: unknown): Promise<Result<{ avatarEffect: string | null }>> {
  if (effect !== null && (typeof effect !== 'string' || !EFFECT_IDS.has(effect))) return BAD;
  const res = await call<{ avatarEffect: string | null }>('/me/effect', 'PATCH', { effect });
  if (!res.ok) return res;
  const me = await call<{ id: string; username: string; displayName: string; avatarUrl: string; avatarEffect: string | null }>('/me');
  if (me.ok) {
    await saveUser({
      id: me.data.id,
      username: me.data.username,
      displayName: me.data.displayName,
      avatarUrl: me.data.avatarUrl || null,
      avatarEffect: me.data.avatarEffect,
    });
  }
  return res;
}
