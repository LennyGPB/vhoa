'use server';

import { neon } from '@neondatabase/serverless';
import { headers } from 'next/headers';

import {
  cleanEmail,
  cleanPlatform,
  clientIp,
  emailKey,
  hashIp,
  isDisposable,
  MIN_FILL_MS,
  RATE_LIMIT,
} from '@/lib/waitlist';

export type WaitlistResult = { ok: true } | { ok: false; error: string };

export interface WaitlistInput {
  email: string;
  platform: string;
  /** Champ piège invisible : un humain le laisse vide. */
  website?: string;
  /** Temps passé sur le formulaire avant l'envoi (ms). */
  elapsedMs?: number;
}

/**
 * Inscription à la liste d'attente (table `WaitlistEntry` de la base Neon de vhoa-api).
 *
 * Protections, dans l'ordre :
 * 1. Next.js refuse les appels venant d'un autre site (Origin ≠ Host).
 * 2. Champ piège rempli ou envoi trop rapide → robot : on répond « ok » sans rien enregistrer.
 * 3. Email invalide ou jetable → refusé.
 * 4. Trop d'inscriptions depuis la même IP (heure / jour) → refusé.
 * 5. Pas de doublon : une boîte mail = une ligne (Gmail sans points, sans « +alias »).
 *    Une réinscription met juste la plateforme à jour, et la réponse est la même :
 *    on ne révèle pas si une adresse est déjà inscrite.
 */
export async function joinWaitlist(input: WaitlistInput): Promise<WaitlistResult> {
  if (input.website || (input.elapsedMs ?? 0) < MIN_FILL_MS) return { ok: true };

  const email = cleanEmail(input.email);
  if (!email) return { ok: false, error: 'Cet email ne semble pas valide.' };
  if (isDisposable(email)) return { ok: false, error: 'Les adresses jetables ne sont pas acceptées.' };

  const platform = cleanPlatform(input.platform);
  if (!platform) return { ok: false, error: 'Choisis iPhone ou Android.' };

  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error('[waitlist] DATABASE_URL manquant');
    return { ok: false, error: 'Inscription indisponible pour le moment, réessaie plus tard.' };
  }

  try {
    const sql = neon(url);
    const ipHash = hashIp(clientIp(await headers()));

    const [recent] = await sql`
      SELECT
        count(*) FILTER (WHERE "createdAt" > now() - interval '1 hour')::int AS "lastHour",
        count(*)::int AS "lastDay"
      FROM "WaitlistEntry"
      WHERE "ipHash" = ${ipHash} AND "createdAt" > now() - interval '1 day'
    `;
    if (recent.lastHour >= RATE_LIMIT.perHour || recent.lastDay >= RATE_LIMIT.perDay) {
      return { ok: false, error: 'Trop d’inscriptions depuis ta connexion. Réessaie un peu plus tard.' };
    }

    await sql`
      INSERT INTO "WaitlistEntry" ("email", "emailKey", "platform", "ipHash")
      VALUES (${email}, ${emailKey(email)}, ${platform === 'ios' ? 'IOS' : 'ANDROID'}::"WaitlistPlatform", ${ipHash})
      ON CONFLICT ("emailKey") DO UPDATE
        SET "platform" = EXCLUDED."platform", "updatedAt" = now()
    `;
    return { ok: true };
  } catch (error) {
    console.error('[waitlist] échec de l’inscription', error);
    return { ok: false, error: 'Inscription impossible pour le moment, réessaie dans un instant.' };
  }
}
