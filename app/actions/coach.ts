'use server';

import { api } from '@/lib/api';
import { accessToken, noTokenError } from '@/lib/session';

import type { Analysis } from './public';

/** « Ma progression » : statistiques et historique du coach IA (Premium, vérifié par l'API). */

export type Result<T> = { ok: true; data: T } | { ok: false; code: string; message: string };

const BAD = { ok: false, code: 'INVALID', message: 'Requête invalide.' } as const;

async function read<T>(path: string): Promise<Result<T>> {
  const token = await accessToken();
  if (!token) return noTokenError();
  const res = await api<T>(path, { token });
  if (res.ok) return { ok: true, data: res.data };
  const code = res.status === 401 ? 'AUTH' : res.status === 403 ? 'PREMIUM_REQUIRED' : res.code;
  return { ok: false, code, message: res.message };
}

export interface CoachPoint {
  date: string;
  wordsPerMinute: number;
  fillersPerMinute: number;
  silenceTotal: number;
  speakingRatio: number;
}

export interface CoachStats {
  totalAnalyses: number;
  averages: { wordsPerMinute: number; fillersPerMinute: number; speakingRatio: number };
  /** Écart entre les 5 dernières et les 5 premières analyses (null avant 2 analyses). */
  trend: { fillersPerMinute: number; wordsPerMinute: number } | null;
  /** Les 50 dernières analyses, de la plus ancienne à la plus récente. */
  series: CoachPoint[];
}

export type HistoryItem = Analysis & { post: { title: string | null; type: 'video' | 'audio'; duration: number } };

export async function loadCoachStats(): Promise<Result<CoachStats>> {
  return read('/coach/stats');
}

export async function loadCoachHistory(cursor?: unknown): Promise<Result<{ items: HistoryItem[]; nextCursor: string | null }>> {
  if (cursor !== undefined && (typeof cursor !== 'string' || !/^[A-Za-z0-9_-]{1,300}$/.test(cursor))) return BAD;
  return read(`/coach/history?limit=20${cursor ? `&cursor=${cursor}` : ''}`);
}

export interface CoachQuota {
  used: number;
  total: number;
  remaining: number;
  isPremium: boolean;
}

/** Quota du mois et statut Premium (onglet Coach IA, page du coach). */
export async function loadCoachQuota(): Promise<Result<CoachQuota>> {
  return read('/coach/quota');
}
