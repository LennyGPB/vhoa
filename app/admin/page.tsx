import Link from 'next/link';
import { Suspense } from 'react';

import { BlobBadge } from '@/components/BlobBadge';
import { AndroidIcon, AppleIcon, SparkIcon, VoiceWaveIcon } from '@/components/icons';
import { Logo } from '@/components/Logo';
import { requireAdmin } from '@/lib/admin-auth';
import { getStats, listEntries, PAGE_SIZE, type PlatformFilter, type WaitlistStats } from '@/lib/admin-data';

import { logoutAction } from './actions';
import { DeleteButton } from './DeleteButton';

const DATE = new Intl.DateTimeFormat('fr-FR', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'Europe/Paris',
});
const NUMBER = new Intl.NumberFormat('fr-FR');

type SearchParams = Record<string, string | string[] | undefined>;

function first(value: string | string[] | undefined) {
  return (Array.isArray(value) ? value[0] : value) ?? '';
}

/** Lien qui conserve les filtres en cours et n'en change qu'un. */
function href(current: { q: string; platform: PlatformFilter; page: number }, change: Partial<typeof current>) {
  const next = { ...current, ...change };
  const params = new URLSearchParams();
  if (next.q) params.set('q', next.q);
  if (next.platform !== 'all') params.set('platform', next.platform);
  if (next.page > 1) params.set('page', String(next.page));
  const query = params.toString();
  return query ? `/admin?${query}` : '/admin';
}

export default function AdminPage({ searchParams }: PageProps<'/admin'>) {
  // La session (cookie) et les filtres (URL) se lisent à la requête : derrière un Suspense.
  return (
    <Suspense fallback={<Skeleton />}>
      <Dashboard searchParams={searchParams} />
    </Suspense>
  );
}

