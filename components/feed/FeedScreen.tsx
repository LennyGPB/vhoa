'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';

import {
  addComment,
  countShare,
  loadComments,
  loadFeed,
  setCommentLike,
  setFollow,
  setPostState,
  type ActionResult,
} from '@/app/actions/feed';
import { formatCount, type FeedComment, type FeedPost, type ViewerState } from '@/lib/feed';
import { setBlock } from '@/app/actions/public';
import { CREATE_HREF, SIGNUP_HREF, SITE } from '@/lib/site';
import { openInstall } from '@/lib/pwa';
import { useViewTracker } from '@/lib/use-view-tracker';
import { notifySessionChange, useSessionUser } from '@/lib/use-session';

import { UserAvatar } from '../AccountNav';
import { Logo } from '../Logo';
import { ReportSheet } from '../ReportSheet';
import { ArrowIcon, BackIcon, HeartIcon, ShareIcon, ShieldIcon, VoiceWaveIcon } from '../icons';
import { LiquidBlob } from '../LiquidBlob';
import { FeedHeader, type FeedTab } from './FeedHeader';
import { FeedPostView, type AccountAction, type PostAction } from './FeedPostView';
import { Sheet } from './Sheet';

/** Invitation à créer un compte, selon l'action tentée. */
const ACCOUNT_COPY: Record<AccountAction, string> = {
  like: 'Aime cette prise',
  comment: 'Rejoins la discussion',
  save: 'Garde cette prise pour plus tard',
  convinced: 'Vote « Convaincu »',
  follow: 'Suis cet orateur',
};

/** Pour chaque bascule : le champ d'état du membre et le compteur qui l'accompagne. */
const TOGGLES = {
  like: { flag: 'isLiked', count: 'likes' },
  save: { flag: 'isSaved', count: 'saves' },
  convinced: { flag: 'isConvinced', count: 'convinced' },
} as const satisfies Record<string, { flag: keyof ViewerState; count: keyof FeedPost }>;

function AccountButtons() {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href={SIGNUP_HREF}
        className="inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
        Créer mon compte
      </Link>
      <Link
        href="/connexion"
        className="inline-flex h-14 items-center justify-center rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06]">
        Se connecter
      </Link>
    </div>
  );
}

/** Carte centrée sur fond sombre (onglet Abonnements vide, chargement…). */
function CenterCard({ title, text, children }: { title: string; text: string; children?: React.ReactNode }) {
  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="glass-frame w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
        <h2 className="text-[26px] font-bold leading-tight tracking-[-0.03em]">{title}</h2>
        <p className="mt-3 text-[15px] text-white/60">{text}</p>
        {children && <div className="mt-8">{children}</div>}
      </div>
    </div>
  );
}

/** Fin du feed : plus de prises à voir, place à la sienne. */
function FeedEnd({ standalone = false }: { standalone?: boolean }) {
  return (
    <section className="relative flex h-full snap-start items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[170vw] -translate-x-1/2 -translate-y-1/2 opacity-80 md:w-[min(110vh,1100px)]">
        <LiquidBlob className="h-auto w-full" speed={0.25} seed={6} glow={false} />
      </div>
      <div className="glass-frame w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
        <h2 className="text-[30px] font-bold leading-[1.05] tracking-[-0.03em]">
          {standalone ? 'Convaincu ?' : 'Tu as tout écouté.'}
          <br />
          <span className="text-white/45">À toi de parler.</span>
        </h2>
        <Link
          href={CREATE_HREF}
          className="group mt-8 inline-flex h-14 w-full items-center justify-between rounded-full bg-accent pl-6 pr-1.5 text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
          <span className="flex items-center gap-2.5">
            <VoiceWaveIcon size={20} />
            Prendre la parole
          </span>
          <span className="grid size-11 place-items-center rounded-full bg-white/20">
            <ArrowIcon size={18} />
          </span>
        </Link>
        {standalone && (
          <Link
            href="/feed"
            className="mt-3 inline-flex h-14 w-full items-center justify-center rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06]">
            Écouter d’autres prises
          </Link>
        )}
      </div>
    </section>
  );
}

