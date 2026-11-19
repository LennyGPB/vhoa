'use server';

import { adminToken } from '@/lib/admin-auth';
import { getStats as waitlistStats, deleteEntry, listEntries, type PlatformFilter, type WaitlistRow, type WaitlistStats } from '@/lib/admin-data';
import { api } from '@/lib/api';

/**
 * Back-office. Chaque action vérifie d'abord que la session est celle d'un admin
 * (rôle lu dans l'API), puis appelle les routes /admin de l'API, elles-mêmes protégées par le rôle.
 */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const DENIED = { ok: false, code: 'FORBIDDEN', message: 'Accès réservé aux admins.' } as const;
const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const isId = (v: unknown): v is string => typeof v === 'string' && UUID.test(v);
const text = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');

async function admin<T>(path: string, method = 'GET', body?: unknown): Promise<Result<T>> {
  const token = await adminToken();
  if (!token) return DENIED;
  const res = await api<T>(`/admin${path}`, { method, body, token });
  return res.ok ? { ok: true, data: res.data } : { ok: false, code: res.code, message: res.message };
}

/** Le visiteur est-il admin ? (pour afficher le back-office ou l'écran « accès réservé »). */
export async function checkAdmin(): Promise<boolean> {
  return (await adminToken()) !== null;
}

/* ---------- Vue d'ensemble ---------- */

export interface AdminStats {
  users: { total: number; last7: number; last24h: number; banned: number; premium: number; active7: number };
  posts: { published: number; last7: number; last24h: number; processing: number };
  moderation: { reportsOpen: number; appealsOpen: number };
  engagement: { comments7: number; analysesMonth: number };
  waitlist: number;
  theme: { subject: string; participants: number; endsAt: string } | null;
  series: { signups: { d: string; n: number }[]; posts: { d: string; n: number }[] };
}

export async function loadStats(): Promise<Result<AdminStats>> {
  return admin('/stats');
}

/* ---------- Signalements ---------- */

export interface AdminAuthor {
  id: string;
  username: string;
  avatarUrl: string;
}

export interface AdminPostCard {
  id: string;
  type: 'video' | 'audio';
  thumbnailUrl: string;
  mediaUrl?: string;
  duration: number;
  title: string;
  category: string | null;
  author: AdminAuthor;
  likes: number;
  comments: number;
  status: string;
}

export interface AdminReport {
  id: string;
  targetType: 'post' | 'comment' | 'user';
  targetId: string;
  reason: string;
  details: string | null;
  status: 'OPEN' | 'RESOLVED' | 'DISMISSED';
  createdAt: string;
  reporter: { id: string; username: string };
  openCount: number;
  target:
    | AdminPostCard
    | { id: string; text: string; postId: string; author: AdminAuthor }
    | { id: string; username: string; displayName: string; avatarUrl: string; status: string; bio: string }
    | null;
}

export async function loadReports(status: unknown): Promise<Result<AdminReport[]>> {
  const s = status === 'RESOLVED' || status === 'DISMISSED' ? status : 'OPEN';
  return admin(`/reports?status=${s}`);
}

export async function resolveReport(id: unknown, status: unknown): Promise<Result<unknown>> {
  if (!isId(id) || (status !== 'RESOLVED' && status !== 'DISMISSED')) return BAD;
  return admin(`/reports/${id}`, 'PATCH', { status });
}

/* ---------- Prises ---------- */

export interface AdminPost extends AdminPostCard {
  mode: string;
  convinced: number;
  theme: string | null;
  reason: string | null;
  createdAt: string;
}

export async function loadPosts(status: unknown, q: unknown): Promise<Result<AdminPost[]>> {
  const params = new URLSearchParams();
  if (typeof status === 'string' && /^[a-z]{1,12}$/.test(status) && status !== 'all') params.set('status', status);
  const query = text(q, 60);
  if (query) params.set('q', query);
  return admin(`/posts?${params}`);
}

export async function removePost(id: unknown, reason: unknown): Promise<Result<unknown>> {
  if (!isId(id)) return BAD;
  const r = text(reason, 200);
  return admin(`/posts/${id}/remove`, 'POST', r ? { reason: r } : {});
}

export async function restorePost(id: unknown): Promise<Result<unknown>> {
  if (!isId(id)) return BAD;
  return admin(`/posts/${id}/restore`, 'POST');
}

export async function removeComment(id: unknown): Promise<Result<unknown>> {
  if (!isId(id)) return BAD;
  return admin(`/comments/${id}`, 'DELETE');
}

/* ---------- Membres ---------- */

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
  email: string | null;
  providers: string[];
  role: 'ADMIN' | 'USER';
  status: 'ACTIVE' | 'BANNED';
  isPremium: boolean;
  postsCount: number;
  followers: number;
  createdAt: string;
}

export async function loadUsers(q: unknown): Promise<Result<AdminUser[]>> {
  const query = text(q, 60);
  return admin(`/users${query ? `?q=${encodeURIComponent(query)}` : ''}`);
}

export async function setBan(id: unknown, on: unknown): Promise<Result<unknown>> {
  if (!isId(id)) return BAD;
  return admin(`/users/${id}/${on === true ? 'ban' : 'unban'}`, 'POST');
}