async function Dashboard({ searchParams }: { searchParams: Promise<SearchParams> }) {
  await requireAdmin();

  const sp = await searchParams;
  const q = first(sp.q).trim().slice(0, 100);
  const platformParam = first(sp.platform);
  const platform: PlatformFilter = platformParam === 'ios' || platformParam === 'android' ? platformParam : 'all';
  const page = Math.max(1, Math.min(10_000, Number.parseInt(first(sp.page), 10) || 1));
  const current = { q, platform, page };

  let data: { stats: WaitlistStats; list: Awaited<ReturnType<typeof listEntries>> } | null = null;
  let failure: string | null = null;
  try {
    const [stats, list] = await Promise.all([getStats(), listEntries(current)]);
    data = { stats, list };
  } catch (error) {
    console.error('[admin] lecture impossible', error);
    failure =
      error instanceof Error && error.message.includes('does not exist')
        ? 'La table de la liste d’attente n’existe pas encore. Lance « npx prisma migrate deploy » dans vhoa-api.'
        : 'Impossible de lire la base pour le moment.';
  }

  const pages = data ? Math.max(1, Math.ceil(data.list.total / PAGE_SIZE)) : 1;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 pb-20 pt-6 sm:px-8 sm:pt-10">
      {/* En-tête */}
      <header className="glass-frame flex items-center justify-between gap-3 rounded-full py-2.5 pl-6 pr-2.5">
        <div className="flex items-center gap-3">
          <Logo height={26} />
          <span className="rounded-full bg-accent/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-accent">
            Admin
          </span>
        </div>
        <div className="flex items-center gap-2">
          <a
            href="/admin/export"
            className="glass hidden rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white sm:inline-flex">
            Exporter en CSV
          </a>
          <form action={logoutAction}>
            <button
              type="submit"
              className="rounded-full bg-white px-4 py-2.5 text-[13px] font-semibold text-canvas transition-[filter] hover:brightness-90">
              Déconnexion
            </button>
          </form>
        </div>
      </header>

      <h1 className="mt-12 text-[clamp(30px,4vw,44px)] font-bold tracking-[-0.03em]">Liste d’attente</h1>

      {failure || !data ? (
        <p className="glass-solid mt-8 rounded-[24px] p-6 text-[15px] text-[#FF8FA3]">{failure}</p>
      ) : (
        <>
          {/* Chiffres clés */}
          <section aria-label="Statistiques" className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <StatCard label="Inscrits" value={data.stats.total} icon={<VoiceWaveIcon size={18} />} highlight />
            <StatCard
              label="Cette semaine"
              value={data.stats.week}
              hint={`dont ${NUMBER.format(data.stats.today)} aujourd’hui`}
              icon={<SparkIcon size={18} />}
            />
            <SplitCard label="iPhone" value={data.stats.ios} total={data.stats.total} icon={<AppleIcon size={16} />} />
            <SplitCard
              label="Android"
              value={data.stats.android}
              total={data.stats.total}
              icon={<AndroidIcon size={16} />}
            />
          </section>

          {/* Filtres */}
          <section className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <form action="/admin" className="glass flex items-center gap-2 rounded-full p-1.5 pl-5 md:w-96">
              <label htmlFor="q" className="sr-only">
                Rechercher un email
              </label>
              <input
                id="q"
                name="q"
                type="search"
                defaultValue={q}
                placeholder="Rechercher un email…"
                className="min-w-0 flex-1 bg-transparent text-[14px] text-white outline-none placeholder:text-white/35"
              />
              {platform !== 'all' && <input type="hidden" name="platform" value={platform} />}
              <button
                type="submit"
                className="rounded-full bg-accent px-4 py-2 text-[13px] font-semibold text-white transition-[filter] hover:brightness-110">
                Chercher
              </button>
            </form>

            <nav aria-label="Filtrer par plateforme" className="glass inline-flex self-start rounded-full p-1">
              {(
                [
                  ['all', 'Tous'],
                  ['ios', 'iPhone'],
                  ['android', 'Android'],
                ] as const
              ).map(([value, label]) => (
                <Link
                  key={value}
                  href={href(current, { platform: value, page: 1 })}
                  aria-current={platform === value ? 'page' : undefined}
                  className={`rounded-full px-4 py-2 text-[13px] font-semibold transition-colors ${
                    platform === value
                      ? 'bg-accent text-white shadow-[0_8px_24px_-8px_var(--color-accent)]'
                      : 'text-white/60 hover:text-white'
                  }`}>
                  {label}
                </Link>
              ))}
            </nav>
          </section>

          {/* Liste */}
          <section className="glass-solid mt-4 overflow-hidden rounded-[28px]">
            <div className="flex items-center justify-between border-b border-white/[0.06] px-6 py-4 text-[13px] text-white/50">
              <span>
                {NUMBER.format(data.list.total)} résultat{data.list.total > 1 ? 's' : ''}
                {q && (
                  <>
                    {' '}
                    pour « <span className="text-white/85">{q}</span> »
                  </>
                )}
              </span>
              <a href="/admin/export" className="font-semibold text-accent sm:hidden">
                Export CSV
              </a>
            </div>

            {data.list.rows.length === 0 ? (
              <div className="flex flex-col items-center gap-4 px-6 py-16 text-center">
                <BlobBadge size={56}>
                  <VoiceWaveIcon size={20} />
                </BlobBadge>
                <p className="text-[15px] text-muted">
                  {q || platform !== 'all' ? 'Aucune inscription ne correspond.' : 'Personne pour l’instant. Ça arrive !'}
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-[14px]">
                <thead className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/40">
                  <tr>
                    <th scope="col" className="px-6 py-3 font-semibold">
                      Email
                    </th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold sm:table-cell">
                      Plateforme
                    </th>
                    <th scope="col" className="hidden px-3 py-3 font-semibold md:table-cell">
                      Inscription
                    </th>
                    <th scope="col" className="w-14 px-3 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.list.rows.map((row) => (
                    <tr key={row.id} className="border-t border-white/[0.05] transition-colors hover:bg-white/[0.025]">
                      <td className="max-w-0 px-6 py-3.5">
                        <p className="truncate font-medium text-white/90">{row.email}</p>
                        {/* Sur mobile, plateforme et date passent sous l'email. */}
                        <p className="mt-0.5 text-[12px] text-white/40 md:hidden">
                          <span className="sm:hidden">{row.platform === 'IOS' ? 'iPhone' : 'Android'} · </span>
                          {DATE.format(new Date(row.createdAt))}
                        </p>
                      </td>
                      <td className="hidden px-3 py-3.5 sm:table-cell">
                        <PlatformPill platform={row.platform} />
                      </td>
                      <td className="hidden whitespace-nowrap px-3 py-3.5 text-white/55 md:table-cell">
                        {DATE.format(new Date(row.createdAt))}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <DeleteButton id={row.id} email={row.email} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          {/* Pagination */}
          {pages > 1 && (
            <nav aria-label="Pages" className="mt-6 flex items-center justify-center gap-3 text-[13px]">
              <PageLink href={href(current, { page: page - 1 })} disabled={page <= 1}>
                ← Précédent
              </PageLink>
              <span className="text-white/50">
                Page {page} / {pages}
              </span>
              <PageLink href={href(current, { page: page + 1 })} disabled={page >= pages}>
                Suivant →
              </PageLink>
            </nav>
          )}
        </>
      )}
    </main>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  highlight,
}: {
  label: string;
  value: number;
  hint?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="glass-solid relative overflow-hidden rounded-[24px] p-5 sm:p-6">
      {highlight && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(80%_90%_at_0%_0%,rgb(74_168_255/0.22),transparent)]"
        />
      )}
      <div className="relative">
        <div className="flex items-center gap-2 text-[13px] font-medium text-white/55">
          <span className="text-accent">{icon}</span>
          {label}
        </div>
        <p className="mt-3 text-[clamp(30px,3.4vw,40px)] font-bold leading-none tracking-tight">{NUMBER.format(value)}</p>
        {hint && <p className="mt-2 text-[12px] text-white/40">{hint}</p>}
      </div>
    </div>
  );
}

