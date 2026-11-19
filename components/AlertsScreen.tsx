'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState, type ComponentType, type ReactNode } from 'react';

import {
  loadNotifications,
  markAllRead,
  markRead,
  type AppNotification,
  type NotificationGroup,
  type NotificationType,
} from '@/app/actions/me';
import { ago } from '@/lib/feed';
import { notifySessionChange } from '@/lib/use-session';

import { UserAvatar } from './AccountNav';
import {
  BackIcon,
  BellIcon,
  CheckCircleIcon,
  CommentIcon,
  FlameIcon,
  HeartIcon,
  PersonAddIcon,
  RibbonIcon,
  ShieldIcon,
  SparkIcon,
  TrophyIcon,
} from './icons';
import { LiquidTabs } from './LiquidTabs';
import { PushCard } from './PushCard';

const GROUPS: { key: NotificationGroup; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'interactions', label: 'Interactions' },
  { key: 'themes', label: 'Défis' },
  { key: 'progress', label: 'Progression' },
];

/** Icône et couleur de chaque type (mêmes que l'app). */
const KIND: Record<NotificationType, { Icon: ComponentType<{ size?: number; filled?: boolean }>; color: string }> = {
  like: { Icon: HeartIcon, color: '#FF4D6D' },
  comment: { Icon: CommentIcon, color: '#4AA8FF' },
  follow: { Icon: PersonAddIcon, color: '#7C5CFF' },
  convinced: { Icon: CheckCircleIcon, color: '#22B07D' },
  themeNew: { Icon: FlameIcon, color: '#2F8FE8' },
  themeResult: { Icon: TrophyIcon, color: '#F5B83D' },
  badge: { Icon: RibbonIcon, color: '#E14D8A' },
  streakRisk: { Icon: FlameIcon, color: '#2F8FE8' },
  analysisReady: { Icon: SparkIcon, color: '#2F8FE8' },
  moderation: { Icon: ShieldIcon, color: '#8A8A90' },
};

const quote = (s?: string) => (s ? `« ${s} »` : '');
const ordinal = (n: number) => (n === 1 ? '1er' : `${n}e`);

/** « @lina », « @lina et @tom », « @lina et 12 autres ». */
function Who({ n }: { n: AppNotification }) {
  const [a, b] = n.actors;
  if (!a) return <b>Quelqu’un</b>;
  const total = n.actorCount ?? n.actors.length;
  if (total <= 1) return <b>@{a.username}</b>;
  if (total === 2 && b)
    return (
      <>
        <b>@{a.username}</b> et <b>@{b.username}</b>
      </>
    );
  return (
    <>
      <b>@{a.username}</b> et {total - 1} autres
    </>
  );
}

/** Phrase de l'alerte (mêmes formulations que l'app). */
function sentence(n: AppNotification): ReactNode {
  const many = (n.actorCount ?? n.actors.length) > 1;
  const post = n.post ? ` ${quote(n.post.title)}` : '';
  switch (n.type) {
    case 'like':
      return (
        <>
          <Who n={n} /> {many ? 'ont aimé' : 'a aimé'} ta prise{post}
        </>
      );
    case 'comment':
      return (
        <>
          <Who n={n} /> a commenté : {quote(n.text)}
        </>
      );
    case 'follow':
      return (
        <>
          <Who n={n} /> {many ? 'se sont abonnés' : 's’est abonné'} à toi
        </>
      );
    case 'convinced':
      return (
        <>
          <Who n={n} /> {many ? 'ont voté' : 'a voté'} « Convaincu » pour ta prise{post}
        </>
      );
    case 'themeNew':
      return (
        <>
          <b>Nouveau défi</b> : {quote(n.text)}
        </>
      );
    case 'themeResult':
      return n.rank ? (
        <>
          Tu termines <b>{ordinal(n.rank)}</b> du défi {quote(n.text)} 🏆
        </>
      ) : (
        <>
          Résultats du défi {quote(n.text)}
        </>
      );
    case 'badge':
      return (
        <>
          Badge débloqué : <b>{n.text}</b>
        </>
      );
    case 'analysisReady':
      return (
        <>
          <b>Ton analyse est prête</b>
          {post && ` pour${post}`}
        </>
      );
    default:
      return n.text;
  }
}

/** Où mène l'alerte. */
function target(n: AppNotification) {
  if (n.type === 'themeNew') return '/creer';
  if (n.type === 'analysisReady' && n.post) return `/analyse/${n.post.id}`;
  if (n.type === 'badge' || n.type === 'analysisReady' || n.type === 'streakRisk') return '/profil';
  if (n.type === 'follow' && n.actors[0]) return `/u/${n.actors[0].id}`;
  if (n.post) return `/p/${n.post.id}`;
  return null;
}

function section(iso: string, now: number) {
  const d = new Date(iso);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  if (d >= today) return 'Aujourd’hui';
  if (now - d.getTime() < 7 * 86_400_000) return 'Cette semaine';
  return 'Plus tôt';
}

