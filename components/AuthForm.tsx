'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState, useSyncExternalStore, useTransition, type FormEvent } from 'react';

import { googleSignIn, login, register, type AuthResult } from '@/app/actions/auth';
import { notifySessionChange } from '@/lib/use-session';

import { Sheet } from './feed/Sheet';
import { GoogleButton } from './GoogleButton';

type Mode = 'signup' | 'login';

/** Mêmes règles que l'API (messages identiques), vérifiées avant l'envoi. */
const USERNAME_RE = /^(?![._])(?!.*[._]{2})[a-z0-9._]{3,30}(?<![._])$/;
const PASSWORD_RE = /^(?=.*\p{L})(?=.*\d).{8,128}$/u;

/** Où aller une fois connecté : la page demandée (?next=…) si elle est connue, sinon le feed. */
const AFTER_AUTH = '/feed';
const NEXT_ALLOWED = new Set(['/creer', '/creer?coach=1', '/feed', '/profil', '/premium']);
const noop = () => () => {};

function readNext() {
  const next = new URLSearchParams(window.location.search).get('next');
  return next && NEXT_ALLOWED.has(next) ? next : null;
}

const FIELD =
  'h-13 w-full rounded-2xl bg-white/[0.05] px-4 text-[15px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none transition-shadow focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] disabled:opacity-60';

/** Action en attente de la réponse à « As-tu 15 ans ou plus ? ». */
type Pending =
  | { kind: 'register'; email: string; password: string; username: string }
  | { kind: 'google'; idToken: string };

/** Inscription / connexion : Google, ou email + mot de passe. */
export function AuthForm({ mode, googleClientId }: { mode: Mode; googleClientId?: string }) {
  const router = useRouter();
  const signup = mode === 'signup';
  const [error, setError] = useState<string | null>(null);
  const [ageFor, setAgeFor] = useState<Pending | null>(null);
  const [tooYoung, setTooYoung] = useState(false);
  const [busy, startTransition] = useTransition();
  const next = useSyncExternalStore(noop, readNext, () => null);
  const keepNext = (href: string) => (next ? `${href}?next=${next}` : href);

  const done = useCallback(
    (res: AuthResult, pending?: Pending) => {
      if (res.ok) {
        notifySessionChange();
        router.replace(next ?? AFTER_AUTH);
        router.refresh();
        return;
      }
      // Compte Google tout neuf : il faut d'abord la confirmation d'âge.
      if (res.code === 'AGE_CONFIRMATION_REQUIRED' && pending) {
        setAgeFor(pending);
        return;
      }
      setError(res.message);
    },
    [router, next],
  );

  const onGoogle = useCallback(
    (idToken: string) => {
      setError(null);
      startTransition(async () => done(await googleSignIn({ idToken }), { kind: 'google', idToken }));
    },
    [done],
  );

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email') ?? '').trim();
    const password = String(form.get('password') ?? '');

    if (!signup) {
      startTransition(async () => done(await login({ email, password })));
      return;
    }

    const username = String(form.get('username') ?? '').trim().toLowerCase();
    if (!USERNAME_RE.test(username)) {
      setError('Pseudo : 3 à 30 caractères, lettres, chiffres, points ou tirets bas.');
      return;
    }
    if (!PASSWORD_RE.test(password)) {
      setError('Le mot de passe doit faire au moins 8 caractères avec une lettre et un chiffre.');
      return;
    }
    // Question de l'âge avant de créer le compte.
    setAgeFor({ kind: 'register', email, password, username });
  };

  const answerAge = (yes: boolean) => {
    const pending = ageFor;
    setAgeFor(null);
    if (!pending) return;
    if (!yes) {
      setTooYoung(true);
      return;
    }
    startTransition(async () => {
      const res =
        pending.kind === 'register'
          ? await register({ ...pending, ageConfirmed: true })
          : await googleSignIn({ idToken: pending.idToken, ageConfirmed: true });
      done(res);
    });
  };

  if (tooYoung) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[16px] leading-relaxed text-white/80">
          VHOA est réservé aux personnes de 15 ans et plus. On t’attend dans quelques années !
        </p>
        <Link href="/" className="font-semibold text-accent hover:underline">
          Retour à l’accueil
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {googleClientId && (
        <>
          <GoogleButton clientId={googleClientId} mode={mode} onCredential={onGoogle} />
          <div className="flex items-center gap-4 text-[12px] font-medium text-white/40">
            <span className="h-px flex-1 bg-white/[0.08]" />
            ou
            <span className="h-px flex-1 bg-white/[0.08]" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        {signup && (
          <input
            name="username"
            required
            minLength={3}
            maxLength={30}
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="Pseudo"
            aria-label="Pseudo"
            disabled={busy}
            className={FIELD}
          />
        )}
        <input
          name="email"
          type="email"
          required
          maxLength={254}
          autoComplete="email"
          placeholder="Email"
          aria-label="Email"
          disabled={busy}
          className={FIELD}
        />
        <input
          name="password"
          type="password"
          required
          minLength={signup ? 8 : 1}
          maxLength={128}
          autoComplete={signup ? 'new-password' : 'current-password'}
          placeholder="Mot de passe"
          aria-label="Mot de passe"
          disabled={busy}
          className={FIELD}
        />
        {error && (
          <p role="alert" className="rounded-2xl bg-[#FF4D6D]/10 px-4 py-3 text-[14px] font-medium text-[#FF8FA3]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="mt-2 inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98] disabled:opacity-60">
          {busy ? 'Un instant…' : signup ? 'Créer mon compte' : 'Se connecter'}
        </button>
        {signup && (
          <p className="mt-1 text-center text-[12px] leading-relaxed text-white/45">
            En créant un compte, tu acceptes les{' '}
            <Link href="/cgu" className="text-white/70 underline underline-offset-2">
              conditions d’utilisation
            </Link>{' '}
            et la{' '}
            <Link href="/confidentialite" className="text-white/70 underline underline-offset-2">
              politique de confidentialité
            </Link>
            .
          </p>
        )}
      </form>

      <p className="text-center text-[14px] text-white/55">
        {signup ? 'Déjà un compte ? ' : 'Pas encore de compte ? '}
        <Link href={keepNext(signup ? '/connexion' : '/inscription')} className="font-semibold text-accent hover:underline">
          {signup ? 'Se connecter' : 'Créer un compte'}
        </Link>
      </p>

      {/* Question de l'âge (15 ans minimum), posée à la création du compte. */}
      <Sheet open={ageFor !== null} onClose={() => setAgeFor(null)} title="Confirmation de l’âge">
        <div className="px-6 pb-8 pt-2 text-center">
          <h2 className="text-[24px] font-bold tracking-[-0.03em]">As-tu 15 ans ou plus ?</h2>
          <p className="mt-2 text-[15px] text-white/60">VHOA est réservé aux 15 ans et plus.</p>
          <div className="mt-7 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => answerAge(false)}
              className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06]">
              Non
            </button>
            <button
              type="button"
              onClick={() => answerAge(true)}
              className="h-14 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
              Oui
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
