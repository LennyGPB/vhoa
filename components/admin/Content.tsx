'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import {
  loadPosts,
  loadUsers,
  removePost,
  restorePost,
  setBan,
  setRole,
  type AdminPost,
  type AdminUser,
} from '@/app/actions/admin';
import { formatCount } from '@/lib/feed';
import { useSessionUser } from '@/lib/use-session';

import { UserAvatar } from '../AccountNav';
import { Sheet } from '../feed/Sheet';
import { ActionButton, Badge, Empty, FilterChips, formatDate, Loading, SearchInput, SectionTitle, Thumb } from './ui';

type Notify = (message: string) => void;

/** Recherche avec un léger délai : on n'interroge pas l'API à chaque lettre. */
function useDebounced(value: string, ms = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

const POST_STATUS: Record<string, { label: string; tone: 'good' | 'blue' | 'warn' | 'bad' | 'neutral' }> = {
  published: { label: 'En ligne', tone: 'good' },
  processing: { label: 'Traitement', tone: 'blue' },
  draft: { label: 'Brouillon', tone: 'neutral' },
  private: { label: 'Coach IA', tone: 'blue' },
  rejected: { label: 'Refusée (auto)', tone: 'warn' },
  removed: { label: 'Retirée', tone: 'bad' },
  failed: { label: 'Échec', tone: 'bad' },
};

/** Toutes les prises : filtre par statut, recherche, retrait / restauration. */
export function Posts({ notify }: { notify: Notify }) {
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const query = useDebounced(q);
  const [rows, setRows] = useState<AdminPost[] | null>(null);
  const [removing, setRemoving] = useState<AdminPost | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadPosts(status, query).then((res) => !cancelled && setRows(res.ok ? res.data : []));
    return () => {
      cancelled = true;
    };
  }, [status, query, version]);

  const reload = () => setVersion((v) => v + 1);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Prises" sub="Toutes les prises de parole, du plus récent au plus ancien." right={<SearchInput value={q} onChange={setQ} placeholder="Titre ou @pseudo" />} />
      <FilterChips
        value={status}
        onChange={(s) => {
          setRows(null);
          setStatus(s);
        }}
        items={[
          { key: 'all', label: 'Toutes' },
          { key: 'published', label: 'En ligne' },
          { key: 'processing', label: 'En traitement' },
          { key: 'rejected', label: 'Refusées (auto)' },
          { key: 'removed', label: 'Retirées' },
          { key: 'draft', label: 'Brouillons' },
          { key: 'private', label: 'Coach IA' },
          { key: 'failed', label: 'Échecs' },
        ]}
      />
      {rows === null && <Loading rows={4} h={84} />}
      {rows?.length === 0 && <Empty title="Aucune prise" text={q ? 'Essaie une autre recherche.' : undefined} />}
      <ul className="flex flex-col gap-2">
        {rows?.map((p) => {
          const st = POST_STATUS[p.status] ?? { label: p.status, tone: 'neutral' as const };
          return (
            <li key={p.id} className="glass-solid flex flex-col gap-3 rounded-[22px] p-3 md:flex-row md:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <Thumb url={p.thumbnailUrl} type={p.type} />
                <div className="min-w-0">
                  <p className="truncate text-[14px] font-semibold">{p.title || 'Sans titre'}</p>
                  <p className="truncate text-[12px] text-white/50">
                    @{p.author.username} · {p.category ?? 'Sans catégorie'} · {formatDate(p.createdAt)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone={st.tone}>{st.label}</Badge>
                    {p.theme && <Badge tone="blue">Défi</Badge>}
                    <span className="text-[12px] text-white/45">
                      ♥ {formatCount(p.likes)} · 💬 {formatCount(p.comments)} · ✓ {formatCount(p.convinced)}
                    </span>
                  </div>
                  {p.reason && <p className="mt-1 text-[12px] text-[#FF8FA3]">{p.reason}</p>}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 md:justify-end">
                {p.status === 'published' && (
                  <Link
                    href={`/p/${p.id}`}
                    target="_blank"
                    className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-white/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] hover:bg-white/[0.06]">
                    Voir
                  </Link>
                )}
                {p.mediaUrl && p.status !== 'published' && (
                  <a
                    href={p.mediaUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 items-center rounded-full px-4 text-[13px] font-semibold text-white/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] hover:bg-white/[0.06]">
                    Fichier
                  </a>
                )}
                {(p.status === 'published' || p.status === 'draft' || p.status === 'private') && (
                  <ActionButton
                    variant="danger"
                    onClick={() => {
                      setReason('');
                      setRemoving(p);
                    }}>
                    Retirer
                  </ActionButton>
                )}
                {(p.status === 'removed' || p.status === 'rejected') && (
                  <ActionButton
                    variant="primary"
                    onClick={async () => {
                      const res = await restorePost(p.id);
                      notify(res.ok ? 'Prise republiée.' : res.message);
                      reload();
                    }}>
                    Republier
                  </ActionButton>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Sheet open={removing !== null} onClose={() => setRemoving(null)} title="Retirer la prise">
        {removing && (
          <div className="px-5 pb-6">
            <h2 className="text-center text-[20px] font-bold">Retirer « {removing.title || 'Sans titre'} » ?</h2>
            <p className="mt-1 text-center text-[13px] text-white/50">L’auteur est prévenu et peut contester.</p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              maxLength={200}
              rows={3}
              placeholder="Motif (montré à l’auteur), ex. : propos haineux"
              className="mt-4 w-full resize-none rounded-2xl bg-white/[0.05] p-3.5 text-[15px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
            />
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRemoving(null)}
                className="h-13 rounded-full text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                Annuler
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  const res = await removePost(removing.id, reason);
                  setBusy(false);
                  setRemoving(null);
                  notify(res.ok ? 'Prise retirée.' : res.message);
                  reload();
                }}
                className="h-13 rounded-full bg-[#FF4D6D] text-[15px] font-semibold text-white disabled:opacity-50">
                Retirer
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}

const PROVIDER: Record<string, string> = { password: 'Email', google: 'Google', apple: 'Apple' };

/** Membres : recherche, bannissement, rôle admin. */
export function Users({ notify }: { notify: Notify }) {
  const me = useSessionUser();
  const [q, setQ] = useState('');
  const query = useDebounced(q);
  const [rows, setRows] = useState<AdminUser[] | null>(null);
  const [confirm, setConfirm] = useState<{ user: AdminUser; action: 'ban' | 'unban' | 'admin' | 'user' } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    let cancelled = false;
    loadUsers(query).then((res) => !cancelled && setRows(res.ok ? res.data : []));
    return () => {
      cancelled = true;
    };
  }, [query, version]);

  const COPY = {
    ban: { title: 'Bannir', text: 'Le compte est déconnecté partout et ne peut plus se connecter.', cta: 'Bannir', danger: true },
    unban: { title: 'Débannir', text: 'Le compte peut de nouveau se connecter.', cta: 'Débannir', danger: false },
    admin: { title: 'Passer admin', text: 'Ce compte aura accès à tout le back-office.', cta: 'Passer admin', danger: false },
    user: { title: 'Retirer le rôle admin', text: 'Ce compte n’aura plus accès au back-office.', cta: 'Retirer', danger: true },
  } as const;

  const apply = async () => {
    if (!confirm) return;
    const { user, action } = confirm;
    const res =
      action === 'ban' || action === 'unban'
        ? await setBan(user.id, action === 'ban')
        : await setRole(user.id, action === 'admin' ? 'ADMIN' : 'USER');
    setConfirm(null);
    notify(res.ok ? `${COPY[action].title} : @${user.username} ✓` : res.message);
    setVersion((v) => v + 1);
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Membres" sub={rows ? `${rows.length} affichés (60 max), du plus récent au plus ancien.` : undefined} right={<SearchInput value={q} onChange={setQ} placeholder="Pseudo, nom ou email" />} />
      {rows === null && <Loading rows={5} h={72} />}
      {rows?.length === 0 && <Empty title="Aucun membre trouvé" />}
      <ul className="flex flex-col gap-2">
        {rows?.map((u) => (
          <li key={u.id} className="glass-solid flex flex-col gap-3 rounded-[22px] p-3 md:flex-row md:items-center">
            <Link href={`/u/${u.id}`} target="_blank" className="flex min-w-0 flex-1 items-center gap-3">
              <UserAvatar user={{ username: u.username, avatarUrl: u.avatarUrl || null }} size={44} />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-1.5">
                  <span className="truncate text-[14px] font-semibold">{u.displayName}</span>
                  <span className="text-[13px] text-white/50">@{u.username}</span>
                  {u.role === 'ADMIN' && <Badge tone="blue">Admin</Badge>}
                  {u.status === 'BANNED' && <Badge tone="bad">Banni</Badge>}
                  {u.isPremium && <Badge tone="good">Premium</Badge>}
                </span>
                <span className="block truncate text-[12px] text-white/45">
                  {u.email ?? 'sans email'} · {u.providers.map((p) => PROVIDER[p] ?? p).join(', ')} · {u.postsCount} prises ·{' '}
                  {u.followers} abonnés · inscrit le {formatDate(u.createdAt)}
                </span>
              </span>
            </Link>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {u.status === 'BANNED' ? (
                <ActionButton onClick={() => setConfirm({ user: u, action: 'unban' })}>Débannir</ActionButton>
              ) : (
                u.id !== me?.id && (
                  <ActionButton variant="danger" onClick={() => setConfirm({ user: u, action: 'ban' })}>
                    Bannir
                  </ActionButton>
                )
              )}
              {u.id !== me?.id &&
                (u.role === 'ADMIN' ? (
                  <ActionButton onClick={() => setConfirm({ user: u, action: 'user' })}>Retirer admin</ActionButton>
                ) : (
                  <ActionButton onClick={() => setConfirm({ user: u, action: 'admin' })}>Passer admin</ActionButton>
                ))}
            </div>
          </li>
        ))}
      </ul>

      <Sheet open={confirm !== null} onClose={() => setConfirm(null)} title="Confirmer">
        {confirm && (
          <div className="px-6 pb-8 pt-2 text-center">
            <h2 className="text-[22px] font-bold">
              {COPY[confirm.action].title} @{confirm.user.username} ?
            </h2>
            <p className="mt-2 text-[14px] text-white/60">{COPY[confirm.action].text}</p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirm(null)}
                className="h-13 rounded-full text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                Annuler
              </button>
              <button
                type="button"
                onClick={apply}
                className={`h-13 rounded-full text-[15px] font-semibold text-white ${COPY[confirm.action].danger ? 'bg-[#FF4D6D]' : 'bg-accent'}`}>
                {COPY[confirm.action].cta}
              </button>
            </div>
          </div>
        )}
      </Sheet>
    </div>
  );
}
