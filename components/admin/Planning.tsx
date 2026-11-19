'use client';

import { useEffect, useRef, useState } from 'react';

import {
  addToThemeQueue,
  createTheme,
  deleteWaitlistEntry,
  loadThemeQueue,
  loadThemes,
  loadWaitlist,
  regenerateTheme,
  removeQueuedTheme,
  reorderThemeQueue,
  updateQueuedTheme,
  updateTheme,
  type AdminTheme,
  type QueuedTheme,
} from '@/app/actions/admin';
import type { WaitlistRow, WaitlistStats } from '@/lib/admin-data';

import { Sheet } from '../feed/Sheet';
import { ActionButton, Badge, Empty, FilterChips, formatDate, Loading, SearchInput, SectionTitle } from './ui';

type Notify = (message: string) => void;

const day = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const STATUS = {
  ACTIVE: { label: 'En cours', tone: 'good' },
  SCHEDULED: { label: 'Programmé', tone: 'blue' },
  CLOSED: { label: 'Terminé', tone: 'neutral' },
} as const;

/** Défis : sujets programmés (proposés par GPT, modifiables), en cours, terminés. */
export function Themes({ notify }: { notify: Notify }) {
  const [rows, setRows] = useState<AdminTheme[] | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'CLOSED'>('upcoming');
  const [editing, setEditing] = useState<{ id: string | null; subject: string; period: 'weekly' | 'monthly'; date: string } | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    loadThemes().then((res) => setRows(res.ok ? res.data : []));
  }, [version]);

  const reload = () => setVersion((v) => v + 1);
  const shown = rows?.filter((t) => (filter === 'CLOSED' ? t.status === 'CLOSED' : t.status !== 'CLOSED'));
  // La file démarre après le dernier défi de la semaine déjà en place (en cours ou programmé).
  const queueStart =
    rows
      ?.filter((t) => t.period === 'WEEKLY' && t.status !== 'CLOSED')
      .map((t) => t.endsAt)
      .sort()
      .at(-1) ?? null;
  // Prochain défi de la semaine programmé (le plus proche à venir).
  const nextWeek =
    rows
      ?.filter((t) => t.period === 'WEEKLY' && t.status === 'SCHEDULED')
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null;

  const save = async () => {
    if (!editing) return;
    setBusy('save');
    const res = editing.id
      ? await updateTheme(editing.id, editing.subject)
      : await createTheme(editing.period, editing.date, editing.subject);
    setBusy(null);
    if (!res.ok) return notify(res.message);
    setEditing(null);
    notify(editing.id ? 'Sujet modifié.' : 'Défi programmé.');
    reload();
  };

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Défis"
        sub="GPT propose les sujets à l’avance ; tu peux les modifier ou les régénérer."
        right={
          <ActionButton
            variant="primary"
            onClick={() => setEditing({ id: null, subject: '', period: 'weekly', date: new Date().toISOString().slice(0, 10) })}>
            + Programmer un défi
          </ActionButton>
        }
      />
      <ThemeQueue notify={notify} nextWeek={nextWeek} queueStart={queueStart} onChange={reload} />

      <FilterChips
        value={filter}
        onChange={setFilter}
        items={[
          { key: 'upcoming', label: 'En cours et à venir' },
          { key: 'CLOSED', label: 'Terminés' },
        ]}
      />
      {rows === null && <Loading rows={4} h={96} />}
      {shown?.length === 0 && <Empty title="Aucun défi ici" />}
      <ul className="flex flex-col gap-2">
        {shown?.map((t) => (
          <li key={t.id} className="glass-solid flex flex-col gap-3 rounded-[22px] p-4 md:flex-row md:items-center">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <Badge tone={STATUS[t.status].tone}>{STATUS[t.status].label}</Badge>
                <Badge>{t.period === 'WEEKLY' ? 'Semaine' : 'Mois'}</Badge>
                {t.aiGenerated && <Badge tone="warn">Proposé par GPT, à relire</Badge>}
                <span className="text-[12px] text-white/45">
                  {day.format(new Date(t.startsAt))} → {day.format(new Date(t.endsAt))} · {t.participantsCount} participations
                </span>
              </div>
              <p className="mt-2 text-[15px] font-semibold leading-snug">« {t.subject} »</p>
            </div>
            {t.status !== 'CLOSED' && (
              <div className="flex flex-wrap gap-2 md:justify-end">
                <ActionButton
                  onClick={() =>
                    setEditing({ id: t.id, subject: t.subject, period: t.period === 'WEEKLY' ? 'weekly' : 'monthly', date: t.startsAt })
                  }>
                  Modifier
                </ActionButton>
                {t.status === 'SCHEDULED' && (
                  <ActionButton
                    disabled={busy === t.id}
                    onClick={async () => {
                      setBusy(t.id);
                      const res = await regenerateTheme(t.id);
                      setBusy(null);
                      notify(res.ok ? 'Nouveau sujet proposé.' : res.message);
                      reload();
                    }}>
                    {busy === t.id ? 'GPT réfléchit…' : 'Régénérer'}
                  </ActionButton>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>

      <Sheet open={editing !== null} onClose={() => setEditing(null)} title={editing?.id ? 'Modifier le défi' : 'Programmer un défi'}>
        {editing && (
          <div className="flex flex-col gap-3 px-5 pb-6">
            <h2 className="text-center text-[20px] font-bold">{editing.id ? 'Modifier le sujet' : 'Programmer un défi'}</h2>
            {!editing.id && (
              <>
                <FilterChips
                  value={editing.period}
                  onChange={(period) => setEditing({ ...editing, period })}
                  items={[
                    { key: 'weekly', label: 'Défi de la semaine' },
                    { key: 'monthly', label: 'Défi du mois' },
                  ]}
                />
                <label className="flex flex-col gap-1.5 text-[13px] text-white/60">
                  Un jour de la semaine (ou du mois) visé
                  <input
                    type="date"
                    value={editing.date.slice(0, 10)}
                    onChange={(e) => setEditing({ ...editing, date: e.target.value })}
                    className="h-12 rounded-2xl bg-white/[0.05] px-4 text-[15px] text-white [color-scheme:dark] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
                  />
                </label>
              </>
            )}
            <textarea
              value={editing.subject}
              onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
              maxLength={140}
              rows={3}
              placeholder="Faut-il… ? (10 à 140 caractères)"
              className="w-full resize-none rounded-2xl bg-white/[0.05] p-3.5 text-[16px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
            />
            <p className="text-right text-[12px] text-white/40">{editing.subject.length}/140</p>
            <button
              type="button"
              disabled={busy === 'save' || editing.subject.trim().length < 10}
              onClick={save}
              className="h-13 rounded-full bg-accent text-[15px] font-semibold text-white disabled:opacity-40">
              {editing.id ? 'Enregistrer' : 'Programmer'}
            </button>
          </div>
        )}
      </Sheet>
    </div>
  );
}

/** Liste d'attente de l'app mobile (lue directement en base). */
export function Waitlist({ notify }: { notify: Notify }) {
  const [q, setQ] = useState('');
  const [platform, setPlatform] = useState<'all' | 'ios' | 'android'>('all');
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ stats: WaitlistStats; rows: WaitlistRow[]; total: number } | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      loadWaitlist({ q, platform, page }).then((res) => setData(res.ok ? res.data : null));
    }, 250);
    return () => clearTimeout(t);
  }, [q, platform, page, version]);

  const pages = data ? Math.max(1, Math.ceil(data.total / 25)) : 1;

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Liste d’attente"
        sub="Inscriptions pour l’app mobile."
        right={
          <a
            href="/admin/export"
            className="inline-flex h-9 items-center rounded-full bg-accent px-4 text-[13px] font-semibold text-white">
            Exporter en CSV
          </a>
        }
      />
      {data && (
        <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
          {[
            ['Total', data.stats.total],
            ['iPhone', data.stats.ios],
            ['Android', data.stats.android],
            ['Cette semaine', data.stats.week],
          ].map(([l, v]) => (
            <div key={l} className="glass-solid rounded-[22px] p-4">
              <span className="text-[12px] text-white/50">{l}</span>
              <p className="mt-1 text-[26px] font-black tabular-nums">{v}</p>
            </div>
          ))}
        </div>
      )}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <FilterChips
          value={platform}
          onChange={(p) => {
            setPage(1);
            setPlatform(p);
          }}
          items={[
            { key: 'all', label: 'Toutes' },
            { key: 'ios', label: 'iPhone' },
            { key: 'android', label: 'Android' },
          ]}
        />
        <SearchInput
          value={q}
          onChange={(v) => {
            setPage(1);
            setQ(v);
          }}
          placeholder="Rechercher un email"
        />
      </div>
      {!data && <Loading rows={4} h={56} />}
      {data?.rows.length === 0 && <Empty title="Aucune inscription" />}
      <ul className="flex flex-col gap-1.5">
        {data?.rows.map((r) => (
          <li key={r.id} className="glass-solid flex items-center gap-3 rounded-[18px] px-4 py-3">
            <span className="min-w-0 flex-1 truncate text-[14px]">{r.email}</span>
            <Badge tone="blue">{r.platform === 'IOS' ? 'iPhone' : 'Android'}</Badge>
            <span className="hidden text-[12px] text-white/45 md:inline">{formatDate(String(r.createdAt))}</span>
            <button
              type="button"
              onClick={async () => {
                const res = await deleteWaitlistEntry(r.id);
                notify(res.ok ? 'Inscription supprimée.' : res.message);
                setVersion((v) => v + 1);
              }}
              className="text-[12px] font-semibold text-white/40 hover:text-[#FF8FA3]">
              Supprimer
            </button>
          </li>
        ))}
      </ul>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <ActionButton disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            ← Précédent
          </ActionButton>
          <span className="text-[13px] text-white/50">
            {page} / {pages}
          </span>
          <ActionButton disabled={page >= pages} onClick={() => setPage((p) => p + 1)}>
            Suivant →
          </ActionButton>
        </div>
      )}
    </div>
  );
}

