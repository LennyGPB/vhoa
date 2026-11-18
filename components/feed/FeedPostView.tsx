'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

import { formatCount, type FeedPost } from '@/lib/feed';

import { AvatarEffect, isEffectId } from '../AvatarEffect';

import {
  BookmarkIcon,
  CheckCircleIcon,
  CommentIcon,
  FlameIcon,
  HeartIcon,
  MoreIcon,
  PlayIcon,
  PlusIcon,
  ShareIcon,
} from '../icons';

/** Délai max entre deux taps pour un double tap. */
const DOUBLE_TAP_MS = 260;
const BARS = Array.from({ length: 28 }, (_, i) => i);

/** Ce qui demande un compte : sans session, la page ouvre l'invitation à s'inscrire. */
export type AccountAction = 'like' | 'comment' | 'save' | 'convinced' | 'follow';

/** Actions du post. `likeOn` = double tap : aime, ne retire jamais un j'aime. */
export type PostAction = 'like' | 'likeOn' | 'save' | 'convinced' | 'follow';

export interface FeedPostHandlers {
  onAction: (post: FeedPost, action: PostAction) => void;
  onOpenComments: (post: FeedPost) => void;
  onShare: (post: FeedPost) => void;
  /** Menu « … » : partager, signaler, bloquer. */
  onOpenMenu: (post: FeedPost) => void;
}

/** Lien vers le profil de l'auteur (pas pour les prises de démo : leurs auteurs n'existent pas). */
function AuthorLink({ post, className, children }: { post: FeedPost; className?: string; children: ReactNode }) {
  if (post.demo) return <span className={className}>{children}</span>;
  return (
    <Link href={`/u/${post.author.id}`} className={className} aria-label={`Profil de @${post.author.username}`}>
      {children}
    </Link>
  );
}

interface Heart {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

/**
 * Horloge de lecture : suit le vrai média s'il existe, sinon simule la lecture sur la durée
 * du post (démo sans fichier). Repart du début à la fin, comme dans l'app.
 */
function usePlayback(post: FeedPost, playing: boolean, mediaRef: React.RefObject<HTMLMediaElement | null>) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const media = mediaRef.current;
    if (media) {
      if (playing) media.play().catch(() => {});
      else media.pause();
      const onTime = () => setTime(media.currentTime);
      media.addEventListener('timeupdate', onTime);
      return () => media.removeEventListener('timeupdate', onTime);
    }
    if (!playing) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setTime((t) => (t + dt) % post.duration);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [playing, post.duration, mediaRef]);

  return time;
}

/** Photo de l'auteur, avec son effet Premium s'il en a un (l'effet déborde sans changer la taille). */
function Avatar({ post, size }: { post: FeedPost; size: number }) {
  const effect = isEffectId(post.author.avatarEffect) ? post.author.avatarEffect : null;
  if (!effect) return <AvatarFace post={post} size={size} />;
  return (
    <AvatarEffect effect={effect} size={size}>
      <AvatarFace post={post} size={size} />
    </AvatarEffect>
  );
}

function AvatarFace({ post, size }: { post: FeedPost; size: number }) {
  if (post.author.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image distante (R2), taille fixe
      <img
        src={post.author.avatarUrl}
        alt=""
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full font-bold text-white"
      style={{
        width: size,
        height: size,
        fontSize: size * 0.4,
        background: `linear-gradient(135deg, ${post.author.color}, #1F66D1)`,
      }}>
      {post.author.username[0].toUpperCase()}
    </span>
  );
}

