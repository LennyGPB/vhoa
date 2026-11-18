'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, useTransition, type ComponentType } from 'react';

import { deleteAccount, logout, logoutEverywhere } from '@/app/actions/auth';
import {
  deletePost,
  loadProfile,
  loadTiles,
  publishDraft,
  setAvatarEffect,
  type Badge,
  type PostTile,
  type Profile,
  type ProfileTab,
} from '@/app/actions/me';
import { formatCount } from '@/lib/feed';
import { notifySessionChange } from '@/lib/use-session';

import { UserAvatar } from './AccountNav';
import { BlobBadge } from './BlobBadge';
import { AvatarEffect, EFFECTS, type EffectId } from './AvatarEffect';
import { BlobBridge } from './BlobBridge';
import { Sheet } from './feed/Sheet';
import { PaywallSheet } from './premium/PaywallSheet';
import {
  BookmarkIcon,
  CheckCircleIcon,
  FlagIcon,
  FlameIcon,
  GearIcon,
  HeartIcon,
  LogoutIcon,
  MicIcon,
  PersonIcon,
  RocketIcon,
  ShieldIcon,
  SparkIcon,
  StepsIcon,
  TrashIcon,
  TrophyIcon,
} from './icons';
import { LiquidTabs } from './LiquidTabs';

export const BADGE_ICON: Record<string, ComponentType<{ size?: number }>> = {
  first: StepsIcon,
  streak4: FlameIcon,
  theme: FlagIcon,
  podium: TrophyIcon,
  convince: CheckCircleIcon,
  coach: SparkIcon,
  streak12: RocketIcon,
};

const TABS: { key: ProfileTab; label: string }[] = [
  { key: 'posts', label: 'Prises' },
  { key: 'drafts', label: 'Brouillons' },
  { key: 'saved', label: 'Enregistrés' },
];

/** Statut d'une prise non publiée (onglet Brouillons). */
const STATUS: Record<string, { label: string; text: string }> = {
  draft: { label: 'Brouillon', text: 'Gardé pour plus tard. Publie-le quand tu veux.' },
  private: { label: 'Coach IA', text: 'Prise privée : seul ton coach IA l’écoute.' },
  processing: { label: 'Traitement…', text: 'Ta prise de parole est en cours de préparation. Reviens dans un instant.' },
  uploading: { label: 'Traitement…', text: 'Ta prise de parole est en cours de préparation. Reviens dans un instant.' },
  failed: { label: 'Échec', text: 'Ce fichier n’a pas pu être traité.' },
  rejected: { label: 'Refusée', text: 'Refusée par la modération.' },
  removed: { label: 'Refusée', text: 'Refusée par la modération.' },
};

const EMPTY: Record<ProfileTab, { title: string; text: string }> = {
  posts: { title: 'Ta première prise de parole t’attend', text: 'Lance-toi : 1 minute suffit.' },
  drafts: { title: 'Aucun brouillon', text: 'Tes brouillons et tes prises pour le coach IA restent privés.' },
  saved: { title: 'Rien d’enregistré', text: 'Enregistre des posts depuis le feed pour les retrouver ici.' },
};

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-1 flex-col items-center py-3">
      <span className="text-[19px] font-bold tabular-nums">{formatCount(value)}</span>
      <span className="text-[12px] text-white/50">{label}</span>
    </div>
  );
}

/** Carte « série » : semaines d'affilée avec au moins une prise. */
function StreakCard({ p }: { p: Profile }) {
  const s = p.streak;
  return (
    <article className="glass-solid flex h-[208px] min-w-0 flex-1 flex-col rounded-[28px] p-4">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/45">
        <FlameIcon size={14} className="text-accent" />
        Série
      </span>
      <p className="mt-3 text-[38px] font-black leading-none tracking-[-0.04em]">{s.current}</p>
      <p className="text-[13px] text-white/55">{s.current > 1 ? 'semaines' : 'semaine'}</p>
      {/* 8 dernières semaines : bleu = postée, bleu clair = gelée, gris = manquée. */}
      <div aria-label="8 dernières semaines" className="mt-auto flex gap-1">
        {s.history.map((w, i) => (
          <span
            key={i}
            className={`h-2 flex-1 rounded-full ${w === 'posted' ? 'bg-accent' : w === 'frozen' ? 'bg-azure/50' : 'bg-white/10'}`}
          />
        ))}
      </div>
      <p className="mt-2.5 truncate text-[12px] font-semibold text-azure">
        {s.postedThisWeek ? 'Semaine validée ✓' : 'À faire avant dimanche'}
      </p>
    </article>
  );
}