/**
 * File d'attente des défis de la semaine : chaque nouvelle semaine prend le sujet en tête.
 * Réordonnable au glisser-déposer (souris ou doigt, poignée ⋮⋮) ou avec les flèches.
 */
const weekDay = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'Europe/Paris' });

function ThemeQueue({
  notify,
  nextWeek,
  queueStart,
  onChange,
}: {
  notify: Notify;
  nextWeek: AdminTheme | null;
  /** Fin du dernier défi de la semaine en place : le n° 1 de la file démarre à cette date. */
  queueStart: string | null;
  onChange: () => void;
}) {
  /** Date de démarrage du sujet n° i (une semaine chacun). */
  const startOf = (i: number) =>
    queueStart ? weekDay.format(new Date(new Date(queueStart).getTime() + i * 7 * 24 * 3600_000)) : null;
  const [items, setItems] = useState<QueuedTheme[] | null>(null);
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState<{ id: string; subject: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLLIElement>());
  const before = useRef<string[]>([]);

  useEffect(() => {
    loadThemeQueue().then((res) => setItems(res.ok ? res.data : []));
  }, []);

  /** Applique une réponse de l'API (la file à jour) ; la semaine prochaine a pu changer. */
  const apply = (res: { ok: true; data: QueuedTheme[] } | { ok: false; message: string }, message?: string) => {
    if (!res.ok) {
      notify(res.message);
      loadThemeQueue().then((r) => r.ok && setItems(r.data));
      return false;
    }
    setItems(res.data);
    if (message) notify(message);
    onChange();
    return true;
  };

  const add = async () => {
    setBusy(true);
    const ok = apply(await addToThemeQueue(draft), 'Ajouté à la file.');
    setBusy(false);
    if (ok) setDraft('');
  };

  const saveOrder = async (list: QueuedTheme[]) => {
    const ids = list.map((i) => i.id);
    if (ids.join() === before.current.join()) return;
    apply(await reorderThemeQueue(ids), 'Ordre enregistré.');
  };

  const move = (from: number, to: number) => {
    if (!items || to < 0 || to >= items.length || from === to) return;
    before.current = items.map((i) => i.id);
    const next = [...items];
    const [it] = next.splice(from, 1);
    next.splice(to, 0, it);
    setItems(next);
    void saveOrder(next);
  };

  // Glisser-déposer : on suit le pointeur et on déplace l'élément quand il passe sur un autre.
  const onPointerDown = (e: React.PointerEvent, id: string) => {
    if (!items || editing) return;
    // Toute la ligne s'attrape, sauf ses boutons et son champ.
    if ((e.target as HTMLElement).closest('button:not([data-handle]), input')) return;
    e.preventDefault();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    before.current = items.map((i) => i.id);
    setDragId(id);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragId || !items) return;
    const y = e.clientY;
    const from = items.findIndex((i) => i.id === dragId);
    let to = from;
    items.forEach((it, i) => {
      const r = rowRefs.current.get(it.id)?.getBoundingClientRect();
      if (r && y > r.top && y < r.bottom) to = i;
    });
    if (to !== from) {
      const next = [...items];
      const [it] = next.splice(from, 1);
      next.splice(to, 0, it);
      setItems(next);
    }
  };
  const onPointerUp = () => {
    if (!dragId || !items) return;
    setDragId(null);
    void saveOrder(items);
  };

  return (
    <section className="glass-solid flex flex-col gap-4 rounded-[24px] p-4 md:p-5">
      <div>
        <h3 className="text-[17px] font-bold">File d’attente · défis de la semaine</h3>
        <p className="mt-0.5 text-[13px] leading-snug text-white/55">
          Glisse les sujets pour les classer : le n° 1 passe en premier, puis le 2, et ainsi de suite. File vide : GPT
          propose un sujet.
        </p>
      </div>

      {nextWeek && (
        <div className="flex items-start gap-3 rounded-[18px] bg-accent/10 p-3.5 shadow-[inset_0_0_0_1px_rgb(74_168_255/0.25)]">
          <span className="shrink-0 rounded-full bg-accent px-2.5 py-1 text-[11px] font-bold text-white">Semaine prochaine</span>
          <p className="min-w-0 flex-1 text-[14px] font-semibold leading-snug">
            « {nextWeek.subject} »
            {nextWeek.aiGenerated && <span className="ml-1.5 text-[12px] font-medium text-white/50">(GPT : remplacé par la tête de file)</span>}
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && draft.trim().length >= 10 && !busy && add()}
          maxLength={140}
          placeholder="Nouveau sujet : Faut-il… ? (10 à 140 caractères)"
          aria-label="Nouveau sujet à ajouter à la file"
          className="h-12 min-w-0 flex-1 rounded-2xl bg-white/[0.05] px-4 text-[16px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
        />
        <button
          type="button"
          onClick={add}
          disabled={busy || draft.trim().length < 10}
          className="h-12 shrink-0 rounded-full bg-accent px-5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110 disabled:opacity-40">
          Ajouter à la file
        </button>
      </div>

      {items === null && <Loading rows={2} h={56} />}
      {items?.length === 0 && <p className="py-3 text-center text-[13px] text-white/45">La file est vide.</p>}
      {!!items?.length && (
        <ol className="flex flex-col gap-1.5" onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerUp}>
          {items.map((it, i) => (
            <li
              key={it.id}
              ref={(el) => {
                if (el) rowRefs.current.set(it.id, el);
                else rowRefs.current.delete(it.id);
              }}
              onPointerDown={(e) => onPointerDown(e, it.id)}
              className={`flex cursor-grab touch-none select-none items-center gap-2 rounded-[18px] p-2 pr-3 transition-[background-color,box-shadow,transform] active:cursor-grabbing ${
                dragId === it.id
                  ? 'relative z-10 scale-[1.02] bg-accent/20 shadow-[0_14px_40px_-12px_rgb(0_0_0/0.8),inset_0_0_0_1.5px_var(--color-accent)]'
                  : 'bg-white/[0.04] hover:bg-white/[0.06]'
              }`}>
              <button
                type="button"
                data-handle
                aria-label={`Déplacer « ${it.subject} »`}
                className="grid h-10 w-8 shrink-0 cursor-grab touch-none place-items-center rounded-xl text-[16px] leading-none text-white/40 hover:text-white active:cursor-grabbing">
                ⋮⋮
              </button>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white/[0.06] text-[12px] font-bold text-white/70">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
              {editing?.id === it.id ? (
                <input
                  autoFocus
                  value={editing.subject}
                  maxLength={140}
                  onChange={(e) => setEditing({ ...editing, subject: e.target.value })}
                  onKeyDown={async (e) => {
                    if (e.key === 'Escape') setEditing(null);
                    if (e.key === 'Enter' && apply(await updateQueuedTheme(it.id, editing.subject), 'Sujet modifié.')) setEditing(null);
                  }}
                  aria-label="Modifier le sujet"
                  className="h-10 min-w-0 flex-1 rounded-xl bg-white/[0.06] px-3 text-[16px] text-white outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
                />
              ) : (
                <p className="text-[14px] font-medium leading-snug">« {it.subject} »</p>
              )}
              <p className="mt-0.5 text-[12px] text-white/45">
                {i === 0 && <span className="mr-1.5 font-semibold text-azure">Prochain</span>}
                {startOf(i) ? `à partir du ${startOf(i)}` : ''}
              </p>
              </div>
              <div className="flex shrink-0 items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Monter"
                  disabled={i === 0}
                  onClick={() => move(i, i - 1)}
                  className="grid size-8 place-items-center rounded-full text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-25">
                  ↑
                </button>
                <button
                  type="button"
                  aria-label="Descendre"
                  disabled={i === items.length - 1}
                  onClick={() => move(i, i + 1)}
                  className="grid size-8 place-items-center rounded-full text-white/55 hover:bg-white/[0.06] hover:text-white disabled:opacity-25">
                  ↓
                </button>
                {editing?.id === it.id ? (
                  <button
                    type="button"
                    onClick={async () => {
                      if (apply(await updateQueuedTheme(it.id, editing.subject), 'Sujet modifié.')) setEditing(null);
                    }}
                    className="ml-1 rounded-full bg-accent px-3 py-1.5 text-[12px] font-semibold text-white">
                    OK
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditing({ id: it.id, subject: it.subject })}
                    className="ml-1 rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-white/60 hover:text-white">
                    Modifier
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => apply(await removeQueuedTheme(it.id), 'Retiré de la file.')}
                  className="rounded-full px-2.5 py-1.5 text-[12px] font-semibold text-white/40 hover:text-[#FF8FA3]">
                  Retirer
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
