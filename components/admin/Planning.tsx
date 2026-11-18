'use client';

import { useEffect, useState } from 'react';

import {
  createTheme,
  deleteWaitlistEntry,
  loadThemes,
  loadWaitlist,
  regenerateTheme,
  updateTheme,
  type AdminTheme,
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
