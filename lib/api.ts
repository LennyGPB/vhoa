import 'server-only';

import { headers } from 'next/headers';

/**
 * Appels à l'API VHOA depuis le serveur du site (jamais depuis le navigateur).
 * Le site transmet l'IP et le navigateur du visiteur : l'API limite ainsi le débit par visiteur,
 * et non pour tout le site d'un coup (voir BFF_SECRET dans vhoa-api).
 */

export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; code: string; message: string };

function baseUrl() {
  const url = process.env.API_URL;
  if (!url) throw new Error('API_URL manquant dans .env');
  return url.replace(/\/+$/, '');
}

/** IP du visiteur : premier maillon de X-Forwarded-For (posé par l'hébergeur). */
async function visitor() {
  const h = await headers();
  const ip = h.get('x-forwarded-for')?.split(',')[0]?.trim() || h.get('x-real-ip') || '';
  return { ip, userAgent: h.get('user-agent') ?? '' };
}

export async function api<T>(
  path: string,
  { method = 'GET', body, token }: { method?: string; body?: unknown; token?: string } = {},
): Promise<ApiResult<T>> {
  const { ip, userAgent } = await visitor();
  const secret = process.env.BFF_SECRET;
  const h: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) h['Content-Type'] = 'application/json';
  if (token) h.Authorization = `Bearer ${token}`;
  if (userAgent) h['User-Agent'] = userAgent.slice(0, 200);
  if (secret && ip) {
    h['X-VHOA-BFF-Key'] = secret;
    h['X-VHOA-Client-IP'] = ip;
  }

  let res: Response;
  try {
    res = await fetch(`${baseUrl()}${path}`, {
      method,
      headers: h,
      body: body === undefined ? undefined : JSON.stringify(body),
      cache: 'no-store',
      signal: AbortSignal.timeout(15_000),
    });
  } catch {
    return { ok: false, status: 0, code: 'NETWORK', message: 'Impossible de joindre le serveur, réessaie.' };
  }

  const data = (await res.json().catch(() => null)) as
    | (T & { code?: string; message?: string | string[] })
    | null;
  if (res.ok) return { ok: true, data: data as T };
  const message = Array.isArray(data?.message) ? data.message[0] : data?.message;
  return {
    ok: false,
    status: res.status,
    code: data?.code ?? 'ERROR',
    message: message || 'Une erreur est survenue, réessaie.',
  };
}
