'use client';

import { useEffect, useState } from 'react';

import { loadStats, type AdminStats } from '@/app/actions/admin';
import { formatCount } from '@/lib/feed';

import { ThemeCountdown } from '../ThemeCountdown';
import { Loading, SectionTitle } from './ui';

/** 14 derniers jours (Europe/Paris), du plus ancien au plus récent, avec 0 pour les jours vides. */
function lastDays(series: { d: string; n: number }[], now: number) {
  const fmt = new Intl.DateTimeFormat('fr-CA', { timeZone: 'Europe/Paris' }); // AAAA-MM-JJ
  const byDay = new Map(series.map((s) => [s.d, s.n]));
  return Array.from({ length: 14 }, (_, i) => {
    const d = fmt.format(new Date(now - (13 - i) * 86_400_000));
    return { d, n: byDay.get(d) ?? 0 };
  });
}

const dayLabel = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });

/**
 * Barres par jour, une seule série (le titre la nomme : pas de légende).
 * Barres fines à bouts arrondis posées sur la ligne de base, 2 px d'écart, info-bulle au survol.
 */
function DailyBars({ title, total, days }: { title: string; total: number; days: { d: string; n: number }[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(1, ...days.map((x) => x.n));
  const shown = hover !== null ? days[hover] : null;
  return (
    <figure className="glass-solid flex flex-col rounded-[24px] p-5">
      <figcaption className="flex items-baseline justify-between gap-3">
        <span className="text-[14px] font-semibold text-white/80">{title}</span>
        <span className="text-[13px] tabular-nums text-white/50">
          {shown ? (
            <>
              <b className="text-white">{shown.n}</b> · {dayLabel.format(new Date(shown.d))}
            </>
          ) : (
            <>
              <b className="text-white">{total}</b> sur 14 jours
            </>
          )}
        </span>
      </figcaption>
      <div
        className="mt-5 flex h-28 items-end gap-[2px] border-b border-white/[0.08]"
        role="img"
        aria-label={`${title} : ${days.map((x) => `${dayLabel.format(new Date(x.d))} ${x.n}`).join(', ')}`}
        onMouseLeave={() => setHover(null)}>
        {days.map((x, i) => (
          <button
            key={x.d}
            type="button"
            tabIndex={-1}
            aria-hidden
            onMouseEnter={() => setHover(i)}
            onFocus={() => setHover(i)}
            className="group flex h-full flex-1 items-end justify-center">
            <span
              className={`w-full max-w-[18px] rounded-t-[4px] transition-colors ${
                hover === i ? 'bg-azure' : 'bg-accent'
              } ${x.n === 0 ? 'opacity-25' : ''}`}
              style={{ height: x.n === 0 ? 2 : `${Math.max(6, (x.n / max) * 100)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-2 flex justify-between text-[11px] text-white/40">
        <span>{dayLabel.format(new Date(days[0].d))}</span>
        <span>Aujourd’hui</span>
      </div>
    </figure>
  );
}

function Kpi({ label, value, sub, alert }: { label: string; value: number; sub?: string; alert?: boolean }) {
  return (
    <div
      className={`flex flex-col rounded-[22px] p-4 ${
        alert ? 'bg-[#FF4D6D]/10 shadow-[inset_0_0_0_1px_rgb(255_77_109/0.35)]' : 'glass-solid'
      }`}>
      <span className="text-[12px] font-medium text-white/50">{label}</span>
      <span className="mt-1.5 text-[28px] font-black leading-none tracking-[-0.03em] tabular-nums">{formatCount(value)}</span>
      {sub && <span className="mt-1.5 text-[12px] font-medium text-azure">{sub}</span>}
    </div>
  );
}

/** Vue d'ensemble : chiffres clés, activité des 14 derniers jours, défi en cours. */
export function Overview({ onGo }: { onGo: (tab: 'reports' | 'appeals') => void }) {
  const [stats, setStats] = useState<AdminStats | null | 'error'>(null);
  const [now, setNow] = useState(0);

  useEffect(() => {
    loadStats().then((res) => {
      setNow(Date.now());
      setStats(res.ok ? res.data : 'error');
    });
  }, []);

  if (stats === null) return <Loading rows={3} h={120} />;
  if (stats === 'error') return <p className="text-white/60">Impossible de charger les statistiques.</p>;

  const signups = lastDays(stats.series.signups, now);
  const posts = lastDays(stats.series.posts, now);

  return (
    <div className="flex flex-col gap-6">
      <SectionTitle title="Vue d’ensemble" sub="L’essentiel de VHOA, en temps réel." />

      {(stats.moderation.reportsOpen > 0 || stats.moderation.appealsOpen > 0) && (
        <div className="flex flex-wrap gap-2">
          {stats.moderation.reportsOpen > 0 && (
            <button
              type="button"
              onClick={() => onGo('reports')}
              className="rounded-full bg-[#FF4D6D]/15 px-4 py-2 text-[13px] font-semibold text-[#FF8FA3]">
              {stats.moderation.reportsOpen} signalement{stats.moderation.reportsOpen > 1 ? 's' : ''} à traiter →
            </button>
          )}
          {stats.moderation.appealsOpen > 0 && (
            <button
              type="button"
              onClick={() => onGo('appeals')}
              className="rounded-full bg-[#F5B83D]/15 px-4 py-2 text-[13px] font-semibold text-[#F5C766]">
              {stats.moderation.appealsOpen} contestation{stats.moderation.appealsOpen > 1 ? 's' : ''} →
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <Kpi label="Membres" value={stats.users.total} sub={`+${stats.users.last7} cette semaine`} />
        <Kpi label="Actifs (7 j)" value={stats.users.active7} sub={`${stats.users.last24h} inscrits en 24 h`} />
        <Kpi label="Prises publiées" value={stats.posts.published} sub={`+${stats.posts.last7} cette semaine`} />
        <Kpi label="Commentaires (7 j)" value={stats.engagement.comments7} />
        <Kpi label="Analyses coach (mois)" value={stats.engagement.analysesMonth} />
        <Kpi label="Premium" value={stats.users.premium} />
        <Kpi label="Signalements ouverts" value={stats.moderation.reportsOpen} alert={stats.moderation.reportsOpen > 0} />
        <Kpi label="Liste d’attente" value={stats.waitlist} />
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <DailyBars title="Inscriptions par jour" total={signups.reduce((a, x) => a + x.n, 0)} days={signups} />
        <DailyBars title="Prises publiées par jour" total={posts.reduce((a, x) => a + x.n, 0)} days={posts} />
      </div>

      {stats.theme && (
        <section className="glass-solid rounded-[24px] p-5">
          <p className="text-[12px] font-semibold uppercase tracking-[0.12em] text-white/40">
            Défi en cours ·{' '}
            <span className="text-azure">
              <ThemeCountdown endsAt={stats.theme.endsAt} />
            </span>
          </p>
          <p className="mt-2 text-[17px] font-bold leading-snug">« {stats.theme.subject} »</p>
          <p className="mt-1 text-[13px] text-white/50">
            {stats.theme.participants} participation{stats.theme.participants > 1 ? 's' : ''} · {stats.posts.processing} prise
            {stats.posts.processing > 1 ? 's' : ''} en traitement · {stats.users.banned} compte{stats.users.banned > 1 ? 's' : ''} banni
            {stats.users.banned > 1 ? 's' : ''}
          </p>
        </section>
      )}
    </div>
  );
}
