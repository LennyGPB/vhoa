import 'server-only';

import { createHmac, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { connection } from 'next/server';

/**
 * Accès au coin admin : un seul mot de passe, jamais stocké en clair.
 * - ADMIN_PASSWORD_HASH : « scrypt:N:r:p:sel:empreinte » (base64url).
 * - ADMIN_SESSION_SECRET : signe le cookie de session. Le changer déconnecte tout le monde.
 */

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const COOKIE = 'vhoa_admin';
/** Durée d'une session admin. */
const SESSION_MS = 8 * 60 * 60 * 1000;

/** Anti-force brute : 5 échecs par IP sur 15 minutes, puis blocage. */
const MAX_FAILURES = 5;
const WINDOW_MS = 15 * 60 * 1000;
const failures = new Map<string, { count: number; since: number }>();

function secret(): string {
  const value = process.env.ADMIN_SESSION_SECRET;
  if (!value || value.length < 32) throw new Error('ADMIN_SESSION_SECRET manquant ou trop court');
  return value;
}

function sign(payload: string): string {
  return createHmac('sha256', secret()).update(payload).digest('base64url');
}

function safeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Compare le mot de passe à l'empreinte scrypt, en temps constant. */
async function passwordMatches(password: string): Promise<boolean> {
  const stored = process.env.ADMIN_PASSWORD_HASH;
  if (!stored) throw new Error('ADMIN_PASSWORD_HASH manquant');
  const [algo, n, r, p, salt, hash] = stored.split(':');
  if (algo !== 'scrypt' || !salt || !hash) throw new Error('ADMIN_PASSWORD_HASH mal formé');
  const expected = Buffer.from(hash, 'base64url');
  const actual = await scrypt(password, Buffer.from(salt, 'base64url'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
    maxmem: 128 * 1024 * 1024,
  });
  return safeEqual(actual, expected);
}

export function isLockedOut(ip: string): boolean {
  const entry = failures.get(ip);
  if (!entry) return false;
  if (Date.now() - entry.since > WINDOW_MS) {
    failures.delete(ip);
    return false;
  }
  return entry.count >= MAX_FAILURES;
}

function recordFailure(ip: string) {
  const entry = failures.get(ip);
  if (!entry || Date.now() - entry.since > WINDOW_MS) failures.set(ip, { count: 1, since: Date.now() });
  else entry.count += 1;
}

/** Vérifie le mot de passe ; en cas de succès, ouvre la session (cookie signé). */
export async function signIn(password: string, ip: string): Promise<'ok' | 'invalid' | 'locked'> {
  if (isLockedOut(ip)) return 'locked';
  // Longueur bornée : évite de faire travailler scrypt sur des entrées géantes.
  const ok = password.length > 0 && password.length <= 200 && (await passwordMatches(password));
  if (!ok) {
    recordFailure(ip);
    // Ralentit chaque échec pour décourager les essais en série.
    await new Promise((r) => setTimeout(r, 800));
    return isLockedOut(ip) ? 'locked' : 'invalid';
  }
  failures.delete(ip);

  const expires = Date.now() + SESSION_MS;
  const payload = `v1.${expires}`;
  (await cookies()).set(COOKIE, `${payload}.${sign(payload)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/admin',
    expires: new Date(expires),
  });
  return 'ok';
}

export async function signOut() {
  (await cookies()).set(COOKIE, '', { path: '/admin', maxAge: 0 });
}

/** Vrai si la requête porte une session admin valide et non expirée. */
export async function isAdmin(): Promise<boolean> {
  const value = (await cookies()).get(COOKIE)?.value;
  if (!value) return false;
  const [version, expires, signature] = value.split('.');
  if (version !== 'v1' || !expires || !signature) return false;
  if (!safeEqual(signature, sign(`${version}.${expires}`))) return false;
  // L'heure doit être lue à la requête, jamais figée au prérendu.
  await connection();
  return Number(expires) > Date.now();
}

/** À appeler en tête de chaque page, action ou route admin : redirige si pas connecté. */
export async function requireAdmin() {
  if (!(await isAdmin())) redirect('/admin/login');
}
