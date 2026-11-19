'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { loadCurrentThemes, loadRecentThemes, loadThemePosts, type Podium, type Theme } from '@/app/actions/public';
import { formatCount, type FeedPost } from '@/lib/feed';
import { CREATE_HREF } from '@/lib/site';

import { UserAvatar } from './AccountNav';
import { BlobBadge } from './BlobBadge';
import { ArrowIcon, CheckCircleIcon, FlameIcon, MicIcon, TrophyIcon } from './icons';
import { LiquidBlob } from './LiquidBlob';
import { ThemeCountdown } from './ThemeCountdown';

const dateFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

/** Défi en cours (semaine), en grand, avec l'appel à participer. */
function CurrentChallenge({ theme }: { theme: Theme }) {
  return (
    <section className="relative isolate">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[118vw] -translate-x-1/2 -translate-y-1/2 opacity-60 sm:w-[640px]">
        <LiquidBlob className="h-auto w-full" speed={0.25} seed={5} glow={false} />
      </div>
      <div className="glass-frame rounded-[32px] px-6 py-8 text-center sm:px-10 sm:py-10">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-accent">
          <FlameIcon size={13} />
          Défi de la semaine
          <span className="text-azure/80">
            · <ThemeCountdown endsAt={theme.endsAt} />
          </span>
        </span>
        <h2 className="mt-5 text-balance text-[clamp(24px,6vw,34px)] font-bold leading-tight tracking-[-0.02em]">
          « {theme.subject} »
        </h2>
        <p className="mt-3 text-[14px] text-white/55">
          {theme.participantsCount > 0
            ? `${theme.participantsCount} ${theme.participantsCount > 1 ? 'prises' : 'prise'} en lice`
            : 'Sois le premier à relever le défi'}
        </p>
        <Link
          href={CREATE_HREF}
          className="group mt-7 inline-flex h-14 w-full items-center justify-between rounded-full bg-accent pl-6 pr-1.5 text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110 sm:w-auto sm:gap-8">
          <span className="flex items-center gap-2.5">
            <FlameIcon size={18} />
            Relever le défi
          </span>
          <span className="grid size-11 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
            <ArrowIcon size={18} />
          </span>
        </Link>
      </div>
    </section>
  );
}

