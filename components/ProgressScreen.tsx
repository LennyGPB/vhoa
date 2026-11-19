'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState, useTransition, type KeyboardEvent, type PointerEvent } from 'react';

import {
  loadCoachHistory,
  loadCoachQuota,
  loadCoachStats,
  type CoachPoint,
  type CoachQuota,
  type CoachStats,
  type HistoryItem,
} from '@/app/actions/coach';
import { COACH_HREF } from '@/lib/site';
import { notifySessionChange } from '@/lib/use-session';

import { BlobBadge } from './BlobBadge';
import { MicIcon, SparkIcon, VideoIcon } from './icons';
import { PREMIUM_ANALYSES } from './premium/shared';

/* Débit idéal à l'oral : 110 à 170 mots/min (comme paceLabel côté API). */
const IDEAL = [110, 170] as const;

const num = (v: number, digits = 0) => v.toLocaleString('fr-FR', { maximumFractionDigits: digits, minimumFractionDigits: 0 });
const shortDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short' });
const fullDate = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' });

type State = { kind: 'loading' } | { kind: 'error' } | { kind: 'locked' } | { kind: 'ready'; stats: CoachStats };

/**
 * Onglet « Coach IA » : lancer une analyse (avec le quota du mois), puis la progression
 * (débit, mots parasites) et l'historique des analyses, réservés à Premium.
 */
export function ProgressScreen() {
  const router = useRouter();
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [more, startMore] = useTransition();
  const [quota, setQuota] = useState<CoachQuota | null>(null);

  useEffect(() => {
    loadCoachQuota().then((res) => res.ok && setQuota(res.data));
    Promise.all([loadCoachStats(), loadCoachHistory()]).then(([stats, history]) => {
      if ((!stats.ok && stats.code === 'AUTH') || (!history.ok && history.code === 'AUTH')) {
        notifySessionChange();
        router.replace('/connexion');
        return;
      }
      if (!stats.ok) return setState({ kind: stats.code === 'PREMIUM_REQUIRED' ? 'locked' : 'error' });
      setState({ kind: 'ready', stats: stats.data });
      if (history.ok) {
        setItems(history.data.items);
        setCursor(history.data.nextCursor);
      }
    });
  }, [router]);

  const loadMore = () =>
    startMore(async () => {
      if (!cursor) return;
      const res = await loadCoachHistory(cursor);
      if (!res.ok) return;
      setItems((prev) => [...prev, ...res.data.items]);
      setCursor(res.data.nextCursor);
    });

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -left-56 -top-40 size-[560px] opacity-45" />
      </div>
      <main className="relative mx-auto flex max-w-lg flex-col gap-5 px-5 pb-40 pt-[max(env(safe-area-inset-top),16px)] lg:max-w-4xl lg:pb-16">
        <header className="px-1 pt-2">
          <h1 className="text-[30px] font-bold tracking-[-0.03em]">Coach IA</h1>
        </header>

        <NewAnalysis quota={quota} />

        {state.kind === 'loading' && (
          <div aria-label="Chargement" className="flex flex-col gap-3">
            <span className="h-[104px] animate-pulse rounded-[22px] bg-white/[0.04]" />
            <span className="h-[240px] animate-pulse rounded-[22px] bg-white/[0.04]" />
            <span className="h-[240px] animate-pulse rounded-[22px] bg-white/[0.04]" />
          </div>
        )}
        {state.kind === 'error' && (
          <p className="py-16 text-center text-[15px] text-white/55">Impossible de charger ta progression. Réessaie plus tard.</p>
        )}
        {state.kind === 'locked' && <Locked />}
        {state.kind === 'ready' &&
          (state.stats.totalAnalyses === 0 ? (
            <Empty />
          ) : (
            <>
              <Summary stats={state.stats} />
              {/* Sur grand écran, les deux courbes côte à côte. */}
              <div className="flex flex-col gap-5 lg:grid lg:grid-cols-2">
                <ChartCard
                  title="Ton débit"
                  unit="mots/min"
                  hint="La bande bleue, c’est la zone idéale à l’oral (110 à 170 mots par minute)."
                  points={state.stats.series}
                  pick={(p) => p.wordsPerMinute}
                  digits={0}
                  band={IDEAL}
                  floor={60}
                  ceil={200}
                />
                <ChartCard
                  title="Mots parasites"
                  unit="par min"
                  hint="« Euh », « genre », « du coup »… Plus la courbe descend, mieux c’est."
                  points={state.stats.series}
                  pick={(p) => p.fillersPerMinute}
                  digits={1}
                  floor={0}
                  ceil={2}
                />
              </div>
              <History items={items} hasMore={!!cursor} loading={more} onMore={loadMore} />
            </>
          ))}
      </main>
    </div>
  );
}

