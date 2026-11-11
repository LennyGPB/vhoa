import 'server-only';

import { neon } from '@neondatabase/serverless';

/**
 * Lecture / écriture de la liste d'attente pour le coin admin.
 * Chaque fonction exportée suppose que l'appelant a déjà vérifié la session (requireAdmin).
 */

export const PAGE_SIZE = 25;

export type PlatformFilter = 'all' | 'ios' | 'android';

export interface WaitlistRow {
  id: string;
  email: string;
  platform: 'IOS' | 'ANDROID';
  /** Dates stockées en UTC sans fuseau : converties en instants exacts dans les requêtes. */
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface WaitlistStats {
  total: number;
  ios: number;
  android: number;
  today: number;
  week: number;
}

function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL manquant');
  return neon(url);
}

/** Recherche « contient », sans laisser passer les jokers SQL tapés par l'utilisateur. */
function likePattern(q: string) {
  return `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
}

function platformValue(filter: PlatformFilter) {
  return filter === 'ios' ? 'IOS' : filter === 'android' ? 'ANDROID' : null;
}

export async function getStats(): Promise<WaitlistStats> {
  const [row] = await db()`
    SELECT
      count(*)::int AS total,
      count(*) FILTER (WHERE "platform" = 'IOS')::int AS ios,
      count(*) FILTER (WHERE "platform" = 'ANDROID')::int AS android,
      count(*) FILTER (WHERE "createdAt" >= date_trunc('day', now() AT TIME ZONE 'Europe/Paris') AT TIME ZONE 'Europe/Paris')::int AS today,
      count(*) FILTER (WHERE "createdAt" > now() - interval '7 days')::int AS week
    FROM "WaitlistEntry"
  `;
  return row as WaitlistStats;
}

export async function listEntries({
  q,
  platform,
  page,
}: {
  q: string;
  platform: PlatformFilter;
  page: number;
}): Promise<{ rows: WaitlistRow[]; total: number }> {
  const sql = db();
  const pattern = q ? likePattern(q) : null;
  const plat = platformValue(platform);
  const offset = (page - 1) * PAGE_SIZE;

  const [rows, [count]] = await Promise.all([
    sql`
      SELECT "id", "email", "platform",
        ("createdAt" AT TIME ZONE 'UTC') AS "createdAt",
        ("updatedAt" AT TIME ZONE 'UTC') AS "updatedAt"
      FROM "WaitlistEntry"
      WHERE (${pattern}::text IS NULL OR "email" ILIKE ${pattern})
        AND (${plat}::text IS NULL OR "platform"::text = ${plat})
      ORDER BY "createdAt" DESC
      LIMIT ${PAGE_SIZE} OFFSET ${offset}
    `,
    sql`
      SELECT count(*)::int AS total
      FROM "WaitlistEntry"
      WHERE (${pattern}::text IS NULL OR "email" ILIKE ${pattern})
        AND (${plat}::text IS NULL OR "platform"::text = ${plat})
    `,
  ]);
  return { rows: rows as WaitlistRow[], total: (count as { total: number }).total };
}

export async function deleteEntry(id: string) {
  // Refuse tout ce qui n'est pas un UUID avant même d'interroger la base.
  if (!/^[0-9a-f-]{36}$/i.test(id)) return;
  await db()`DELETE FROM "WaitlistEntry" WHERE "id" = ${id}::uuid`;
}

export async function allEntries(): Promise<WaitlistRow[]> {
  const rows = await db()`
    SELECT "id", "email", "platform",
        ("createdAt" AT TIME ZONE 'UTC') AS "createdAt",
        ("updatedAt" AT TIME ZONE 'UTC') AS "updatedAt"
    FROM "WaitlistEntry"
    ORDER BY "createdAt" ASC
  `;
  return rows as WaitlistRow[];
}