/** Classement en direct : les prises du défi, triées par votes « Convaincu ». */
function Ranking({ posts }: { posts: FeedPost[] | null }) {
  return (
    <section aria-label="Classement du défi" className="relative z-10 flex flex-col gap-3">
      <h2 className="px-1 text-[20px] font-bold tracking-[-0.02em]">Le classement</h2>
      {posts === null && (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <span key={i} className="h-[76px] animate-pulse rounded-[22px] bg-white/[0.04]" />
          ))}
        </div>
      )}
      {posts?.length === 0 && (
        <div className="glass-solid flex items-center gap-4 rounded-[22px] p-4">
          <span className="grid size-12 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
            <MicIcon size={22} />
          </span>
          <p className="text-[14px] leading-snug text-white/60">
            Aucune prise pour l’instant. La première qui arrive prend la tête !
          </p>
        </div>
      )}
      {posts && posts.length > 0 && (
        <ol className="flex flex-col gap-2">
          {posts.map((p, i) => (
            <li key={p.id}>
              <Link
                href={`/p/${p.id}`}
                className="glass-solid flex items-center gap-3 rounded-[22px] p-2.5 pr-4 transition-colors hover:bg-[#1c1d22]">
                <span
                  className={`grid size-8 shrink-0 place-items-center rounded-full text-[14px] font-black ${
                    i === 0 ? 'bg-accent text-white' : 'text-white/50'
                  }`}>
                  {i + 1}
                </span>
                <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#0a162c,#174a8c)]">
                  {p.posterUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- miniature distante (R2)
                    <img src={p.posterUrl} alt="" className="size-full object-cover" />
                  ) : (
                    <span className="grid size-full place-items-center text-white/70">
                      <MicIcon size={16} />
                    </span>
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold text-white">{p.title || 'Sans titre'}</span>
                  <span className="block truncate text-[13px] text-white/50">@{p.author.username}</span>
                </span>
                <span className="flex items-center gap-1 text-[13px] font-semibold text-azure">
                  <CheckCircleIcon size={15} />
                  {formatCount(p.convinced)}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Podium d'un défi terminé : 2e, 1er, 3e, sur des marches liquides. */
function PodiumCard({ podium }: { podium: Podium }) {
  const { theme, winners } = podium;
  const order = [2, 1, 3]
    .map((rank) => winners.find((w) => w.rank === rank))
    .filter((w): w is Podium['winners'][number] => Boolean(w));
  const height: Record<number, string> = { 1: 'h-24', 2: 'h-16', 3: 'h-12' };
  return (
    <article className="glass-solid rounded-[28px] p-5">
      <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/40">
        {theme.period === 'weekly' ? 'Défi de la semaine' : 'Défi du mois'} · jusqu’au {dateFmt.format(new Date(theme.endsAt))}
      </p>
      <h3 className="mt-2 text-[17px] font-bold leading-snug">« {theme.subject} »</h3>

      {order.length === 0 ? (
        <p className="mt-4 text-[14px] text-white/50">
          {theme.participantsCount > 0 ? 'Pas assez de votes pour un podium.' : 'Personne n’a relevé ce défi.'}
        </p>
      ) : (
        <div className="mt-6 flex items-end justify-center gap-3">
          {order.map((w) => (
            <Link key={w.rank} href={`/p/${w.post.id}`} className="flex w-24 flex-col items-center gap-1.5">
              {w.rank === 1 && <TrophyIcon size={20} className="text-[#F5B83D]" />}
              <UserAvatar user={{ username: w.post.author.username, avatarUrl: w.post.author.avatarUrl || null, avatarEffect: w.post.author.avatarEffect }} size={w.rank === 1 ? 52 : 42} />
              <span className="max-w-full truncate text-[12px] font-semibold text-white/85">@{w.post.author.username}</span>
              <span className="flex items-center gap-1 text-[11px] font-semibold text-azure">
                <CheckCircleIcon size={12} />
                {formatCount(w.votes)}
              </span>
              <span
                className={`mt-1 grid w-full place-items-start justify-center rounded-t-[18px] pt-2 text-[18px] font-black ${height[w.rank]} ${
                  w.rank === 1
                    ? 'bg-[linear-gradient(180deg,#4AA8FF,#1F66D1)] text-white'
                    : 'bg-white/[0.07] text-white/70'
                }`}>
                {w.rank}
              </span>
            </Link>
          ))}
        </div>
      )}
    </article>
  );
}

/** Page Défis : défi en cours, classement en direct, défi du mois, podiums passés. */
export function DefisScreen() {
  const [current, setCurrent] = useState<{ weekly: Theme | null; monthly: Theme | null } | null>(null);
  const [ranking, setRanking] = useState<FeedPost[] | null>(null);
  const [podiums, setPodiums] = useState<Podium[] | null>(null);
  // Panne réseau ou API : message d'erreur et « Réessayer », plutôt qu'une page « vide ».
  const [failed, setFailed] = useState(false);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    loadCurrentThemes().then((res) => {
      if (!res.ok) {
        setFailed(true);
        return;
      }
      setCurrent(res.data);
      if (res.data.weekly) loadThemePosts(res.data.weekly.id).then((r) => setRanking(r.ok ? r.data : []));
      else setRanking([]);
    });
    loadRecentThemes().then((res) => setPodiums(res.ok ? res.data : []));
  }, [reload]);

  const retry = () => {
    setFailed(false);
    setCurrent(null);
    setRanking(null);
    setPodiums(null);
    setReload((r) => r + 1);
  };

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <main className="relative mx-auto flex max-w-lg flex-col gap-8 px-4 pb-40 pt-[max(env(safe-area-inset-top),24px)] lg:max-w-3xl lg:pb-16">
        <header className="relative z-10 px-1">
          <h1 className="text-[32px] font-bold tracking-[-0.03em]">Défis</h1>
          <p className="mt-1 text-[15px] text-white/55">Un sujet, une minute, et la communauté tranche.</p>
        </header>

        {failed && (
          <div role="alert" className="glass-frame rounded-[32px] px-6 py-8 text-center">
            <h2 className="text-[22px] font-bold">Impossible de charger les défis</h2>
            <p className="mt-2 text-[15px] text-white/60">Vérifie ta connexion, puis réessaie.</p>
            <button
              type="button"
              onClick={retry}
              className="mt-5 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-110">
              Réessayer
            </button>
          </div>
        )}
        {!failed && current === null && <span className="h-[300px] animate-pulse rounded-[32px] bg-white/[0.04]" />}
        {current?.weekly && <CurrentChallenge theme={current.weekly} />}
        {current && !current.weekly && (
          <div className="glass-frame rounded-[32px] px-6 py-8 text-center">
            <h2 className="text-[22px] font-bold">Le prochain défi arrive bientôt</h2>
            <p className="mt-2 text-[15px] text-white/55">En attendant, parle de ce que tu veux.</p>
          </div>
        )}

        {current?.weekly && <Ranking posts={ranking} />}

        {current?.monthly && (
          <section aria-label="Défi du mois" className="glass-solid flex items-center gap-4 rounded-[28px] p-5">
            <BlobBadge size={52} seed={1.7}>
              <TrophyIcon size={22} />
            </BlobBadge>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/40">
                Défi du mois ·{' '}
                <span className="text-azure/80">
                  <ThemeCountdown endsAt={current.monthly.endsAt} />
                </span>
              </p>
              <p className="mt-1 text-[16px] font-bold leading-snug">« {current.monthly.subject} »</p>
            </div>
          </section>
        )}

        <section aria-label="Derniers podiums" className="flex flex-col gap-3">
          <h2 className="px-1 text-[20px] font-bold tracking-[-0.02em]">Derniers podiums</h2>
          {podiums === null && <span className="h-[220px] animate-pulse rounded-[28px] bg-white/[0.04]" />}
          {podiums?.length === 0 && <p className="px-1 text-[14px] text-white/50">Les podiums apparaîtront à la fin du premier défi.</p>}
          {podiums?.map((p) => <PodiumCard key={p.theme.id} podium={p} />)}
        </section>
      </main>
    </div>
  );
}