/* ---------- Nouvelle analyse ---------- */

/** Carte d'appel : enregistrer une prise pour le coach, avec les analyses restantes ce mois-ci. */
function NewAnalysis({ quota }: { quota: CoachQuota | null }) {
  const empty = quota !== null && quota.remaining <= 0;
  return (
    <section className="glass-solid relative overflow-hidden rounded-[26px] p-5">
      <span
        aria-hidden
        className="pointer-events-none absolute -left-10 -top-14 size-48 rounded-full bg-[radial-gradient(closest-side,rgb(74_168_255/0.2),transparent)]"
      />
      <div className="relative flex items-center gap-4">
        <BlobBadge size={52} seed={1.4}>
          <SparkIcon size={22} />
        </BlobBadge>
        <div className="min-w-0 flex-1">
          <h2 className="text-[17px] font-bold leading-tight">Analyse une prise</h2>
          <p className="mt-0.5 text-[13.5px] leading-snug text-white/55">
            {quota === null
              ? 'Ton débit, tes mots parasites, ta structure.'
              : empty
                ? 'Plus d’analyse ce mois-ci.'
                : `${quota.remaining} ${quota.remaining > 1 ? 'analyses restantes' : 'analyse restante'} ce mois-ci`}
          </p>
        </div>
      </div>
      {empty && !quota.isPremium ? (
        <Link
          href="/premium"
          className="relative mt-4 flex h-12 items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-white shadow-[0_14px_40px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
          Passer Premium pour {PREMIUM_ANALYSES} analyses
        </Link>
      ) : (
        <Link
          href={COACH_HREF}
          aria-disabled={empty}
          className={`relative mt-4 flex h-12 items-center justify-center gap-2 rounded-full text-[15px] font-semibold transition-[filter] ${
            empty ? 'pointer-events-none bg-white/[0.08] text-white/45' : 'bg-accent text-white shadow-[0_14px_40px_-14px_var(--color-accent)] hover:brightness-110'
          }`}>
          <MicIcon size={17} />
          {empty ? 'De nouvelles analyses le 1er du mois' : 'Enregistrer pour le coach'}
        </Link>
      )}
    </section>
  );
}

/* ---------- Résumé ---------- */

function Summary({ stats }: { stats: CoachStats }) {
  const t = stats.trend;
  // Message principal : le progrès le plus parlant, formulé positivement quand c'est mérité.
  let headline: string | null = null;
  if (t && stats.series.length >= 2) {
    const n = Math.abs(t.fillersPerMinute);
    const words = `${num(n, 1)} ${n >= 2 ? 'mots parasites' : 'mot parasite'}`;
    if (t.fillersPerMinute < 0) headline = `${words} de moins par minute depuis tes débuts.`;
    else if (t.fillersPerMinute > 0) headline = `${words} de plus par minute qu’à tes débuts : concentre-toi dessus.`;
    else headline = 'Autant de mots parasites qu’à tes débuts : continue de t’entraîner.';
  }
  return (
    <>
      <div className="grid grid-cols-3 gap-2">
        <Tile value={num(stats.totalAnalyses)} label={stats.totalAnalyses > 1 ? 'analyses' : 'analyse'} />
        <Tile value={num(stats.averages.wordsPerMinute)} label="mots/min en moyenne" />
        <Tile value={num(stats.averages.fillersPerMinute, 1)} label="parasites/min en moyenne" />
      </div>
      {headline && (
        <section className="glass-solid relative flex items-center gap-3 overflow-hidden rounded-[22px] p-4">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 left-0 w-40 bg-[radial-gradient(80%_100%_at_0%_50%,rgb(74_168_255/0.16),transparent)]"
          />
          <BlobBadge size={40} seed={5.1}>
            <SparkIcon size={16} />
          </BlobBadge>
          <p className="relative text-[14px] font-medium leading-snug text-white/85">{headline}</p>
        </section>
      )}
    </>
  );
}

function Tile({ value, label }: { value: string; label: string }) {
  return (
    <div className="glass-solid flex min-w-0 flex-col rounded-[22px] p-3.5">
      <span className="text-[26px] font-black leading-none tracking-[-0.04em]">{value}</span>
      <span className="mt-1.5 text-[11.5px] font-medium leading-tight text-white/50">{label}</span>
    </div>
  );
}