/** En-tête de la page d'une prise (lien partagé) : retour au feed et logo. */
function StandaloneHeader() {
  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] md:px-8 md:pt-9">
      <Link
        href="/feed"
        className="glass pointer-events-auto inline-flex h-11 items-center gap-1.5 rounded-full pl-3 pr-4 text-[13px] font-semibold text-white">
        <BackIcon size={18} />
        Toutes les prises
      </Link>
      <Link href="/" aria-label="VHOA, accueil" className="pointer-events-auto">
        <Logo height={28} />
      </Link>
    </header>
  );
}

/** Feed plein écran, post par post (comme l'app). */
export function FeedScreen({
  posts: initialPosts = null,
  standalone = false,
}: {
  /** Prises déjà connues (page d'une prise partagée) ; sinon chargées depuis l'API. */
  posts?: FeedPost[] | null;
  /** Page d'une prise (lien partagé) : pas d'onglets, pas de chargement du feed. */
  standalone?: boolean;
}) {
  const me = useSessionUser();
  const member = me !== null;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [tab, setTab] = useState<FeedTab>('forYou');
  // Listes par onglet ; null = en cours de chargement.
  const [lists, setLists] = useState<Record<FeedTab, FeedPost[] | null>>({ forYou: initialPosts, following: null });
  const [active, setActive] = useState(0);
  const [account, setAccount] = useState<AccountAction | null>(null);
  const [commentsFor, setCommentsFor] = useState<FeedPost | null>(null);
  const [comments, setComments] = useState<FeedComment[] | null>(null);
  const [draft, setDraft] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<FeedPost | null>(null);
  const [reportTarget, setReportTarget] = useState<{ type: 'post' | 'comment'; id: string } | null>(null);

  const posts = useMemo(() => lists[tab] ?? [], [lists, tab]);

  // Vue comptée quand la prise jouée reste 2 s à l'écran (membres).
  useViewTracker(posts[active]?.id ?? null, member);

  // Après 5 prises écoutées (3 s chacune au moins), proposer d'installer l'app (une fois).
  const listened = useRef<Set<string>>(new Set());
  const activeId = posts[active]?.id;
  useEffect(() => {
    if (!activeId || standalone || listened.current.size >= 5) return;
    const t = setTimeout(() => {
      listened.current.add(activeId);
      if (listened.current.size === 5) openInstall('feed');
    }, 3000);
    return () => clearTimeout(t);
  }, [activeId, standalone]);

  // Prises de l'API, pour tout le monde (« Pour toi » est public ; « Abonnements » demande
  // un compte). Rechargé à la connexion / déconnexion : l'état « aimé, enregistré… » dépend du membre.
  const loadedRef = useRef<Set<string>>(new Set());
  // Page suivante de chaque onglet (null = fin), erreur de chargement, et relance manuelle.
  const [cursors, setCursors] = useState<Record<FeedTab, string | null>>({ forYou: null, following: null });
  const [loadFailed, setLoadFailed] = useState<Record<FeedTab, boolean>>({ forYou: false, following: false });
  const [reload, setReload] = useState(0);
  const loadingMore = useRef(false);
  useEffect(() => {
    if (standalone || (tab === 'following' && !member)) return;
    const key = `${tab}:${member}:${reload}`;
    if (loadedRef.current.has(key)) return;
    loadedRef.current.add(key);
    loadFeed(tab).then((res) => {
      if (!res.ok) {
        // Session expirée : la page repasse en mode visiteur.
        if (res.code === 'AUTH') notifySessionChange();
        // Panne réseau ou API : un vrai message d'erreur, pas un feed « vide ».
        else setLoadFailed((f) => ({ ...f, [tab]: true }));
        setLists((l) => ({ ...l, [tab]: l[tab] ?? [] }));
        return;
      }
      setLoadFailed((f) => ({ ...f, [tab]: false }));
      setLists((l) => ({ ...l, [tab]: res.data.items }));
      setCursors((c) => ({ ...c, [tab]: res.data.nextCursor }));
      setActive(0);
      scrollerRef.current?.scrollTo({ top: 0 });
    });
  }, [member, tab, standalone, reload]);

  const retry = () => {
    setLoadFailed((f) => ({ ...f, [tab]: false }));
    setLists((l) => ({ ...l, [tab]: null }));
    setReload((r) => r + 1);
  };

  // Page suivante quand on approche de la fin (3 prises avant).
  const nextCursor = cursors[tab];
  useEffect(() => {
    if (standalone || !nextCursor || loadingMore.current || active < posts.length - 3) return;
    loadingMore.current = true;
    const forTab = tab;
    loadFeed(forTab, nextCursor)
      .then((res) => {
        if (!res.ok) return;
        setLists((l) => {
          const known = new Set((l[forTab] ?? []).map((p) => p.id));
          return { ...l, [forTab]: [...(l[forTab] ?? []), ...res.data.items.filter((p) => !known.has(p.id))] };
        });
        setCursors((c) => ({ ...c, [forTab]: res.data.nextCursor }));
      })
      .finally(() => {
        loadingMore.current = false;
      });
  }, [active, posts.length, nextCursor, tab, standalone]);

  const changeTab = (next: FeedTab) => {
    setTab(next);
    setActive(0);
  };

  // Le post visible à plus de 60 % est celui qui joue.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const i = posts.findIndex((p) => p.id === (entry.target as HTMLElement).dataset.post);
          if (i >= 0) setActive(i);
        }
      },
      { root: scroller, threshold: 0.6 },
    );
    scroller.querySelectorAll('[data-post]').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [posts]);

  // Clavier (grand écran) : flèches haut / bas pour passer d'un post à l'autre.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (account || commentsFor) return;
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      e.preventDefault();
      scroller.scrollBy({ top: (e.key === 'ArrowDown' ? 1 : -1) * scroller.clientHeight, behavior: 'smooth' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [account, commentsFor]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  /** Modifie un post dans toutes les listes (il peut être dans les deux onglets). */
  const updatePosts = useCallback((match: (p: FeedPost) => boolean, change: (p: FeedPost) => FeedPost) => {
    setLists((l) => ({
      forYou: l.forYou?.map((p) => (match(p) ? change(p) : p)) ?? null,
      following: l.following?.map((p) => (match(p) ? change(p) : p)) ?? null,
    }));
  }, []);

  /** Échec côté API : on annule le changement affiché et on explique. */
  const failed = useCallback((res: ActionResult, undo: () => void) => {
    if (res.ok) return;
    undo();
    if (res.code === 'AUTH') {
      notifySessionChange();
      setAccount('like');
    }
    else setToast(res.message);
  }, []);

  const onAction = useCallback(
    (post: FeedPost, action: PostAction) => {
      if (!member) {
        setAccount(action === 'likeOn' ? 'like' : action);
        return;
      }

      if (action === 'follow') {
        const set = (on: boolean) =>
          updatePosts(
            (p) => p.author.id === post.author.id,
            (p) => ({ ...p, viewer: { ...p.viewer, isFollowingAuthor: on } }),
          );
        set(true);
        setFollow(post.author.id, true).then((res) => failed(res, () => set(false)));
        return;
      }

      const kind = action === 'likeOn' ? 'like' : action;
      const { flag, count } = TOGGLES[kind];
      const on = action === 'likeOn' ? true : !post.viewer[flag];
      if (on === post.viewer[flag]) return; // double tap sur une prise déjà aimée
      const set = (value: boolean) =>
        updatePosts(
          (p) => p.id === post.id,
          (p) =>
            p.viewer[flag] === value
              ? p
              : { ...p, [count]: Math.max(0, p[count] + (value ? 1 : -1)), viewer: { ...p.viewer, [flag]: value } },
        );
      set(on);
      setPostState(post.id, kind, on).then((res) => failed(res, () => set(!on)));
    },
    [member, updatePosts, failed],
  );

  const onShare = useCallback(
    async (post: FeedPost) => {
      const url = `${SITE.url}/p/${post.id}`;
      try {
        if (navigator.share) await navigator.share({ title: `${post.title} · VHOA`, url });
        else {
          await navigator.clipboard.writeText(url);
          setToast('Lien copié');
        }
      } catch {
        return; // Partage annulé par l'utilisateur.
      }
      if (member) {
        countShare(post.id).then((res) => {
          if (res.ok) updatePosts((p) => p.id === post.id, (p) => ({ ...p, shares: p.shares + 1 }));
        });
      }
    },
    [member, updatePosts],
  );

  const openComments = useCallback(
    (post: FeedPost) => {
      setCommentsFor(post);
      setDraft('');
      // Commentaires lisibles par tous ; écrire demande un compte.
      setComments(null);
      loadComments(post.id).then((res) => {
        if (res.ok) setComments(res.data);
        else {
          setComments([]);
          setToast(res.message);
        }
      });
    },
    [],
  );

  const toggleCommentLike = (c: FeedComment) => {
    if (!member) {
      setCommentsFor(null);
      setAccount('like');
      return;
    }
    const set = (on: boolean) =>
      setComments((list) =>
        list?.map((x) => (x.id === c.id ? { ...x, isLiked: on, likes: Math.max(0, x.likes + (on ? 1 : -1)) } : x)) ??
        null,
      );
    const on = !c.isLiked;
    set(on);
    setCommentLike(c.id, on).then((res) => failed(res, () => set(!on)));
  };

  const sendComment = (e: FormEvent) => {
    e.preventDefault();
    const post = commentsFor;
    const text = draft.trim();
    if (!post || !text || !me) return;
    setDraft('');
    const added = (c: FeedComment) => {
      setComments((list) => [c, ...(list ?? [])]);
      updatePosts((p) => p.id === post.id, (p) => ({ ...p, comments: p.comments + 1 }));
    };
    addComment(post.id, text).then((res) => {
      if (res.ok) added(res.data);
      else {
        setDraft(text);
        failed(res, () => {});
      }
    });
  };

  /** Bloquer l'auteur : ses prises disparaissent du feed (et l'API ne les montrera plus). */
  const blockAuthor = (post: FeedPost) => {
    setMenuFor(null);
    if (!member) return setAccount('follow');
    const hide = () =>
      setLists((l) => ({
        forYou: l.forYou?.filter((p) => p.author.id !== post.author.id) ?? null,
        following: l.following?.filter((p) => p.author.id !== post.author.id) ?? null,
      }));
    setBlock(post.author.id, true).then((res) => {
      if (!res.ok) return setToast(res.message);
      hide();
      setToast(`@${post.author.username} est bloqué.`);
    });
  };

  const closeAccount = useCallback(() => setAccount(null), []);
  const closeComments = useCallback(() => setCommentsFor(null), []);

  // Onglet Abonnements : visiteur, chargement, vide.
  let followingState: React.ReactNode = null;
  // « Pour toi » : chargement, ou aucune prise publiée pour l'instant.
  // Erreur de chargement (réseau, API) : message clair et bouton « Réessayer ».
  if (!standalone && loadFailed[tab] && (lists[tab]?.length ?? 0) === 0) {
    followingState = (
      <CenterCard
        title="Impossible de charger les prises."
        text={
          typeof navigator !== 'undefined' && !navigator.onLine
            ? 'Tu es hors connexion. Vérifie ton réseau puis réessaie.'
            : 'Un souci de notre côté ou de ta connexion. Réessaie dans un instant.'
        }>
        <button
          type="button"
          onClick={retry}
          className="inline-flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
          Réessayer
        </button>
      </CenterCard>
    );
  } else if (tab === 'forYou' && !standalone) {
    if (lists.forYou === null) {
      followingState = <CenterCard title="Chargement…" text="On récupère les dernières prises." />;
    } else if (lists.forYou.length === 0) {
      followingState = (
        <CenterCard title="Aucune prise pour l’instant." text="Le feed se remplit à chaque prise publiée. Lance-toi : la première, c’est la tienne.">
          <Link
            href={CREATE_HREF}
            className="inline-flex h-14 w-full items-center justify-center gap-2.5 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
            <VoiceWaveIcon size={20} />
            Prendre la parole
          </Link>
        </CenterCard>
      );
    }
  }
  if (tab === 'following' && !followingState) {
    if (!member) {
      followingState = (
        <CenterCard title="Tes orateurs préférés, ici." text="Crée ton compte pour suivre ceux qui te convainquent.">
          <AccountButtons />
        </CenterCard>
      );
    } else if (lists.following === null) {
      followingState = <CenterCard title="Chargement…" text="On récupère les prises de tes abonnements." />;
    } else if (lists.following.length === 0) {
      followingState = (
        <CenterCard title="Rien pour l’instant." text="Abonne-toi aux orateurs qui te convainquent : leurs prises arriveront ici.">
          <button
            type="button"
            onClick={() => changeTab('forYou')}
            className="inline-flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
            Découvrir « Pour toi »
          </button>
        </CenterCard>
      );
    }
  }

  return (
    // Pas de `fixed` ici : il enfermerait les panneaux sous la barre d’onglets (contexte d’empilement).
    // Hauteur dynamique (dvh) : suit l'écran réel quand le navigateur masque ses barres (Safari,
    // navigateurs intégrés d'Instagram ou TikTok). Chaque prise prend toute cette hauteur (h-full).
    <div className="relative h-dvh overflow-hidden bg-canvas">
      {standalone ? <StandaloneHeader /> : <FeedHeader tab={tab} onTabChange={changeTab} />}

      {followingState ?? (
        <div
          key={tab}
          ref={scrollerRef}
          className="no-scrollbar h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain">
          {posts.map((post, i) => (
            <FeedPostView
              key={post.id}
              post={post}
              active={i === active && !account && !commentsFor}
              near={Math.abs(i - active) <= 1}
              onAction={onAction}
              onOpenComments={openComments}
              onShare={onShare}
              onOpenMenu={setMenuFor}
            />
          ))}
          <FeedEnd standalone={standalone} />
        </div>
      )}

      {/* Invitation à créer un compte. */}
      <Sheet open={account !== null} onClose={closeAccount} title="Crée ton compte">
        <div className="px-6 pb-8 pt-2 text-center">
          <h2 className="text-[24px] font-bold tracking-[-0.03em]">{account ? ACCOUNT_COPY[account] : ''}</h2>
          <p className="mt-2 text-[15px] text-white/60">Crée ton compte en 30 secondes, c’est gratuit.</p>
          <div className="mt-7">
            <AccountButtons />
          </div>
        </div>
      </Sheet>

      {/* Commentaires : lisibles par tous, il faut un compte pour écrire. */}
      <Sheet open={commentsFor !== null} onClose={closeComments} title="Commentaires">
        <p className="px-6 pb-3 text-center text-[14px] font-semibold text-white/80">
          {commentsFor ? `${formatCount(commentsFor.comments)} commentaires` : ''}
        </p>
        <ul className="min-h-24 flex-1 overflow-y-auto px-5">
          {comments === null && <li className="py-8 text-center text-[14px] text-white/45">Chargement…</li>}
          {comments?.length === 0 && (
            <li className="py-8 text-center text-[14px] text-white/45">Sois le premier à réagir.</li>
          )}
          {comments?.map((c) => (
            <li key={c.id} className="flex gap-3 border-t border-white/[0.06] py-4 first:border-0">
              {c.author.avatarUrl || c.author.avatarEffect ? (
                <UserAvatar
                  user={{ username: c.author.username, avatarUrl: c.author.avatarUrl ?? null, avatarEffect: c.author.avatarEffect }}
                  size={36}
                />
              ) : (
                <span
                  aria-hidden
                  className="grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-bold text-white"
                  style={{ background: `linear-gradient(135deg, ${c.author.color}, #1F66D1)` }}>
                  {c.author.username[0].toUpperCase()}
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] text-white/50">
                  <span className="font-semibold text-white/80">@{c.author.username}</span> · {c.ago}
                </p>
                <p className="mt-0.5 break-words text-[15px] leading-snug text-white/90">{c.text}</p>
                {c.author.id !== me?.id && (
                  <button
                    type="button"
                    onClick={() => {
                      if (!member) {
                        setCommentsFor(null);
                        return setAccount('comment');
                      }
                      setReportTarget({ type: 'comment', id: c.id });
                    }}
                    className="mt-1 text-[12px] font-medium text-white/35 transition-colors hover:text-white/70">
                    Signaler
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => toggleCommentLike(c)}
                aria-label={`${c.isLiked ? 'Retirer le j’aime' : 'Aimer le commentaire'}, ${c.likes}`}
                aria-pressed={c.isLiked}
                className={`flex flex-col items-center gap-0.5 self-start pt-1 transition-colors ${
                  c.isLiked ? 'text-[#FF4D6D]' : 'text-white/50 hover:text-white'
                }`}>
                <HeartIcon size={16} filled={c.isLiked} />
                <span className="text-[11px] font-semibold">{c.likes}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="border-t border-white/[0.06] p-4">
          {member ? (
            <form onSubmit={sendComment} className="flex items-center gap-2">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                maxLength={500}
                placeholder="Ajouter un commentaire…"
                aria-label="Ton commentaire"
                className="h-12 min-w-0 flex-1 rounded-full bg-white/[0.05] px-5 text-[15px] text-white placeholder:text-white/40 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Publier le commentaire"
                className="grid size-12 shrink-0 place-items-center rounded-full bg-accent text-white transition-[filter,opacity] hover:brightness-110 disabled:opacity-40">
                <ArrowIcon size={18} />
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCommentsFor(null);
                setAccount('comment');
              }}
              className="flex h-12 w-full items-center rounded-full bg-white/[0.05] px-5 text-left text-[15px] text-white/45 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]">
              Ajouter un commentaire…
            </button>
          )}
        </div>
      </Sheet>

      {/* Menu « … » d'une prise. */}
      <Sheet open={menuFor !== null} onClose={() => setMenuFor(null)} title="Options">
        {menuFor && (
          <div className="flex flex-col gap-1.5 px-4 pb-6 pt-1">
            {[
              {
                label: 'Partager',
                Icon: ShareIcon,
                onClick: () => {
                  const post = menuFor;
                  setMenuFor(null);
                  onShare(post);
                },
              },
              ...(menuFor.author.id !== me?.id
                ? [
                    {
                      label: 'Signaler cette prise',
                      Icon: ShieldIcon,
                      onClick: () => {
                        const post = menuFor;
                        setMenuFor(null);
                        if (!member) return setAccount('comment');
                        setReportTarget({ type: 'post', id: post.id });
                      },
                    },
                    {
                      label: `Bloquer @${menuFor.author.username}`,
                      Icon: ShieldIcon,
                      danger: true,
                      onClick: () => blockAuthor(menuFor),
                    },
                  ]
                : []),
            ].map((o) => (
              <button
                key={o.label}
                type="button"
                onClick={o.onClick}
                className={`flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-[15px] font-semibold transition-colors hover:bg-white/[0.06] ${
                  'danger' in o && o.danger ? 'text-[#FF8FA3]' : 'text-white'
                }`}>
                <o.Icon size={20} />
                {o.label}
              </button>
            ))}
          </div>
        )}
      </Sheet>

      <ReportSheet
        target={reportTarget}
        onClose={() => setReportTarget(null)}
        onDone={(message, needsAccount) => (needsAccount ? setAccount('comment') : setToast(message))}
      />

      {toast && (
        <p
          role="status"
          className="rise glass fixed left-1/2 top-20 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-[14px] font-semibold text-white">
          {toast}
        </p>
      )}
    </div>
  );
}