/** Carte « coach » : analyses utilisées ce mois-ci. */
function CoachCard({ p }: { p: Profile }) {
  const q = p.aiQuota;
  const total = q.total ?? 1;
  const ratio = Math.min(1, q.used / Math.max(1, total));
  return (
    <article className="glass-solid flex h-[208px] min-w-0 flex-1 flex-col rounded-[28px] p-4">
      <span className="flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-white/45">
        <SparkIcon size={14} className="text-accent" />
        Coach IA
      </span>
      <p className="mt-3 text-[38px] font-black leading-none tracking-[-0.04em]">
        {q.used}/{total}
      </p>
      <p className="text-[13px] text-white/55">{total > 1 ? 'analyses ce mois-ci' : 'analyse ce mois-ci'}</p>
      <div className="mt-auto h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-strong to-azure" style={{ width: `${ratio * 100}%` }} />
      </div>
      {q.isPremium ? (
        <Link href="/profil/progression" className="mt-2.5 truncate text-[12px] font-semibold text-azure hover:underline">
          Ma progression →
        </Link>
      ) : (
        <Link href="/premium" className="mt-2.5 truncate text-[12px] font-semibold text-azure hover:underline">
          60 par mois avec Premium →
        </Link>
      )}
    </article>
  );
}

export function Tile({ tile, onOpen }: { tile: PostTile; onOpen?: () => void }) {
  const status = tile.status && tile.status !== 'published' ? STATUS[tile.status] : null;
  const inner = (
    <>
      {tile.type === 'video' && tile.thumbnailUrl ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniature distante (R2)
        <img src={tile.thumbnailUrl} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <span className="absolute inset-0 grid place-items-center bg-[linear-gradient(180deg,#0a162c,#174a8c_60%,#050a14)] text-white/80">
          <MicIcon size={26} />
        </span>
      )}
      <span aria-hidden className="absolute inset-0 bg-[linear-gradient(transparent_55%,rgb(0_0_0/0.65))]" />
      {status && (
        <span className="absolute left-1.5 top-1.5 rounded-full bg-black/55 px-2 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
          {status.label}
        </span>
      )}
      <span className="absolute bottom-1.5 left-2 flex items-center gap-1 text-[11px] font-semibold text-white">
        <HeartIcon size={12} />
        {formatCount(tile.likes)}
      </span>
      <span className="sr-only">{tile.title || 'Prise sans titre'}</span>
    </>
  );
  const cls = 'relative block aspect-[9/16] overflow-hidden rounded-2xl bg-white/[0.04]';
  return onOpen ? (
    <button type="button" onClick={onOpen} className={cls}>
      {inner}
    </button>
  ) : (
    <Link href={`/p/${tile.id}`} className={cls}>
      {inner}
    </Link>
  );
}