/* ---------- Courbe ---------- */

const H = 168;
const PAD = { top: 12, right: 12, bottom: 24, left: 34 };

function ChartCard(props: {
  title: string;
  unit: string;
  hint: string;
  points: CoachPoint[];
  pick: (p: CoachPoint) => number;
  digits: number;
  band?: readonly [number, number];
  floor: number;
  ceil: number;
}) {
  const { title, unit, hint, points, pick, digits, band, floor, ceil } = props;
  const gradient = useId();
  const box = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const values = points.map(pick);
  const last = values[values.length - 1];
  // Échelle : englobe les valeurs (et la zone idéale), arrondie à un pas lisible.
  const step = ceil <= 5 ? 0.5 : 20;
  const lo = Math.max(0, Math.floor(Math.min(floor, ...values) / step) * step);
  const hi = Math.ceil(Math.max(ceil, ...values) / step) * step;
  const ticks = [lo, lo + Math.round((hi - lo) / 2 / step) * step, hi];

  const innerW = Math.max(0, width - PAD.left - PAD.right);
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (points.length === 1 ? innerW / 2 : (i / (points.length - 1)) * innerW);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo || 1)) * innerH;

  const line = values.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join('');
  const area = `${line}L${x(values.length - 1).toFixed(1)},${PAD.top + innerH}L${x(0).toFixed(1)},${PAD.top + innerH}Z`;

  const pointAt = (e: PointerEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = (e.clientX - rect.left - PAD.left) / (innerW || 1);
    setActive(Math.min(points.length - 1, Math.max(0, Math.round(rel * (points.length - 1)))));
  };
  const onKey = (e: KeyboardEvent<SVGSVGElement>) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault();
    const from = active ?? points.length - 1;
    setActive(Math.min(points.length - 1, Math.max(0, from + (e.key === 'ArrowRight' ? 1 : -1))));
  };

  const shown = active ?? null;

  return (
    <section className="glass-solid rounded-[22px] p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-[15px] font-semibold">{title}</h2>
        {/* Valeur lue : le point survolé, sinon la dernière analyse. */}
        <span aria-live="polite" className="text-right text-[13px] text-white/50">
          {shown === null ? 'Dernière' : fullDate.format(new Date(points[shown].date))} :{' '}
          <b className="font-semibold text-white">{num(shown === null ? last : values[shown], digits)}</b> {unit}
        </span>
      </div>

      <div ref={box} className="relative mt-4" style={{ height: H }}>
        {width > 0 && (
          <svg
            width={width}
            height={H}
            role="img"
            tabIndex={0}
            aria-label={`${title} : ${points.length} analyses, dernière valeur ${num(last, digits)} ${unit}. Flèches gauche et droite pour parcourir.`}
            className="touch-pan-y overflow-visible outline-none focus-visible:rounded-xl focus-visible:ring-2 focus-visible:ring-accent/60"
            onPointerMove={pointAt}
            onPointerDown={pointAt}
            onPointerLeave={() => setActive(null)}
            onKeyDown={onKey}
            onBlur={() => setActive(null)}>
            <defs>
              <linearGradient id={gradient} x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor="#4AA8FF" stopOpacity="0.22" />
                <stop offset="1" stopColor="#4AA8FF" stopOpacity="0" />
              </linearGradient>
            </defs>

            {/* Grille discrète + graduations */}
            {ticks.map((t) => (
              <g key={t}>
                <line x1={PAD.left} x2={PAD.left + innerW} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.07)" />
                <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-white/40 text-[11px] tabular-nums">
                  {num(t, 1)}
                </text>
              </g>
            ))}

            {band && (
              <rect
                x={PAD.left}
                width={innerW}
                y={y(Math.min(band[1], hi))}
                height={Math.max(0, y(Math.max(band[0], lo)) - y(Math.min(band[1], hi)))}
                rx={6}
                fill="rgb(74 168 255 / 0.10)"
              />
            )}

            {points.length > 1 && (
              <>
                <path d={area} fill={`url(#${gradient})`} />
                <path d={line} fill="none" stroke="#4AA8FF" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
              </>
            )}

            {/* Dernier point toujours marqué ; le point survolé par-dessus. */}
            <circle cx={x(values.length - 1)} cy={y(last)} r={4.5} fill="#4AA8FF" stroke="#16171b" strokeWidth={2} />
            {shown !== null && (
              <>
                <line x1={x(shown)} x2={x(shown)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgb(255 255 255 / 0.25)" strokeDasharray="3 3" />
                <circle cx={x(shown)} cy={y(values[shown])} r={6} fill="#4AA8FF" stroke="#16171b" strokeWidth={2} />
              </>
            )}

            {/* Dates de début et de fin */}
            <text x={x(0)} y={H - 4} textAnchor={points.length === 1 ? 'middle' : 'start'} className="fill-white/40 text-[11px]">
              {shortDate.format(new Date(points[0].date))}
            </text>
            {points.length > 1 && (
              <text x={x(points.length - 1)} y={H - 4} textAnchor="end" className="fill-white/40 text-[11px]">
                {shortDate.format(new Date(points[points.length - 1].date))}
              </text>
            )}
          </svg>
        )}

      </div>

      <p className="mt-3 text-[12.5px] leading-snug text-white/45">
        {points.length === 1 ? 'Ta courbe se dessine dès ta 2e analyse.' : hint}
      </p>
    </section>
  );
}

