'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  decideAppeal,
  loadAppeals,
  loadReports,
  removeComment,
  removePost,
  resolveReport,
  setBan,
  type AdminAppeal,
  type AdminPostCard,
  type AdminReport,
} from '@/app/actions/admin';

import { UserAvatar } from '../AccountNav';
import { ActionButton, Badge, Empty, FilterChips, formatDate, Loading, SectionTitle, Thumb } from './ui';

const REASON: Record<string, string> = {
  spam: 'Spam ou arnaque',
  harassment: 'Harcèlement',
  hate: 'Propos haineux',
  violence: 'Violence ou menaces',
  sexual: 'Contenu sexuel',
  self_harm: 'Automutilation',
  misinformation: 'Fausse information',
  other: 'Autre',
};

const TYPE_LABEL = { post: 'Prise', comment: 'Commentaire', user: 'Profil' } as const;

type Notify = (message: string) => void;

/** Aperçu de ce qui est signalé. */
function Target({ r }: { r: AdminReport }) {
  if (!r.target) return <p className="text-[13px] italic text-white/40">Contenu déjà supprimé.</p>;
  if (r.targetType === 'post') {
    const p = r.target as AdminPostCard;
    return (
      <Link href={`/p/${p.id}`} target="_blank" className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2 pr-4 hover:bg-white/[0.07]">
        <Thumb url={p.thumbnailUrl} type={p.type} />
        <span className="min-w-0">
          <span className="block truncate text-[14px] font-semibold">{p.title || 'Sans titre'}</span>
          <span className="block text-[12px] text-white/50">
            @{p.author.username} · {p.status === 'published' ? 'en ligne' : p.status}
          </span>
        </span>
      </Link>
    );
  }
  if (r.targetType === 'comment') {
    const c = r.target as { text: string; postId: string; author: { username: string } };
    return (
      <div className="rounded-2xl bg-white/[0.04] p-3">
        <p className="text-[12px] text-white/50">@{c.author.username} a écrit :</p>
        <p className="mt-0.5 text-[14px] text-white/90">« {c.text} »</p>
        <Link href={`/p/${c.postId}`} target="_blank" className="mt-1 inline-block text-[12px] font-semibold text-accent">
          Voir la prise
        </Link>
      </div>
    );
  }
  const u = r.target as { id: string; username: string; displayName: string; avatarUrl: string; status: string; bio: string };
  return (
    <Link href={`/u/${u.id}`} target="_blank" className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 pr-4 hover:bg-white/[0.07]">
      <UserAvatar user={{ username: u.username, avatarUrl: u.avatarUrl || null }} size={40} />
      <span className="min-w-0">
        <span className="block truncate text-[14px] font-semibold">
          {u.displayName} <span className="font-normal text-white/50">@{u.username}</span>
        </span>
        <span className="block truncate text-[12px] text-white/50">{u.status === 'BANNED' ? 'Banni' : u.bio || 'Pas de bio'}</span>
      </span>
    </Link>
  );
}