/** Menu « Paramètres » : roue crantée qui ouvre un menu déroulant en verre. */
function SettingsMenu({
  onLogout,
  onLogoutAll,
  onDelete,
  disabled,
  isAdmin = false,
  isPremium = false,
}: {
  onLogout: () => void;
  onLogoutAll: () => void;
  onDelete: () => void;
  disabled: boolean;
  /** Affiche l'accès au back-office. */
  isAdmin?: boolean;
  isPremium?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Fermeture : clic en dehors ou Échap.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const item =
    'flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left text-[15px] font-semibold transition-colors hover:bg-white/[0.06] disabled:opacity-50';

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Paramètres"
        aria-expanded={open}
        aria-haspopup="menu"
        className={`glass grid size-11 place-items-center rounded-full transition-colors ${open ? 'text-accent' : 'text-white'}`}>
        <GearIcon size={20} />
      </button>
      <div
        role="menu"
        aria-label="Paramètres"
        inert={!open}
        className={`absolute right-0 top-[calc(100%+8px)] w-60 origin-top-right rounded-[22px] bg-[#1b1c21]/95 p-1.5 shadow-[0_24px_60px_-20px_rgb(0_0_0/0.9),inset_0_0_0_1px_rgb(255_255_255/0.08)] backdrop-blur-xl transition-[opacity,transform] duration-200 ${
          open ? 'scale-100 opacity-100' : 'pointer-events-none scale-95 opacity-0'
        }`}>
        <Link href="/profil/modifier" role="menuitem" onClick={() => setOpen(false)} className={`${item} text-white`}>
          <PersonIcon size={18} className="text-white/60" />
          Modifier le profil
        </Link>
        <Link
          href={isPremium ? '/profil/abonnement' : '/premium'}
          role="menuitem"
          onClick={() => setOpen(false)}
          className={`${item} text-white`}>
          <SparkIcon size={18} className="text-accent" />
          {isPremium ? 'Mon abonnement' : 'Passer Premium'}
        </Link>
        <Link href="/profil/bloques" role="menuitem" onClick={() => setOpen(false)} className={`${item} text-white`}>
          <ShieldIcon size={18} className="text-white/60" />
          Comptes bloqués
        </Link>
        {isAdmin && (
          <Link href="/admin" role="menuitem" onClick={() => setOpen(false)} className={`${item} text-azure`}>
            <GearIcon size={18} />
            Back-office
          </Link>
        )}
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => {
            setOpen(false);
            onLogout();
          }}
          className={`${item} text-white`}>
          <LogoutIcon size={18} className="text-white/60" />
          Se déconnecter
        </button>
        <button
          type="button"
          role="menuitem"
          disabled={disabled}
          onClick={() => {
            setOpen(false);
            onLogoutAll();
          }}
          className={`${item} text-white`}>
          <LogoutIcon size={18} className="text-white/60" />
          Déconnecter tous mes appareils
        </button>
        <span aria-hidden className="mx-3 my-1 block h-px bg-white/[0.07]" />
        <button
          type="button"
          role="menuitem"
          onClick={() => {
            setOpen(false);
            onDelete();
          }}
          className={`${item} text-[#FF8FA3]`}>
          <TrashIcon size={18} />
          Supprimer mon compte
        </button>
      </div>
    </div>
  );
}

/**
 * Effet de profil : « Aucun » + les effets, chacun en aperçu sur la photo du membre.
 * Premium / admin : un appui applique l'effet. Sinon : un appui ouvre la fenêtre Premium (paywall).
 */
function EffectPicker({
  profile,
  onPick,
  onLocked,
  pending,
}: {
  profile: Profile;
  onPick: (effect: EffectId | null) => void;
  onLocked: (effect: EffectId) => void;
  pending: boolean;
}) {
  const unlocked = profile.canUseEffects;
  const current = profile.avatarEffect;
  const face = { username: profile.username, avatarUrl: profile.avatarUrl || null };
  const tile = (id: EffectId | null, name: string) => {
    const on = current === id;
    return (
      <li key={id ?? 'none'} className="w-[84px] shrink-0 snap-start">
        <button
          type="button"
          disabled={pending || (!unlocked && !id)}
          aria-pressed={unlocked ? on : undefined}
          aria-label={unlocked ? undefined : `${name} : réservé à Premium`}
          onClick={() => (unlocked ? onPick(id) : id && onLocked(id))}
          className={`relative flex w-full flex-col items-center gap-2 rounded-[22px] px-1 pb-2.5 pt-4 transition-[box-shadow,background-color] ${
            on ? 'bg-accent/10 shadow-[inset_0_0_0_1.5px_var(--color-accent)]' : 'bg-white/[0.04] hover:bg-white/[0.07]'
          } ${unlocked || id ? '' : 'opacity-45'}`}>
          {!unlocked && id && (
            <span aria-hidden className="absolute right-1.5 top-1.5 grid size-5 place-items-center rounded-full bg-accent text-white shadow-[0_4px_12px_-2px_var(--color-accent)]">
              <SparkIcon size={11} />
            </span>
          )}
          <span className="grid h-14 place-items-center">
            {id ? (
              <AvatarEffect effect={id} size={40}>
                <UserAvatar user={face} size={40} noEffect />
              </AvatarEffect>
            ) : (
              <UserAvatar user={face} size={40} noEffect />
            )}
          </span>
          <span className={`text-center text-[11px] font-semibold leading-tight ${on ? 'text-azure' : 'text-white/75'}`}>{name}</span>
        </button>
      </li>
    );
  };
  return (
    <section aria-label="Effet de profil">
      <h2 className="mb-3 flex items-baseline justify-between px-1">
        <span className="text-[18px] font-bold">Effet de profil</span>
        <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-semibold text-azure">Premium</span>
      </h2>
      {!unlocked && (
        <p className="mb-3 px-1 text-[13px] leading-snug text-white/55">
          Un effet autour de ta photo, visible partout : feed, profil, commentaires. Touche-en un pour l’essayer sur ta
          photo.
        </p>
      )}
      <ul className="no-scrollbar -mx-4 flex snap-x scroll-px-4 gap-2 overflow-x-auto px-4 pb-1">
        {tile(null, 'Aucun')}
        {EFFECTS.map((e) => tile(e.id, e.name))}
      </ul>
    </section>
  );
}