/** Part d'une plateforme, avec sa barre de proportion. */
function SplitCard({ label, value, total, icon }: { label: string; value: number; total: number; icon: React.ReactNode }) {
  const share = total ? Math.round((value / total) * 100) : 0;
  return (
    <div className="glass-solid rounded-[24px] p-5 sm:p-6">
      <div className="flex items-center justify-between text-[13px] font-medium text-white/55">
        <span className="flex items-center gap-2">
          <span className="text-white/80">{icon}</span>
          {label}
        </span>
        <span className="text-azure">{share} %</span>
      </div>
      <p className="mt-3 text-[clamp(30px,3.4vw,40px)] font-bold leading-none tracking-tight">{NUMBER.format(value)}</p>
      <div className="mt-3 h-1.5 rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-gradient-to-r from-accent-strong to-azure" style={{ width: `${share}%` }} />
      </div>
    </div>
  );
}

function PlatformPill({ platform }: { platform: 'IOS' | 'ANDROID' }) {
  const ios = platform === 'IOS';
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[12px] font-medium text-white/75">
      {ios ? <AppleIcon size={12} /> : <AndroidIcon size={12} />}
      {ios ? 'iPhone' : 'Android'}
    </span>
  );
}

function PageLink({ href, disabled, children }: { href: string; disabled: boolean; children: React.ReactNode }) {
  if (disabled) return <span className="glass rounded-full px-4 py-2 text-white/25">{children}</span>;
  return (
    <Link href={href} className="glass rounded-full px-4 py-2 font-semibold text-white/85 transition-colors hover:text-white">
      {children}
    </Link>
  );
}

function Skeleton() {
  return (
    <main className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-8 sm:pt-10" aria-busy>
      <div className="glass-frame h-[60px] rounded-full" />
      <div className="mt-12 h-10 w-64 animate-pulse rounded-full bg-white/[0.06]" />
      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="glass-solid h-32 animate-pulse rounded-[24px]" />
        ))}
      </div>
      <div className="glass-solid mt-14 h-96 animate-pulse rounded-[28px]" />
    </main>
  );
}
