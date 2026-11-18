'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import type { PostTile } from '@/app/actions/me';
import { loadUser, loadUserPosts, setBlock, setFollowUser, type PublicProfile } from '@/app/actions/public';
import { formatCount } from '@/lib/feed';
import { SIGNUP_HREF } from '@/lib/site';
import { useSessionUser } from '@/lib/use-session';

import { UserAvatar } from './AccountNav';
import { BlobBadge } from './BlobBadge';
import { Sheet } from './feed/Sheet';
import { BackIcon, FlameIcon, MicIcon, MoreIcon, ShieldIcon, TrophyIcon } from './icons';
import { BADGE_ICON, Tile } from './ProfileScreen';
import { ReportSheet } from './ReportSheet';

/** Profil public d'un orateur : prises, série, badges ; s'abonner, signaler, bloquer. */
export function PublicProfileScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const me = useSessionUser();
  const member = me !== null;
  const [profile, setProfile] = useState<PublicProfile | null | 'missing' | 'error'>(null);
  const [posts, setPosts] = useState<PostTile[] | null>(null);
  const [menu, setMenu] = useState(false);
  const [confirmBlock, setConfirmBlock] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    loadUser(id).then((res) => {
      if (!res.ok) return setProfile(res.code === 'NOT_FOUND' || res.code === 'INVALID' ? 'missing' : 'error');
      // Son propre profil : la page complète (brouillons, paramètres…).
      if (res.data.isMe) return router.replace('/profil');
      setProfile(res.data);
    });
    loadUserPosts(id).then((res) => setPosts(res.ok ? res.data : []));
  }, [id, member, router]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(t);
  }, [toast]);

  if (profile === 'missing' || profile === 'error') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-canvas px-6">
        <div className="glass-frame w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
          <h1 className="text-[24px] font-bold">{profile === 'missing' ? 'Profil introuvable' : 'Impossible de charger'}</h1>
          <Link
            href="/feed"
            className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white">
            Retour au feed
          </Link>
        </div>
      </div>
    );
  }

  const p = profile;

  const toggleFollow = () => {
    if (!p) return;
    if (!member) return router.push(SIGNUP_HREF);
    const on = !p.isFollowing;
    setProfile({ ...p, isFollowing: on, followers: Math.max(0, p.followers + (on ? 1 : -1)) });
    setFollowUser(p.id, on).then((res) => {
      if (res.ok) return;
      setProfile((cur) => (cur && typeof cur === 'object' ? { ...cur, isFollowing: !on, followers: p.followers } : cur));
      setToast(res.message);
    });
  };

  const toggleBlock = (on: boolean) =>
    startTransition(async () => {
      if (!p) return;
      const res = await setBlock(p.id, on);
      setConfirmBlock(false);
      if (!res.ok) return setToast(res.message);
      setProfile({ ...p, isBlocked: on, isFollowing: on ? false : p.isFollowing });
      setToast(on ? `@${p.username} est bloqué.` : `@${p.username} est débloqué.`);
    });

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -left-48 -top-48 size-[600px] opacity-60" />
      </div>

      <main className="relative mx-auto flex max-w-lg flex-col gap-7 px-4 pb-40 pt-[max(env(safe-area-inset-top),20px)]">
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/feed'))}
            aria-label="Retour"
            className="glass grid size-11 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </button>
          {p && (
            <button
              type="button"
              onClick={() => setMenu(true)}
              aria-label="Options du profil"
              className="glass grid size-11 place-items-center rounded-full text-white">
              <MoreIcon size={20} />
            </button>
          )}
        </div>

        {p ? (
          <header className="-mt-4 flex flex-col items-center text-center">
            <span className="rounded-full p-1 shadow-[0_0_0_2px_var(--color-accent),0_14px_44px_-10px_var(--color-accent)]">
              <UserAvatar user={{ username: p.username, avatarUrl: p.avatarUrl || null, avatarEffect: p.avatarEffect }} size={92} />
            </span>
            <h1 className="mt-4 flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
              {p.displayName}
              {p.isPremium && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Premium</span>
              )}
            </h1>
            <p className="text-[15px] text-white/50">@{p.username}</p>
            {p.bio && <p className="mt-3 max-w-xs text-[15px] leading-snug text-white/75">{p.bio}</p>}

            {p.isBlocked ? (
              <button
                type="button"
                disabled={pending}
                onClick={() => toggleBlock(false)}
                className="mt-5 h-12 rounded-full px-7 text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]">
                Débloquer
              </button>
            ) : (
              <button
                type="button"
                onClick={toggleFollow}
                aria-pressed={p.isFollowing}
                className={`mt-5 h-12 rounded-full px-8 text-[15px] font-semibold transition-colors ${
                  p.isFollowing
                    ? 'text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.15)]'
                    : 'bg-accent text-white shadow-[0_14px_40px_-12px_var(--color-accent)]'
                }`}>
                {p.isFollowing ? 'Abonné' : 'S’abonner'}
              </button>
            )}

            <div className="glass mt-5 flex w-full divide-x divide-white/[0.07] rounded-[22px]">
              {[
                { v: p.postsCount, l: 'Prises' },
                { v: p.followers, l: 'Abonnés' },
                { v: p.following, l: 'Abonnements' },
              ].map((s) => (
                <div key={s.l} className="flex flex-1 flex-col items-center py-3">
                  <span className="text-[19px] font-bold tabular-nums">{formatCount(s.v)}</span>
                  <span className="text-[12px] text-white/50">{s.l}</span>
                </div>
              ))}
            </div>
          </header>
        ) : (
          <div aria-label="Chargement" className="-mt-4 flex flex-col items-center gap-3">
            <span className="size-[100px] animate-pulse rounded-full bg-white/[0.06]" />
            <span className="h-6 w-40 animate-pulse rounded-full bg-white/[0.06]" />
          </div>
        )}

        {/* Série + badges débloqués, sur une ligne. */}
        {p && !p.isBlocked && (
          <div className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4">
            <div className="glass-solid flex w-[132px] shrink-0 snap-start flex-col justify-center rounded-[22px] px-4 py-3">
              <span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-white/45">
                <FlameIcon size={13} className="text-accent" />
                Série
              </span>
              <span className="mt-1 text-[26px] font-black leading-none">{p.streak.current}</span>
              <span className="text-[12px] text-white/50">{p.streak.current > 1 ? 'semaines' : 'semaine'}</span>
            </div>
            {p.badges
              .filter((b) => b.unlocked)
              .map((b, i) => {
                const Icon = BADGE_ICON[b.id] ?? TrophyIcon;
                return (
                  <div key={b.id} title={b.description} className="flex w-[76px] shrink-0 snap-start flex-col items-center gap-1.5 py-1">
                    <BlobBadge size={52} seed={i * 1.3}>
                      <Icon size={20} />
                    </BlobBadge>
                    <span className="text-center text-[11px] font-semibold leading-tight text-white/80">{b.name}</span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Prises publiées */}
        {p && !p.isBlocked && (
          <section aria-label="Prises" className="flex flex-col gap-3">
            <h2 className="px-1 text-[18px] font-bold">Prises</h2>
            {posts === null ? (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="aspect-[9/16] animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-accent/15 text-accent">
                  <MicIcon size={24} />
                </span>
                <p className="mt-4 text-[15px] text-white/55">Aucune prise de parole pour l’instant.</p>
              </div>
            ) : (
              <ul className="grid grid-cols-3 gap-2">
                {posts.map((t) => (
                  <li key={t.id}>
                    <Tile tile={t} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>

      {/* Options : signaler, bloquer */}
      <Sheet open={menu} onClose={() => setMenu(false)} title="Options du profil">
        {p && (
          <div className="flex flex-col gap-1.5 px-4 pb-6 pt-1">
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                if (!member) return router.push(SIGNUP_HREF);
                setReporting(true);
              }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold text-white hover:bg-white/[0.06]">
              <ShieldIcon size={20} />
              Signaler ce profil
            </button>
            <button
              type="button"
              onClick={() => {
                setMenu(false);
                if (!member) return router.push(SIGNUP_HREF);
                if (p.isBlocked) toggleBlock(false);
                else setConfirmBlock(true);
              }}
              className="flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold text-[#FF8FA3] hover:bg-white/[0.06]">
              <ShieldIcon size={20} />
              {p.isBlocked ? `Débloquer @${p.username}` : `Bloquer @${p.username}`}
            </button>
          </div>
        )}
      </Sheet>

      <Sheet open={confirmBlock} onClose={() => setConfirmBlock(false)} title="Bloquer">
        {p && (
          <div className="px-6 pb-8 pt-2 text-center">
            <h2 className="text-[22px] font-bold">Bloquer @{p.username} ?</h2>
            <p className="mt-2 text-[14px] leading-relaxed text-white/60">
              Vous ne verrez plus vos contenus respectifs. Cette personne n’en sera pas informée.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmBlock(false)}
                className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                Annuler
              </button>
              <button
                type="button"
                disabled={pending}
                onClick={() => toggleBlock(true)}
                className="h-14 rounded-full bg-[#FF4D6D] text-[16px] font-semibold text-white disabled:opacity-60">
                Bloquer
              </button>
            </div>
          </div>
        )}
      </Sheet>

      <ReportSheet
        target={reporting && p ? { type: 'user', id: p.id } : null}
        onClose={() => setReporting(false)}
        onDone={(message) => setToast(message)}
      />

      {toast && (
        <p
          role="status"
          className="rise glass fixed left-1/2 top-6 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-[14px] font-semibold text-white">
          {toast}
        </p>
      )}
    </div>
  );
}
