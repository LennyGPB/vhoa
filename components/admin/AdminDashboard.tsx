'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';

import { checkAdmin, loadStats } from '@/app/actions/admin';
import { useSessionUser } from '@/lib/use-session';

import { UserAvatar } from '../AccountNav';
import { Logo } from '../Logo';
import { Posts, Users } from './Content';
import { Appeals, Reports } from './Moderation';
import { Overview } from './Overview';
import { Themes, Waitlist } from './Planning';
import { Premium } from './Premium';

type Tab = 'overview' | 'reports' | 'appeals' | 'posts' | 'users' | 'themes' | 'premium' | 'waitlist';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview', label: 'Vue d’ensemble' },
  { key: 'reports', label: 'Signalements' },
  { key: 'appeals', label: 'Contestations' },
  { key: 'posts', label: 'Prises' },
  { key: 'users', label: 'Membres' },
  { key: 'themes', label: 'Défis' },
  { key: 'premium', label: 'Premium' },
  { key: 'waitlist', label: 'Liste d’attente' },
];
const KEYS = new Set<string>(TABS.map((t) => t.key));

/** Onglet lu dans l'adresse (#signalements…) : un rafraîchissement garde la section. */
function readHash(): Tab {
  const h = window.location.hash.slice(1);
  return KEYS.has(h) ? (h as Tab) : 'overview';
}
function subscribeHash(cb: () => void) {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
}

/** Back-office VHOA : réservé aux comptes admin (vérifié par l'API à chaque action). */
export function AdminDashboard() {
  const me = useSessionUser();
  const tab = useSyncExternalStore(subscribeHash, readHash, () => 'overview' as Tab);
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [counts, setCounts] = useState<{ reports: number; appeals: number }>({ reports: 0, appeals: 0 });
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    checkAdmin().then((ok) => {
      setAllowed(ok);
      if (ok)
        loadStats().then((res) => {
          if (res.ok) setCounts({ reports: res.data.moderation.reportsOpen, appeals: res.data.moderation.appealsOpen });
        });
    });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2800);
    return () => clearTimeout(t);
  }, [toast]);

  const go = (t: Tab) => {
    // L'adresse garde la section ; l'événement prévient useSyncExternalStore.
    window.history.pushState(null, '', `#${t}`);
    window.dispatchEvent(new HashChangeEvent('hashchange'));
    window.scrollTo({ top: 0 });
  };
  const notify = useCallback((m: string) => setToast(m), []);
  const onReports = useCallback((n: number) => setCounts((c) => ({ ...c, reports: n })), []);
  const onAppeals = useCallback((n: number) => setCounts((c) => ({ ...c, appeals: n })), []);

  if (allowed === null) {
    return (
      <div className="grid min-h-svh place-items-center">
        <span aria-label="Chargement" className="size-10 animate-spin rounded-full border-[3px] border-white/15 border-t-accent" />
      </div>
    );
  }

  if (!allowed) {
    return (
      <div className="flex min-h-svh items-center justify-center px-6">
        <div className="glass-frame w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
          <Logo height={34} />
          <h1 className="mt-6 text-[24px] font-bold">Accès réservé</h1>
          <p className="mt-2 text-[15px] text-white/60">
            {me ? 'Ton compte n’a pas le rôle admin.' : 'Connecte-toi avec un compte admin pour accéder au back-office.'}
          </p>
          <Link
            href={me ? '/' : '/connexion'}
            className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
            {me ? 'Retour au site' : 'Se connecter'}
          </Link>
        </div>
      </div>
    );
  }

  const badge = (key: Tab) => (key === 'reports' ? counts.reports : key === 'appeals' ? counts.appeals : 0);

  return (
    <div className="mx-auto flex min-h-svh max-w-7xl gap-6 px-4 md:px-6">
      {/* Barre latérale (ordinateur) */}
      <aside className="sticky top-0 hidden h-svh w-60 shrink-0 flex-col py-6 md:flex">
        <div className="glass flex flex-1 flex-col rounded-[28px] p-3">
          <Link href="/" className="flex items-center gap-2.5 px-3 pb-5 pt-2">
            <Logo height={26} />
            <span className="text-[13px] font-semibold text-white/50">Back-office</span>
          </Link>
          <nav aria-label="Sections" className="flex flex-col gap-1">
            {TABS.map((t) => {
              const on = tab === t.key;
              const n = badge(t.key);
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => go(t.key)}
                  aria-current={on ? 'page' : undefined}
                  className={`flex h-11 items-center justify-between rounded-2xl px-4 text-left text-[14px] font-semibold transition-colors ${
                    on ? 'bg-accent text-white shadow-[0_10px_30px_-12px_var(--color-accent)]' : 'text-white/65 hover:bg-white/[0.05] hover:text-white'
                  }`}>
                  {t.label}
                  {n > 0 && (
                    <span className={`grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-[11px] ${on ? 'bg-white/25' : 'bg-[#FF4D6D] text-white'}`}>
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
          {me && (
            <div className="mt-auto flex items-center gap-2.5 rounded-2xl bg-white/[0.04] p-2.5">
              <UserAvatar user={me} size={34} />
              <span className="min-w-0">
                <span className="block truncate text-[13px] font-semibold">@{me.username}</span>
                <span className="block text-[11px] text-azure">Admin</span>
              </span>
            </div>
          )}
        </div>
      </aside>

      <main className="min-w-0 flex-1 pb-24 pt-[max(env(safe-area-inset-top),16px)] md:py-8">
        {/* En-tête + sections (mobile) */}
        <div className="mb-5 flex items-center justify-between md:hidden">
          <Link href="/" className="flex items-center gap-2">
            <Logo height={26} />
            <span className="text-[13px] font-semibold text-white/50">Back-office</span>
          </Link>
          {me && <UserAvatar user={me} size={34} />}
        </div>
        <nav aria-label="Sections" className="no-scrollbar -mx-4 mb-6 flex gap-2 overflow-x-auto px-4 md:hidden">
          {TABS.map((t) => {
            const on = tab === t.key;
            const n = badge(t.key);
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => go(t.key)}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold ${
                  on ? 'bg-accent text-white' : 'glass text-white/70'
                }`}>
                {t.label}
                {n > 0 && <span className={`rounded-full px-1.5 text-[11px] ${on ? 'bg-white/25' : 'bg-[#FF4D6D] text-white'}`}>{n}</span>}
              </button>
            );
          })}
        </nav>

        {tab === 'overview' && <Overview onGo={go} />}
        {tab === 'reports' && <Reports notify={notify} onCount={onReports} />}
        {tab === 'appeals' && <Appeals notify={notify} onCount={onAppeals} />}
        {tab === 'posts' && <Posts notify={notify} />}
        {tab === 'users' && <Users notify={notify} />}
        {tab === 'themes' && <Themes notify={notify} />}
        {tab === 'premium' && <Premium />}
        {tab === 'waitlist' && <Waitlist notify={notify} />}
      </main>

      {toast && (
        <p
          role="status"
          className="rise glass fixed bottom-6 left-1/2 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-[14px] font-semibold text-white">
          {toast}
        </p>
      )}
    </div>
  );
}