/* ---------- Historique ---------- */

function History({ items, hasMore, loading, onMore }: { items: HistoryItem[]; hasMore: boolean; loading: boolean; onMore: () => void }) {
  if (!items.length) return null;
  return (
    <section aria-label="Historique des analyses">
      <h2 className="mb-3 px-1 text-[18px] font-bold">Mes analyses</h2>
      <ul className="flex flex-col gap-2">
        {items.map((a) => {
          const m = a.metrics;
          return (
            <li key={a.id}>
              <Link
                href={`/analyse/${a.postId}`}
                className="glass-solid flex items-center gap-3 rounded-[20px] p-3.5 transition-colors hover:bg-white/[0.06]">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/80">
                  {a.post.type === 'video' ? <VideoIcon size={18} /> : <MicIcon size={18} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">{a.post.title || 'Prise sans titre'}</span>
                  <span className="block text-[12.5px] text-white/50">
                    {fullDate.format(new Date(a.createdAt))} · {a.post.duration} s
                  </span>
                </span>
                {m && (
                  <span className="shrink-0 text-right text-[12.5px] leading-tight text-white/60">
                    <b className="block text-[15px] font-semibold text-white">{num(m.wordsPerMinute)}</b>
                    mots/min
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={onMore}
          disabled={loading}
          className="mt-3 h-12 w-full rounded-full bg-white/[0.08] text-[15px] font-semibold transition-colors hover:bg-white/[0.12] disabled:opacity-60">
          {loading ? 'Chargement…' : 'Voir plus'}
        </button>
      )}
    </section>
  );
}

/* ---------- États ---------- */

function Locked() {
  return (
    <section className="glass-frame relative flex flex-col items-center overflow-hidden rounded-[28px] px-6 pb-7 pt-8 text-center">
      {/* Aperçu décoratif d'une courbe, flouté. */}
      <svg aria-hidden viewBox="0 0 300 90" className="pointer-events-none absolute inset-x-0 top-6 w-full opacity-40 blur-[2px]">
        <path d="M0 70 C40 66 60 40 100 48 S160 30 200 34 S260 14 300 18" fill="none" stroke="#4AA8FF" strokeWidth="3" />
      </svg>
      <div className="relative mt-12">
        <BlobBadge size={64} seed={2.4}>
          <SparkIcon size={24} />
        </BlobBadge>
      </div>
      <h2 className="relative mt-5 text-[22px] font-bold tracking-[-0.02em]">Vois tes progrès</h2>
      <p className="relative mt-2 max-w-xs text-[15px] leading-snug text-white/60">
        Avec Premium, chaque analyse alimente ta courbe : débit, mots parasites, et tout l’historique de tes prises.
      </p>
      <Link
        href="/premium"
        className="relative mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
        Découvrir Premium
      </Link>
    </section>
  );
}

function Empty() {
  return (
    <section className="glass-frame flex flex-col items-center rounded-[28px] p-7 text-center">
      <BlobBadge size={64} seed={4.2}>
        <MicIcon size={24} />
      </BlobBadge>
      <h2 className="mt-5 text-[20px] font-bold">Ta courbe commence ici</h2>
      <p className="mt-2 max-w-xs text-[15px] leading-snug text-white/60">
        Publie une prise puis demande une analyse au coach : tes chiffres apparaîtront ici.
      </p>
      <Link
        href="/creer"
        className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white transition-[filter] hover:brightness-110">
        Prendre la parole
      </Link>
    </section>
  );
}
