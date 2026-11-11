import 'server-only';

import { createHmac } from 'node:crypto';

/**
 * Règles de la liste d'attente : validation, dédoublonnage et anti-spam.
 * Tout ce qui est ici tourne uniquement côté serveur.
 */

export type WaitlistPlatform = 'ios' | 'android';

/** Inscriptions acceptées par IP : en rafale (1 h) et sur la journée. */
export const RATE_LIMIT = { perHour: 5, perDay: 20 };

/** En dessous de ce délai entre l'affichage et l'envoi, c'est un robot. */
export const MIN_FILL_MS = 1500;

/** Adresses jetables les plus courantes : refusées. */
const DISPOSABLE_DOMAINS = new Set([
  '10minutemail.com',
  '20minutemail.com',
  'dispostable.com',
  'emailondeck.com',
  'fakeinbox.com',
  'getairmail.com',
  'getnada.com',
  'guerrillamail.com',
  'guerrillamail.net',
  'guerrillamailblock.com',
  'jetable.org',
  'maildrop.cc',
  'mailinator.com',
  'mailnesia.com',
  'mintemail.com',
  'moakt.com',
  'mohmal.com',
  'mytemp.email',
  'sharklasers.com',
  'spam4.me',
  'temp-mail.org',
  'tempail.com',
  'tempmail.com',
  'tempmail.net',
  'tempmailo.com',
  'throwawaymail.com',
  'trashmail.com',
  'yopmail.com',
  'yopmail.fr',
  'yopmail.net',
]);

const EMAIL_RE = /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/;

/** Email nettoyé (minuscules, sans espaces) ou `null` s'il n'est pas valide. */
export function cleanEmail(raw: unknown): string | null {
  if (typeof raw !== 'string') return null;
  const email = raw.trim().toLowerCase();
  if (email.length > 254 || !EMAIL_RE.test(email)) return null;
  const [local, domain] = email.split('@');
  if (local.length > 64 || local.startsWith('.') || local.endsWith('.') || local.includes('..')) return null;
  // Le domaine doit finir par une extension alphabétique d'au moins 2 lettres.
  if (!/\.[a-z]{2,}$/.test(domain)) return null;
  return email;
}

export function isDisposable(email: string): boolean {
  const domain = email.split('@')[1];
  // Couvre aussi les sous-domaines (ex. « x.mailinator.com »).
  return [...DISPOSABLE_DOMAINS].some((d) => domain === d || domain.endsWith(`.${d}`));
}

/**
 * Clé de dédoublonnage : « Jean.Dupont+vhoa@gmail.com » et « jeandupont@googlemail.com »
 * désignent la même boîte. On retire l'alias « +… » partout, et les points chez Gmail.
 */
export function emailKey(email: string): string {
  const [rawLocal, rawDomain] = email.split('@');
  let local = rawLocal.split('+')[0];
  let domain = rawDomain;
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    local = local.replaceAll('.', '');
    domain = 'gmail.com';
  }
  return `${local}@${domain}`;
}

export function cleanPlatform(raw: unknown): WaitlistPlatform | null {
  return raw === 'ios' || raw === 'android' ? raw : null;
}

/** Empreinte de l'IP : permet de limiter les rafales sans jamais stocker l'IP. */
export function hashIp(ip: string): string {
  const salt = process.env.WAITLIST_IP_SALT;
  if (!salt) throw new Error('WAITLIST_IP_SALT manquant');
  return createHmac('sha256', salt).update(ip).digest('hex');
}

/** IP du visiteur derrière le proxy (Vercel renseigne `x-forwarded-for`). */
export function clientIp(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || headers.get('x-real-ip') || 'inconnue';
}