/** Fond d'un post sans vidéo : avatar au centre, halo et onde qui bougent pendant la lecture. */
function AudioStage({ post, playing }: { post: FeedPost; playing: boolean }) {
  const state = playing ? 'running' : 'paused';
  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#0a162c_0%,#174a8c_55%,#050a14_100%)]">
      {/* Lueurs qui dérivent. */}
      <span className="soft-blob -left-24 top-10 size-[420px] opacity-70" />
      <span
        className="soft-blob -right-32 bottom-24 size-[460px] opacity-60"
        style={{ ['--dx' as string]: '-50px', ['--dy' as string]: '-30px', ['--dur' as string]: '17s' }}
      />

      <div className="absolute inset-x-0 top-[24%] flex flex-col items-center">
        <div className="relative">
          <span
            aria-hidden
            className="feed-halo absolute -inset-5 rounded-full bg-accent/30 blur-xl"
            style={{ animationPlayState: state }}
          />
          <span className="relative block rounded-full ring-2 ring-white/80">
            <Avatar post={post} size={96} />
          </span>
        </div>
        <div aria-hidden className="mt-8 flex h-10 items-center gap-[3px]">
          {BARS.map((i) => (
            <span
              key={i}
              className="feed-bar h-full w-[3px] origin-center rounded-full bg-white/80"
              style={{ animationDelay: `${-((i * 137) % 900)}ms`, animationPlayState: state }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function RailButton({
  label,
  onClick,
  children,
  count,
  caption,
  active,
}: {
  label: string;
  onClick: () => void;
  children: ReactNode;
  count?: number;
  caption?: string;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={count !== undefined ? `${label}, ${formatCount(count)}` : label}
      aria-pressed={active}
      className="flex w-[58px] flex-col items-center gap-0.5 py-1.5 text-white transition-transform active:scale-[0.85]">
      {children}
      {count !== undefined && <span className="text-[11px] font-semibold">{formatCount(count)}</span>}
      {caption && <span className="text-[11px] font-semibold text-azure">{caption}</span>}
    </button>
  );
}

/** Colonne d'actions en verre, à droite du post. */
function ActionRail({ post, handlers }: { post: FeedPost; handlers: FeedPostHandlers }) {
  const canVote = post.theme?.phase === 'open';
  const { viewer } = post;
  const act = (action: PostAction) => () => handlers.onAction(post, action);
  return (
    <div className="flex flex-col items-center gap-3.5">
      <div className="relative mb-1.5">
        <AuthorLink post={post} className="block rounded-full ring-2 ring-white">
          <Avatar post={post} size={46} />
        </AuthorLink>
        {!viewer.isFollowingAuthor && (
          <button
            type="button"
            onClick={act('follow')}
            aria-label={`S’abonner à ${post.author.username}`}
            className="absolute -bottom-2.5 left-1/2 grid size-5 -translate-x-1/2 place-items-center rounded-full bg-accent text-white">
            <PlusIcon size={12} />
          </button>
        )}
      </div>

      <div className="glass flex flex-col items-center gap-1 rounded-full py-2.5">
        <RailButton
          label={viewer.isLiked ? 'Retirer le j’aime' : 'J’aime'}
          count={post.likes}
          active={viewer.isLiked}
          onClick={act('like')}>
          <span key={String(viewer.isLiked)} className={viewer.isLiked ? 'feed-pop text-[#FF4D6D]' : ''}>
            <HeartIcon size={26} filled={viewer.isLiked} />
          </span>
        </RailButton>
        <RailButton label="Commentaires" count={post.comments} onClick={() => handlers.onOpenComments(post)}>
          <CommentIcon size={26} />
        </RailButton>
        <RailButton label="Partager" count={post.shares} onClick={() => handlers.onShare(post)}>
          <ShareIcon size={26} />
        </RailButton>
        <RailButton
          label={viewer.isSaved ? 'Retirer des enregistrements' : 'Enregistrer'}
          count={post.saves}
          active={viewer.isSaved}
          onClick={act('save')}>
          <span key={String(viewer.isSaved)} className={viewer.isSaved ? 'feed-pop text-[#FFD166]' : ''}>
            <BookmarkIcon size={26} filled={viewer.isSaved} />
          </span>
        </RailButton>
        {canVote && (
          <RailButton
            label={viewer.isConvinced ? 'Retirer mon vote Convaincu' : 'Voter Convaincu'}
            count={post.convinced}
            caption="Convaincu"
            active={viewer.isConvinced}
            onClick={act('convinced')}>
            <span key={String(viewer.isConvinced)} className={viewer.isConvinced ? 'feed-pop text-accent' : ''}>
              <CheckCircleIcon size={26} filled={viewer.isConvinced} />
            </span>
          </RailButton>
        )}
        <RailButton label="Plus d’options" onClick={() => handlers.onOpenMenu(post)}>
          <MoreIcon size={24} />
        </RailButton>
      </div>
    </div>
  );
}

/** Pseudo, titre, catégorie, hashtags et badge de thème, en bas à gauche. */
function PostInfo({ post }: { post: FeedPost }) {
  const theme = post.theme;
  const themeLabel = theme ? (theme.period === 'weekly' ? 'Thème de la semaine' : 'Thème du mois') : null;
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {theme && themeLabel && (
        <Link
          href="/defis"
          className="mb-1.5 inline-flex items-center gap-1.5 self-start rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white">
          <FlameIcon size={12} />
          {theme.phase === 'open' ? `${themeLabel} · Vote en cours` : themeLabel}
        </Link>
      )}
      <AuthorLink post={post} className="self-start text-[15px] font-bold text-white hover:underline">
        @{post.author.username}
      </AuthorLink>
      <p className="line-clamp-2 text-[14px] font-semibold leading-snug text-white">{post.title}</p>
      <p className="truncate text-[12px] font-medium text-white/75">
        {post.category}
        {post.hashtags.length > 0 && `  ·  ${post.hashtags.join(' ')}`}
      </p>
    </div>
  );
}

/** Un post plein écran du feed. */
export function FeedPostView({
  post,
  active,
  near,
  ...handlers
}: { post: FeedPost; active: boolean; near: boolean } & FeedPostHandlers) {
  const [userPaused, setUserPaused] = useState(false);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const lastTap = useRef(0);
  const tapTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mediaRef = useRef<HTMLMediaElement | null>(null);

  // Revenir sur un post le relance : la pause manuelle ne survit pas au défilement.
  const [wasActive, setWasActive] = useState(active);
  if (wasActive !== active) {
    setWasActive(active);
    if (!active) setUserPaused(false);
  }

  const playing = active && !userPaused;
  const time = usePlayback(post, playing, mediaRef);
  const cue = post.transcript.find((c) => time >= c.start && time < c.end);
  const progress = time / post.duration;

  useEffect(
    () => () => {
      if (tapTimer.current) clearTimeout(tapTimer.current);
    },
    [],
  );

  // Tap = pause / lecture ; double tap = j'aime (cœur à l'endroit du tap).
  const onTap = (e: MouseEvent<HTMLButtonElement>) => {
    const now = Date.now();
    const rect = e.currentTarget.getBoundingClientRect();
    if (now - lastTap.current < DOUBLE_TAP_MS) {
      if (tapTimer.current) clearTimeout(tapTimer.current);
      tapTimer.current = null;
      lastTap.current = 0;
      const heart = {
        id: now,
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        rotation: Math.round(Math.random() * 30 - 15),
      };
      setHearts((h) => [...h, heart]);
      setTimeout(() => setHearts((h) => h.filter((x) => x.id !== heart.id)), 900);
      setTimeout(() => handlers.onAction(post, 'likeOn'), 300);
      return;
    }
    lastTap.current = now;
    tapTimer.current = setTimeout(() => {
      tapTimer.current = null;
      setUserPaused((p) => !p);
    }, DOUBLE_TAP_MS);
  };

  const hasVideo = post.type === 'video' && post.mediaUrl;

  return (
    <section
      data-post={post.id}
      aria-label={`Prise de @${post.author.username} : ${post.title}`}
      className="relative flex h-svh snap-start snap-always items-center justify-center md:gap-5 md:py-5">
      <div className="relative h-full w-full overflow-hidden bg-black md:aspect-[9/16] md:w-auto md:rounded-[28px] md:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.06)]">
        {/* Média : vidéo, audio ou lecture simulée (démo). */}
        {hasVideo ? (
          near && (
            <video
              ref={(el) => {
                mediaRef.current = el;
              }}
              src={post.mediaUrl}
              poster={post.posterUrl}
              loop
              playsInline
              preload="auto"
              className="absolute inset-0 size-full object-cover"
            />
          )
        ) : (
          <>
            <AudioStage post={post} playing={playing} />
            {post.mediaUrl && near && (
              <audio
                ref={(el) => {
                  mediaRef.current = el;
                }}
                src={post.mediaUrl}
                loop
                preload="auto"
              />
            )}
          </>
        )}

        {/* Assombrit le haut (onglets) et le bas (texte) pour garder le texte lisible. */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,transparent_18%,transparent_55%,rgb(0_0_0/0.75)_100%)]"
        />

        {/* Sous-titres : la prise de parole se lit autant qu'elle s'écoute. */}
        <div className="pointer-events-none absolute inset-x-6 top-[56%] flex justify-center md:inset-x-8">
          {cue && (
            <p
              key={cue.start}
              className="rise max-w-sm text-balance text-center text-[22px] font-bold leading-snug tracking-[-0.01em] text-white [text-shadow:0_2px_12px_rgb(0_0_0/0.5)]">
              {cue.text}
            </p>
          )}
        </div>

        {/* Zone de gestes. */}
        <button
          type="button"
          onClick={onTap}
          aria-label={playing ? 'Mettre en pause' : 'Lire'}
          className="absolute inset-0 cursor-pointer"
        />

        {userPaused && active && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 grid size-[84px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 pl-1.5 text-white/90">
            <PlayIcon size={40} />
          </span>
        )}

        {hearts.map((h) => (
          <span
            key={h.id}
            aria-hidden
            className="feed-heart pointer-events-none absolute text-[#FF4D6D] [filter:drop-shadow(0_6px_18px_rgb(255_77_109/0.5))]"
            style={{ left: h.x - 48, top: h.y - 48, ['--r' as string]: `${h.rotation}deg` }}>
            <HeartIcon size={96} filled />
          </span>
        ))}

        {/* Bas du post : infos + actions (mobile), puis barre de progression. La place de la barre d'onglets est réservée. */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col pb-[calc(env(safe-area-inset-bottom)+104px)] md:pb-4">
          <div className="flex items-end gap-3 pl-4 pr-3">
            <div className="pointer-events-auto min-w-0 flex-1 pb-1.5">
              <PostInfo post={post} />
            </div>
            <div className="pointer-events-auto md:hidden">
              <ActionRail post={post} handlers={handlers} />
            </div>
          </div>
          <div aria-hidden className="mx-4 mt-3.5 h-0.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
      </div>

      {/* Sur grand écran, les actions sont à côté du post. */}
      <div className="hidden self-end pb-6 md:block">
        <ActionRail post={post} handlers={handlers} />
      </div>
    </section>
  );
}