function Row({ n, onOpen }: { n: AppNotification; onOpen: (n: AppNotification) => void }) {
  const { Icon, color } = KIND[n.type];
  const actor = n.actors[0];
  return (
    <li>
      <button
        type="button"
        onClick={() => onOpen(n)}
        className={`flex w-full items-center gap-3 rounded-3xl px-3 py-3 text-left transition-colors hover:bg-white/[0.04] ${
          n.read ? '' : 'bg-accent/[0.06]'
        }`}>
        <span className="relative shrink-0">
          {actor ? (
            <UserAvatar user={{ username: actor.username, avatarUrl: actor.avatarUrl || null, avatarEffect: actor.avatarEffect }} size={46} />
          ) : (
            <span className="grid size-[46px] place-items-center rounded-full" style={{ background: `${color}22`, color }}>
              <Icon size={22} filled={n.type === 'like'} />
            </span>
          )}
          {actor && (
            <span
              className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full text-white ring-2 ring-canvas"
              style={{ background: color }}>
              <Icon size={11} filled={n.type === 'like'} />
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="line-clamp-3 text-[14px] leading-snug text-white/85 [&_b]:font-semibold [&_b]:text-white">
            {sentence(n)}
          </span>
          <span className="mt-0.5 block text-[12px] text-white/40">{ago(n.createdAt)}</span>
        </span>
        {n.post?.thumbnailUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- miniature distante (R2)
          <img src={n.post.thumbnailUrl} alt="" className="h-14 w-10 shrink-0 rounded-lg object-cover" />
        ) : null}
        {!n.read && <span aria-label="Non lue" className="size-2 shrink-0 rounded-full bg-accent" />}
      </button>
    </li>
  );
}

/** Page Alertes : filtres, sections par date, tout marquer comme lu. */
export function AlertsScreen() {
  const router = useRouter();
  const [group, setGroup] = useState<NotificationGroup>('all');
  // Liste par filtre (null = en cours de chargement), gardée quand on change d'onglet.
  const [lists, setLists] = useState<Partial<Record<NotificationGroup, AppNotification[] | 'error'>>>({});
  const items = lists[group];
  // Heure de référence des sections (Aujourd’hui…), prise à l’arrivée des alertes :
  // jamais pendant le rendu, que Next pré-génère côté serveur.
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (lists[group] !== undefined) return;
    loadNotifications(group).then((res) => {
      if (!res.ok && res.code === 'AUTH') {
        notifySessionChange();
        router.replace('/connexion');
        return;
      }
      setNow(Date.now());
      setLists((l) => ({ ...l, [group]: res.ok ? res.data : 'error' }));
    });
  }, [group, lists, router]);

  const setRead = (match: (n: AppNotification) => boolean) =>
    setLists((l) =>
      Object.fromEntries(
        Object.entries(l).map(([k, v]) => [k, Array.isArray(v) ? v.map((n) => (match(n) ? { ...n, read: true } : n)) : v]),
      ),
    );

  const unread = Array.isArray(items) ? items.filter((n) => !n.read).length : 0;

  const open = (n: AppNotification) => {
    if (!n.read) {
      setRead((x) => x.id === n.id);
      markRead(n.id);
    }
    const href = target(n);
    if (href) router.push(href);
  };

  const readAll = () => {
    setRead(() => true);
    markAllRead();
  };

  const sections: { title: string; items: AppNotification[] }[] = [];
  if (Array.isArray(items)) {
    for (const n of items) {
      const title = section(n.createdAt, now);
      const last = sections[sections.length - 1];
      if (last?.title === title) last.items.push(n);
      else sections.push({ title, items: [n] });
    }
  }

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -right-48 -top-48 size-[560px] opacity-50" />
      </div>

      <main className="relative mx-auto flex max-w-lg flex-col gap-5 px-4 pb-40 pt-[max(env(safe-area-inset-top),20px)] lg:max-w-2xl lg:pb-16">
        <header className="flex items-center gap-3 px-1">
          {/* Les alertes s'ouvrent depuis le profil : retour au profil. */}
          <Link href="/profil" aria-label="Retour au profil" className="glass grid size-11 shrink-0 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </Link>
          <h1 className="flex-1 text-[30px] font-bold tracking-[-0.03em]">Alertes</h1>
          <button
            type="button"
            onClick={readAll}
            disabled={unread === 0}
            aria-label={`Tout marquer comme lu, ${unread} non lues`}
            className="rounded-full px-3 py-2 text-[13px] font-semibold text-accent transition-opacity disabled:opacity-0">
            Tout lire
          </button>
        </header>

        {/* Notifications de ce navigateur (Web Push). */}
        <PushCard />

        <LiquidTabs label="Filtrer les alertes" tabs={GROUPS} value={group} onChange={setGroup} />

        {items === undefined && (
          <ul aria-label="Chargement" className="flex flex-col gap-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="h-[70px] animate-pulse rounded-3xl bg-white/[0.04]" />
            ))}
          </ul>
        )}

        {items === 'error' && (
          <p className="py-16 text-center text-[15px] text-white/55">Impossible de charger tes alertes. Réessaie plus tard.</p>
        )}

        {Array.isArray(items) && items.length === 0 && (
          <div className="flex flex-col items-center py-20 text-center">
            <span className="grid size-16 place-items-center rounded-full bg-accent/15 text-accent">
              <BellIcon size={28} />
            </span>
            <p className="mt-5 text-[20px] font-bold">Rien de neuf</p>
            <p className="mt-1.5 text-[15px] text-white/55">Tes nouvelles alertes apparaîtront ici.</p>
          </div>
        )}

        {sections.map((s) => (
          <section key={s.title} aria-label={s.title}>
            <h2 className="mb-1 px-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-white/40">{s.title}</h2>
            <ul className="flex flex-col gap-1">
              {s.items.map((n) => (
                <Row key={n.id} n={n} onOpen={open} />
              ))}
            </ul>
          </section>
        ))}
      </main>
    </div>
  );
}
