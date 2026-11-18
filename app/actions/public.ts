'use server';

import { api } from '@/lib/api';
import { fromApiPost, type ApiFeedPost, type FeedPost } from '@/lib/feed';
import { accessToken, noTokenError } from '@/lib/session';

import type { Badge, PostTile, Streak } from './me';

/**
 * Pages publiques (une prise, un profil, les défis) et actions de la communauté
 * (signaler, bloquer, coach IA). Les lectures marchent sans compte ; le jeton est joint s'il existe.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);

async function read<T>(path: string): Promise<Result<T>> {
  const token = (await accessToken()) ?? undefined;
  const res = await api<T>(path, { token });
  return res.ok ? { ok: true, data: res.data } : { ok: false, code: res.code, message: res.message };
}

async function write<T>(path: string, method: string, body?: unknown): Promise<Result<T>> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<T>(path, { method, body, token });
  if (res.ok) return { ok: true, data: res.data };
  return { ok: false, code: res.status === 401 ? 'AUTH' : res.code, message: res.message };
}

/* ---------- Une prise ---------- */

/** null si la prise a été retirée par la modération. */
export async function loadPost(postId: unknown): Promise<Result<FeedPost | null>> {
  if (!isId(postId)) return BAD;
  const res = await read<ApiFeedPost>(`/posts/${postId}`);
  if (!res.ok) return res;
  return { ok: true, data: res.data.status === 'published' ? fromApiPost(res.data) : null };
}

/* ---------- Profil public ---------- */

export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string;
  avatarEffect?: string | null;
  displayName: string;
  bio: string;
  followers: number;
  following: number;
  postsCount: number;
  streak: Streak;
  badges: Badge[];
  isPremium: boolean;
  isFollowing: boolean;
  isBlocked: boolean;
  isMe: boolean;
}

export async function loadUser(userId: unknown): Promise<Result<PublicProfile>> {
  if (!isId(userId)) return BAD;
  return read<PublicProfile>(`/users/${userId}`);
}

export async function loadUserPosts(userId: unknown): Promise<Result<PostTile[]>> {
  if (!isId(userId)) return BAD;
  const res = await read<{ items: PostTile[] }>(`/users/${userId}/posts?limit=48`);
  return res.ok ? { ok: true, data: res.data.items } : res;
}

export async function setFollowUser(userId: unknown, on: unknown): Promise<Result<unknown>> {
  if (!isId(userId)) return BAD;
  return write(`/users/${userId}/follow`, on === true ? 'PUT' : 'DELETE');
}

export async function setBlock(userId: unknown, on: unknown): Promise<Result<unknown>> {
  if (!isId(userId)) return BAD;
  return write(`/users/${userId}/block`, on === true ? 'PUT' : 'DELETE');
}

export interface BlockedUser {
  id: string;
  username: string;
  avatarUrl: string | null;
  avatarEffect?: string | null;
}

/** Comptes que le membre a bloqués (pour pouvoir les débloquer). */
export async function loadBlocked(): Promise<Result<BlockedUser[]>> {
  return write('/me/blocked', 'GET');
}

/* ---------- Signalement ---------- */

export type ReportTarget = 'post' | 'user' | 'comment';
export type ReportReason =
  | 'spam'
  | 'harassment'
  | 'hate'
  | 'violence'
  | 'sexual'
  | 'self_harm'
  | 'misinformation'
  | 'other';

const REASONS = new Set(['spam', 'harassment', 'hate', 'violence', 'sexual', 'self_harm', 'misinformation', 'other']);

export async function report(input: {
  targetType: unknown;
  targetId: unknown;
  reason: unknown;
  details?: unknown;
}): Promise<Result<unknown>> {
  const { targetType, targetId, reason, details } = input;
  if (targetType !== 'post' && targetType !== 'user' && targetType !== 'comment') return BAD;
  if (!isId(targetId) || typeof reason !== 'string' || !REASONS.has(reason)) return BAD;
  if (details !== undefined && (typeof details !== 'string' || details.length > 500)) return BAD;
  return write('/reports', 'POST', {
    targetType,
    targetId,
    reason,
    ...(typeof details === 'string' && details.trim() ? { details: details.trim() } : {}),
  });
}

/* ---------- Défis ---------- */

export interface Theme {
  id: string;
  period: 'weekly' | 'monthly';
  subject: string;
  endsAt: string;
  participantsCount: number;
  phase: 'open' | 'closed';
}

export interface Podium {
  theme: Theme;
  winners: { rank: number; votes: number; post: PostTile & { author: { id: string; username: string; avatarUrl: string; avatarEffect?: string | null } } }[];
}

export async function loadCurrentThemes(): Promise<Result<{ weekly: Theme | null; monthly: Theme | null }>> {
  return read('/themes/current');
}

export async function loadRecentThemes(): Promise<Result<Podium[]>> {
  return read('/themes/recent?limit=8');
}

/** Prises d'un défi, classées par votes « Convaincu ». */
export async function loadThemePosts(themeId: unknown): Promise<Result<FeedPost[]>> {
  if (!isId(themeId)) return BAD;
  const res = await read<{ items: ApiFeedPost[] }>(`/themes/${themeId}/posts?limit=30`);
  return res.ok ? { ok: true, data: res.data.items.map(fromApiPost) } : res;
}

/* ---------- Coach IA ---------- */

export interface Analysis {
  id: string;
  postId: string;
  status: 'pending' | 'done' | 'failed';
  detailed: boolean;
  createdAt: string;
  error?: string;
  metrics?: {
    wordsPerMinute: number;
    pace: string;
    wordCount: number;
    fillerCount: number;
    fillers: { word: string; count: number }[] | null;
    silenceCount: number;
    silenceTotal: number;
    longestSilence: number;
    speakingRatio: number;
  };
  structure?: string;
  /** Premium : retour détaillé. */
  details?: { argumentation?: string; rhythm?: string; tips?: string[]; comparison?: string };
  /** Premium : évolution par rapport aux analyses précédentes. */
  comparison?: {
    previousCount: number;
    wordsPerMinute?: { current: number; average: number; delta: number };
    fillersPerMinute?: { current: number; average: number; delta: number };
    speakingRatio?: { current: number; average: number; delta: number };
  };
}

export async function loadAnalysis(postId: unknown): Promise<Result<Analysis>> {
  if (!isId(postId)) return BAD;
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<Analysis>(`/posts/${postId}/analysis`, { token });
  if (res.ok) return { ok: true, data: res.data };
  return { ok: false, code: res.status === 401 ? 'AUTH' : res.status === 404 ? 'NONE' : res.code, message: res.message };
}

/** Demande une analyse pour une de ses prises (quota gratuit : 1 par mois). */
export async function requestAnalysis(postId: unknown): Promise<Result<Analysis>> {
  if (!isId(postId)) return BAD;
  return write(`/posts/${postId}/analysis`, 'POST');
}