export async function setRole(id: unknown, role: unknown): Promise<Result<unknown>> {
  if (!isId(id) || (role !== 'ADMIN' && role !== 'USER')) return BAD;
  return admin(`/users/${id}/role`, 'PATCH', { role });
}

/* ---------- Défis ---------- */

export interface AdminTheme {
  id: string;
  period: 'WEEKLY' | 'MONTHLY';
  subject: string;
  status: 'SCHEDULED' | 'ACTIVE' | 'CLOSED';
  startsAt: string;
  endsAt: string;
  aiGenerated: boolean;
  participantsCount: number;
}

export async function loadThemes(): Promise<Result<AdminTheme[]>> {
  return admin('/themes');
}

export async function updateTheme(id: unknown, subject: unknown): Promise<Result<unknown>> {
  const s = text(subject, 140);
  if (!isId(id) || s.length < 10) return { ok: false, code: 'INVALID', message: 'Sujet : 10 à 140 caractères.' };
  return admin(`/themes/${id}`, 'PATCH', { subject: s });
}

export async function regenerateTheme(id: unknown): Promise<Result<unknown>> {
  if (!isId(id)) return BAD;
  return admin(`/themes/${id}/regenerate`, 'POST');
}

/* ---------- File d'attente des défis de la semaine ---------- */

export interface QueuedTheme {
  id: string;
  subject: string;
  position: number;
}

const SUBJECT_ERROR = { ok: false, code: 'INVALID', message: 'Sujet : 10 à 140 caractères.' } as const;

export async function loadThemeQueue(): Promise<Result<QueuedTheme[]>> {
  return admin('/theme-queue');
}

export async function addToThemeQueue(subject: unknown): Promise<Result<QueuedTheme[]>> {
  const s = text(subject, 140);
  if (s.length < 10) return SUBJECT_ERROR;
  return admin('/theme-queue', 'POST', { subject: s });
}

export async function updateQueuedTheme(id: unknown, subject: unknown): Promise<Result<QueuedTheme[]>> {
  const s = text(subject, 140);
  if (!isId(id) || s.length < 10) return SUBJECT_ERROR;
  return admin(`/theme-queue/${id}`, 'PATCH', { subject: s });
}

export async function removeQueuedTheme(id: unknown): Promise<Result<QueuedTheme[]>> {
  if (!isId(id)) return BAD;
  return admin(`/theme-queue/${id}`, 'DELETE');
}

/** Nouvel ordre de la file : tous les identifiants, du prochain au dernier. */
export async function reorderThemeQueue(ids: unknown): Promise<Result<QueuedTheme[]>> {
  if (!Array.isArray(ids) || ids.length > 200 || !ids.every(isId)) return BAD;
  return admin('/theme-queue/order', 'PUT', { ids });
}

export async function createTheme(period: unknown, date: unknown, subject: unknown): Promise<Result<unknown>> {
  const s = text(subject, 140);
  if (period !== 'weekly' && period !== 'monthly') return BAD;
  if (typeof date !== 'string' || Number.isNaN(Date.parse(date))) return BAD;
  if (s.length < 10) return { ok: false, code: 'INVALID', message: 'Sujet : 10 à 140 caractères.' };
  return admin('/themes', 'POST', { period, date: new Date(date).toISOString(), subject: s });
}

/* ---------- Contestations ---------- */

export interface AdminAppeal {
  id: string;
  message: string;
  createdAt: string;
  user: AdminAuthor;
  post: (AdminPostCard & { reason: string | null }) | null;
}

export async function loadAppeals(): Promise<Result<AdminAppeal[]>> {
  return admin('/appeals/full');
}

/** Accepter : la prise est republiée et la contestation close. Refuser : close seulement. */
export async function decideAppeal(id: unknown, postId: unknown, accept: unknown): Promise<Result<unknown>> {
  if (!isId(id)) return BAD;
  if (accept === true && isId(postId)) {
    const restored = await admin(`/posts/${postId}/restore`, 'POST');
    if (!restored.ok) return restored;
  }
  return admin(`/appeals/${id}`, 'PATCH', { status: accept === true ? 'RESOLVED' : 'DISMISSED' });
}

/* ---------- Liste d'attente (lue directement en base) ---------- */

export async function loadWaitlist(input: {
  q: unknown;
  platform: unknown;
  page: unknown;
}): Promise<Result<{ stats: WaitlistStats; rows: WaitlistRow[]; total: number }>> {
  if (!(await adminToken())) return DENIED;
  const platform: PlatformFilter = input.platform === 'ios' || input.platform === 'android' ? input.platform : 'all';
  const page = typeof input.page === 'number' && input.page >= 1 ? Math.floor(input.page) : 1;
  const [stats, list] = await Promise.all([waitlistStats(), listEntries({ q: text(input.q, 100), platform, page })]);
  return {
    ok: true,
    data: {
      stats,
      // Dates sérialisées en texte (les Server Actions ne transmettent pas les objets Date tels quels partout).
      rows: list.rows.map((r) => ({ ...r, createdAt: new Date(r.createdAt).toISOString(), updatedAt: new Date(r.updatedAt).toISOString() })),
      total: list.total,
    },
  };
}

export async function deleteWaitlistEntry(id: unknown): Promise<Result<unknown>> {
  if (!(await adminToken())) return DENIED;
  if (typeof id !== 'string') return BAD;
  await deleteEntry(id);
  return { ok: true, data: null };
}