function ReportsPanel({ notify, onCount }: { notify: Notify; onCount: (n: number) => void }) {
  const [status, setStatus] = useState<'OPEN' | 'RESOLVED' | 'DISMISSED'>('OPEN');
  const [rows, setRows] = useState<AdminReport[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    loadReports(status).then((res) => {
      const list = res.ok ? res.data : [];
      setRows(list);
      if (status === 'OPEN') onCount(list.length);
    });
  }, [status, onCount]);

  useEffect(() => {
    load();
  }, [load]);

  /** Lance une action, recharge la liste et affiche le résultat. */
  const run = async (key: string, task: () => Promise<{ ok: boolean; message?: string }>, done: string) => {
    setBusy(key);
    const res = await task();
    setBusy(null);
    notify(res.ok ? done : (res as { message: string }).message);
    load();
  };

  return (
    <section className="flex flex-col gap-4">
      <FilterChips
        value={status}
        onChange={(s) => {
          setRows(null);
          setStatus(s);
        }}
        items={[
          { key: 'OPEN', label: 'À traiter' },
          { key: 'RESOLVED', label: 'Traités' },
          { key: 'DISMISSED', label: 'Classés sans suite' },
        ]}
      />
      {rows === null && <Loading rows={3} h={150} />}
      {rows?.length === 0 && <Empty title={status === 'OPEN' ? 'Aucun signalement à traiter 🎉' : 'Rien ici'} />}
      <ul className="flex flex-col gap-3">
        {rows?.map((r) => (
          <li key={r.id} className="glass-solid flex flex-col gap-3 rounded-[24px] p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="bad">{REASON[r.reason] ?? r.reason}</Badge>
              <Badge>{TYPE_LABEL[r.targetType]}</Badge>
              {r.openCount > 1 && <Badge tone="warn">{r.openCount} signalements</Badge>}
              <span className="ml-auto text-[12px] text-white/40">
                par @{r.reporter.username} · {formatDate(r.createdAt)}
              </span>
            </div>
            {r.details && <p className="text-[14px] text-white/70">« {r.details} »</p>}
            <Target r={r} />
            {status === 'OPEN' && (
              <div className="flex flex-wrap gap-2">
                {r.targetType === 'post' && r.target && (
                  <ActionButton
                    variant="danger"
                    disabled={busy === r.id}
                    onClick={() => run(r.id, () => removePost(r.targetId, `Signalement : ${REASON[r.reason] ?? r.reason}`), 'Prise retirée.')}>
                    Retirer la prise
                  </ActionButton>
                )}
                {r.targetType === 'comment' && r.target && (
                  <ActionButton variant="danger" disabled={busy === r.id} onClick={() => run(r.id, () => removeComment(r.targetId), 'Commentaire supprimé.')}>
                    Supprimer le commentaire
                  </ActionButton>
                )}
                {r.targetType === 'user' && r.target && (
                  <ActionButton
                    variant="danger"
                    disabled={busy === r.id}
                    onClick={() =>
                      run(
                        r.id,
                        async () => {
                          const res = await setBan(r.targetId, true);
                          return res.ok ? resolveReport(r.id, 'RESOLVED') : res;
                        },
                        'Compte banni.',
                      )
                    }>
                    Bannir le compte
                  </ActionButton>
                )}
                <ActionButton disabled={busy === r.id} onClick={() => run(r.id, () => resolveReport(r.id, 'RESOLVED'), 'Marqué comme traité.')}>
                  Marquer traité
                </ActionButton>
                <ActionButton disabled={busy === r.id} onClick={() => run(r.id, () => resolveReport(r.id, 'DISMISSED'), 'Classé sans suite.')}>
                  Classer sans suite
                </ActionButton>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Signalements de la communauté. */
export function Reports({ notify, onCount }: { notify: Notify; onCount: (n: number) => void }) {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Signalements" sub="Ce que la communauté a signalé. Les plus signalés ressortent." />
      <ReportsPanel notify={notify} onCount={onCount} />
    </div>
  );
}

/** Contestations : un membre conteste le retrait (ou le refus automatique) d'une de ses prises. */
export function Appeals({ notify, onCount }: { notify: Notify; onCount: (n: number) => void }) {
  const [rows, setRows] = useState<AdminAppeal[] | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(() => {
    loadAppeals().then((res) => {
      const list = res.ok ? res.data : [];
      setRows(list);
      onCount(list.length);
    });
  }, [onCount]);

  useEffect(() => {
    load();
  }, [load]);

  const decide = async (a: AdminAppeal, accept: boolean) => {
    setBusy(a.id);
    const res = await decideAppeal(a.id, a.post?.id ?? null, accept);
    setBusy(null);
    notify(res.ok ? (accept ? 'Prise republiée.' : 'Contestation refusée.') : res.message);
    load();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Contestations" sub="Accepter republie la prise ; refuser la laisse retirée." />
      {rows === null && <Loading rows={2} h={150} />}
      {rows?.length === 0 && <Empty title="Aucune contestation en attente" />}
      <ul className="flex flex-col gap-3">
        {rows?.map((a) => (
          <li key={a.id} className="glass-solid flex flex-col gap-3 rounded-[24px] p-4">
            <div className="flex items-center gap-3">
              <UserAvatar user={{ username: a.user.username, avatarUrl: a.user.avatarUrl || null }} size={36} />
              <span className="text-[14px] font-semibold">@{a.user.username}</span>
              <span className="ml-auto text-[12px] text-white/40">{formatDate(a.createdAt)}</span>
            </div>
            <p className="text-[14px] leading-relaxed text-white/85">« {a.message} »</p>
            {a.post && (
              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2 pr-4">
                <Thumb url={a.post.thumbnailUrl} type={a.post.type} />
                <span className="min-w-0">
                  <span className="block truncate text-[14px] font-semibold">{a.post.title || 'Sans titre'}</span>
                  <span className="block text-[12px] text-white/50">Motif du retrait : {a.post.reason ?? '—'}</span>
                  {a.post.mediaUrl && (
                    <a href={a.post.mediaUrl} target="_blank" rel="noreferrer" className="text-[12px] font-semibold text-accent">
                      Écouter le fichier
                    </a>
                  )}
                </span>
              </div>
            )}
            <div className="flex flex-wrap gap-2">
              <ActionButton variant="primary" disabled={busy === a.id || !a.post} onClick={() => decide(a, true)}>
                Accepter et republier
              </ActionButton>
              <ActionButton disabled={busy === a.id} onClick={() => decide(a, false)}>
                Refuser
              </ActionButton>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