/** Page profil du membre connecté (même organisation que l'app). */
export function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null | 'error'>(null);
  const [tab, setTab] = useState<ProfileTab>('posts');
  const [tiles, setTiles] = useState<Partial<Record<ProfileTab, PostTile[] | 'error'>>>({});
  const [badge, setBadge] = useState<Badge | null>(null);
  const [draft, setDraft] = useState<PostTile | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [paywall, setPaywall] = useState<EffectId | null>(null);
  const [logoutAll, setLogoutAll] = useState<{ error: string | null } | null>(null);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<{ password: string; confirm: string; error: string | null } | null>(null);
  // Compte email : mot de passe exigé par l'API. Compte Google / Apple : on fait écrire le pseudo.
  const needsPassword = profile !== null && profile !== 'error' && profile.providers.includes('password');

  const expired = () => {
    notifySessionChange();
    router.replace('/connexion');
  };

  useEffect(() => {
    loadProfile().then((res) => {
      if (!res.ok && res.code === 'AUTH') return expired();
      setProfile(res.ok ? res.data : 'error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique à l'arrivée
  }, []);

  const userId = profile && profile !== 'error' ? profile.id : null;
  useEffect(() => {
    if (!userId || tiles[tab] !== undefined) return;
    loadTiles(tab, userId).then((res) => setTiles((t) => ({ ...t, [tab]: res.ok ? res.data : 'error' })));
  }, [tab, userId, tiles]);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  const onPublish = (t: PostTile) =>
    startTransition(async () => {
      const res = await publishDraft(t.id);
      if (!res.ok) return setToast(res.message);
      setDraft(null);
      setTiles({});
      setToast('Publié ! Ta prise est en cours de vérification.');
    });

  const onDelete = (t: PostTile) =>
    startTransition(async () => {
      const res = await deletePost(t.id);
      setConfirmDelete(false);
      if (!res.ok) return setToast(res.message);
      setDraft(null);
      setTiles((all) =>
        Object.fromEntries(
          Object.entries(all).map(([k, v]) => [k, Array.isArray(v) ? v.filter((x) => x.id !== t.id) : v]),
        ),
      );
      setToast('Prise supprimée.');
    });

  if (profile === 'error') {
    return (
      <div className="grid min-h-svh place-items-center px-6 text-center text-white/60">
        Impossible de charger ton profil. Réessaie plus tard.
      </div>
    );
  }

  const list = tiles[tab];
  const unlocked = profile ? profile.badges.filter((b) => b.unlocked).length : 0;

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -left-48 -top-48 size-[600px] opacity-60" />
      </div>

      <main className="relative mx-auto flex max-w-lg flex-col gap-7 px-4 pb-40 pt-[max(env(safe-area-inset-top),24px)]">
        {/* Paramètres, en haut à droite. */}
        {profile && (
          <div className="absolute right-4 top-[max(env(safe-area-inset-top),24px)] z-20">
            <SettingsMenu
              disabled={pending}
              onLogout={() =>
                startTransition(async () => {
                  await logout();
                  notifySessionChange();
                })
              }
              onLogoutAll={() => setLogoutAll({ error: null })}
              onDelete={() => setDeleting({ password: '', confirm: '', error: null })}
              isAdmin={profile.role === 'admin'}
              isPremium={profile.isPremium}
            />
          </div>
        )}

        {/* En-tête */}
        {profile ? (
          <header className="flex flex-col items-center text-center">
            <span className="rounded-full p-1 shadow-[0_0_0_2px_var(--color-accent),0_14px_44px_-10px_var(--color-accent)]">
              <UserAvatar user={{ username: profile.username, avatarUrl: profile.avatarUrl || null, avatarEffect: profile.avatarEffect }} size={92} />
            </span>
            <h1 className="mt-4 flex items-center gap-2 text-[24px] font-bold tracking-[-0.02em]">
              {profile.displayName}
              {profile.isPremium && (
                <span className="rounded-full bg-accent px-2 py-0.5 text-[11px] font-semibold text-white">Premium</span>
              )}
            </h1>
            <p className="text-[15px] text-white/50">@{profile.username}</p>
            {profile.bio && <p className="mt-3 max-w-xs text-[15px] leading-snug text-white/75">{profile.bio}</p>}
            <div className="glass mt-5 flex w-full divide-x divide-white/[0.07] rounded-[22px]">
              <Stat value={profile.postsCount} label="Prises" />
              <Stat value={profile.followers} label="Abonnés" />
              <Stat value={profile.following} label="Abonnements" />
            </div>
          </header>
        ) : (
          <div aria-label="Chargement" className="flex flex-col items-center gap-3">
            <span className="size-[100px] animate-pulse rounded-full bg-white/[0.06]" />
            <span className="h-6 w-40 animate-pulse rounded-full bg-white/[0.06]" />
            <span className="mt-3 h-[68px] w-full animate-pulse rounded-[22px] bg-white/[0.04]" />
          </div>
        )}

        {/* Série et coach, reliés par le pont liquide (D.A.). */}
        {profile && (
          <div className="flex items-center">
            <StreakCard p={profile} />
            <span className="-mx-px shrink-0">
              <BlobBridge orientation="horizontal" phase={0.6} />
            </span>
            <CoachCard p={profile} />
          </div>
        )}

        {/* Effet de profil (Premium / admin) */}
        {profile && (
          <EffectPicker
            profile={profile}
            pending={pending}
            onLocked={setPaywall}
            onPick={(effect) =>
              startTransition(async () => {
                const previous = profile.avatarEffect;
                setProfile({ ...profile, avatarEffect: effect });
                const res = await setAvatarEffect(effect);
                if (!res.ok) {
                  setProfile((p) => (p && p !== 'error' ? { ...p, avatarEffect: previous } : p));
                  return setToast(res.message);
                }
                notifySessionChange();
                setToast(effect ? 'Effet appliqué partout ✨' : 'Effet retiré.');
              })
            }
          />
        )}

        {/* Badges */}
        {profile && (
          <section aria-label="Badges">
            <h2 className="mb-3 flex items-baseline justify-between px-1">
              <span className="text-[18px] font-bold">Badges</span>
              <span className="text-[13px] text-white/45">
                {unlocked}/{profile.badges.length}
              </span>
            </h2>
            {/* Une seule ligne qui défile à l’horizontale, jusqu’aux bords de l’écran. */}
            <ul className="no-scrollbar -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-2 overflow-x-auto px-4 pb-1">
              {profile.badges.map((b, i) => {
                const Icon = BADGE_ICON[b.id] ?? TrophyIcon;
                return (
                  <li key={b.id} className="w-[76px] shrink-0 snap-start">
                    <button
                      type="button"
                      onClick={() => setBadge(b)}
                      className="flex w-full flex-col items-center gap-1.5">
                      {b.unlocked ? (
                        <BlobBadge size={56} seed={i * 1.3}>
                          <Icon size={22} />
                        </BlobBadge>
                      ) : (
                        <span className="grid size-14 place-items-center rounded-full bg-white/[0.05] text-white/25 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.06)]">
                          <Icon size={22} />
                        </span>
                      )}
                      <span className={`text-center text-[11px] font-semibold leading-tight ${b.unlocked ? 'text-white/85' : 'text-white/35'}`}>
                        {b.name}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        {/* Prises / Brouillons / Enregistrés */}
        {profile && (
          <section aria-label="Mes prises" className="flex flex-col gap-4">
            <LiquidTabs label="Mes prises" tabs={TABS} value={tab} onChange={setTab} />
            {list === undefined && (
              <div className="grid grid-cols-3 gap-2">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="aspect-[9/16] animate-pulse rounded-2xl bg-white/[0.04]" />
                ))}
              </div>
            )}
            {list === 'error' && <p className="py-10 text-center text-[14px] text-white/50">Impossible de charger.</p>}
            {Array.isArray(list) && list.length === 0 && (
              <div className="flex flex-col items-center py-10 text-center">
                <span className="grid size-14 place-items-center rounded-full bg-accent/15 text-accent">
                  {tab === 'saved' ? <BookmarkIcon size={24} /> : <MicIcon size={24} />}
                </span>
                <p className="mt-4 text-[17px] font-bold">{EMPTY[tab].title}</p>
                <p className="mt-1 text-[14px] text-white/55">{EMPTY[tab].text}</p>
                {tab === 'posts' && (
                  <Link
                    href="/creer"
                    className="mt-5 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
                    Prendre la parole
                  </Link>
                )}
              </div>
            )}
            {Array.isArray(list) && list.length > 0 && (
              <ul className="grid grid-cols-3 gap-2">
                {list.map((t) => (
                  <li key={t.id}>
                    <Tile tile={t} onOpen={tab === 'drafts' ? () => setDraft(t) : undefined} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

      </main>

      {/* Suppression du compte (définitive). */}
      <Sheet open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer mon compte">
        {deleting && profile && (
          <form
            className="px-6 pb-8 pt-2"
            onSubmit={(e) => {
              e.preventDefault();
              startTransition(async () => {
                const res = await deleteAccount(needsPassword ? { password: deleting.password } : {});
                if (!res.ok) return setDeleting((d) => d && { ...d, error: res.message });
                notifySessionChange();
                router.replace('/');
              });
            }}>
            <h2 className="text-center text-[22px] font-bold">Supprimer ton compte ?</h2>
            <p className="mt-2 text-center text-[14px] leading-relaxed text-white/60">
              Tes prises, commentaires, votes et abonnements seront effacés définitivement. Impossible de revenir en
              arrière.
            </p>
            {needsPassword ? (
              <input
                type="password"
                value={deleting.password}
                onChange={(e) => setDeleting({ ...deleting, password: e.target.value, error: null })}
                autoComplete="current-password"
                placeholder="Ton mot de passe"
                aria-label="Ton mot de passe"
                className="mt-6 h-13 w-full rounded-2xl bg-white/[0.05] px-4 text-[16px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_#FF4D6D]"
              />
            ) : (
              <label className="mt-6 block">
                <span className="text-[13px] text-white/60">
                  Pour confirmer, écris ton pseudo : <b className="text-white">{profile.username}</b>
                </span>
                <input
                  value={deleting.confirm}
                  onChange={(e) => setDeleting({ ...deleting, confirm: e.target.value, error: null })}
                  autoCapitalize="none"
                  spellCheck={false}
                  className="mt-2 h-13 w-full rounded-2xl bg-white/[0.05] px-4 text-[16px] text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_#FF4D6D]"
                />
              </label>
            )}
            {deleting.error && (
              <p role="alert" className="mt-3 rounded-2xl bg-[#FF4D6D]/10 px-4 py-3 text-[14px] font-medium text-[#FF8FA3]">
                {deleting.error}
              </p>
            )}
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeleting(null)}
                className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                Annuler
              </button>
              <button
                type="submit"
                disabled={
                  pending ||
                  (needsPassword ? !deleting.password : deleting.confirm.trim().toLowerCase() !== profile.username)
                }
                className="h-14 rounded-full bg-[#FF4D6D] text-[16px] font-semibold text-white transition-opacity disabled:opacity-40">
                {pending ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </form>
        )}
      </Sheet>

      {/* Détail d'un badge */}
      <Sheet open={badge !== null} onClose={() => setBadge(null)} title="Badge">
        {badge && (
          <div className="flex flex-col items-center px-6 pb-8 pt-2 text-center">
            {(() => {
              const Icon = BADGE_ICON[badge.id] ?? TrophyIcon;
              return badge.unlocked ? (
                <BlobBadge size={80} seed={2}>
                  <Icon size={32} />
                </BlobBadge>
              ) : (
                <span className="grid size-20 place-items-center rounded-full bg-white/[0.05] text-white/30">
                  <Icon size={32} />
                </span>
              );
            })()}
            <h2 className="mt-4 text-[22px] font-bold">{badge.name}</h2>
            <p className="mt-1 text-[15px] text-white/60">{badge.description}</p>
            <p className={`mt-4 text-[13px] font-semibold ${badge.unlocked ? 'text-azure' : 'text-white/40'}`}>
              {badge.unlocked ? 'Débloqué ✓' : 'Pas encore débloqué'}
            </p>
          </div>
        )}
      </Sheet>

      {/* Brouillon : publier ou supprimer */}
      <Sheet
        open={draft !== null}
        onClose={() => {
          setDraft(null);
          setConfirmDelete(false);
        }}
        title="Brouillon">
        {draft && (
          <div className="px-6 pb-8 pt-2 text-center">
            <h2 className="text-[20px] font-bold">{draft.title || 'Prise sans titre'}</h2>
            <p className="mt-2 text-[14px] text-white/60">{STATUS[draft.status ?? 'draft']?.text}</p>
            <div className="mt-6 flex flex-col gap-3">
              {draft.status === 'private' && !confirmDelete && (
                <Link
                  href={`/analyse/${draft.id}`}
                  className="inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
                  Voir l’analyse
                </Link>
              )}
              {draft.status === 'draft' && !confirmDelete && (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => onPublish(draft)}
                  className="h-14 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] disabled:opacity-60">
                  Publier
                </button>
              )}
              {confirmDelete ? (
                <>
                  <p className="text-[14px] text-white/70">Cette prise de parole sera définitivement supprimée.</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                      Annuler
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => onDelete(draft)}
                      className="h-14 rounded-full bg-[#FF4D6D] text-[16px] font-semibold text-white disabled:opacity-60">
                      Supprimer
                    </button>
                  </div>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="h-14 rounded-full text-[16px] font-semibold text-[#FF8FA3] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                  Supprimer
                </button>
              )}
            </div>
          </div>
        )}
      </Sheet>

      <Sheet open={logoutAll !== null} onClose={() => setLogoutAll(null)} title="Déconnecter tous mes appareils">
        <div className="flex flex-col gap-3 px-5 pb-6 pt-2">
          <h2 className="text-[20px] font-bold">Déconnecter tous tes appareils ?</h2>
          <p className="text-[15px] leading-snug text-white/65">
            Toutes tes sessions seront fermées : ce navigateur, ton téléphone et tout autre appareil. Utile si tu as
            perdu un appareil ou si tu penses que quelqu’un utilise ton compte. Tu devras te reconnecter.
          </p>
          {logoutAll?.error && (
            <p role="alert" className="text-[14px] font-medium text-[#FF6B81]">
              {logoutAll.error}
            </p>
          )}
          <button
            type="button"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                const res = await logoutEverywhere();
                // En cas de succès, la page part vers /connexion (redirection côté serveur).
                if (res && !res.ok) {
                  if (res.code === 'AUTH') return expired();
                  setLogoutAll({ error: res.message });
                }
                notifySessionChange();
              })
            }
            className="mt-2 h-13 rounded-full bg-accent text-[15px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-60">
            {pending ? 'Déconnexion…' : 'Tout déconnecter'}
          </button>
          <button
            type="button"
            onClick={() => setLogoutAll(null)}
            className="h-13 rounded-full bg-white/[0.08] text-[15px] font-semibold transition-colors hover:bg-white/[0.12]">
            Annuler
          </button>
        </div>
      </Sheet>

      {profile && !profile.canUseEffects && (
        <PaywallSheet
          effect={paywall}
          onClose={() => setPaywall(null)}
          face={{ username: profile.username, avatarUrl: profile.avatarUrl || null }}
        />
      )}

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
