'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useId, useRef, useState, type ComponentType } from 'react';

import { unreadCount } from '@/app/actions/me';
import { animateWhileVisible } from '@/lib/blob';
import { CREATE_HREF, SIGNUP_HREF } from '@/lib/site';
import { useSessionUser } from '@/lib/use-session';

import { BellIcon, CompassIcon, PersonIcon, PlayCircleIcon, PlusIcon } from './icons';

/* Mêmes mesures que la GlassTabBar de l'app. */
const BAR_HEIGHT = 62;
const BUMP_HEIGHT = 22;
const BUMP_WIDTH = 158;
const RADIUS = 24;
const SHAPE_HEIGHT = BAR_HEIGHT + BUMP_HEIGHT;
const CREATE_SIZE = 52;
const INDICATOR_WIDTH = 26;

interface Tab {
  label: string;
  /** Lien pour un visiteur. */
  href: string;
  /** Lien une fois connecté (sinon le même). */
  memberHref?: string;
  Icon?: ComponentType<{ size?: number; filled?: boolean }>;
  /** Onglet actif sur cette page. */
  match?: (pathname: string) => boolean;
  featured?: boolean;
}

/**
 * Mêmes onglets que l'app. Ce qui demande un compte mène à l'inscription pour un visiteur.
 * Une fois connecté, Alertes et Profil mènent aux pages du membre.
 */
const TABS: Tab[] = [
  { label: 'Explorer', href: '/', Icon: CompassIcon, match: (p) => p === '/' },
  { label: 'Feed', href: '/feed', Icon: PlayCircleIcon, match: (p) => p.startsWith('/feed') },
  { label: 'Créer', href: CREATE_HREF, featured: true, match: (p) => p === '/creer' },
  { label: 'Alertes', href: SIGNUP_HREF, memberHref: '/alertes', Icon: BellIcon, match: (p) => p === '/alertes' },
  { label: 'Profil', href: '/connexion', memberHref: '/profil', Icon: PersonIcon, match: (p) => p === '/profil' },
];

/** Contour de la barre : rectangle arrondi avec une bosse douce au centre (tracé de l'app). */
function barPath(w: number) {
  const top = BUMP_HEIGHT;
  const bottom = SHAPE_HEIGHT;
  const cx = w / 2;
  const half = BUMP_WIDTH / 2;
  const r = RADIUS;
  return [
    `M 0 ${top + r}`,
    `Q 0 ${top} ${r} ${top}`,
    `L ${cx - half} ${top}`,
    `C ${cx - half * 0.55} ${top} ${cx - half * 0.6} 0 ${cx} 0`,
    `C ${cx + half * 0.6} 0 ${cx + half * 0.55} ${top} ${cx + half} ${top}`,
    `L ${w - r} ${top}`,
    `Q ${w} ${top} ${w} ${top + r}`,
    `L ${w} ${bottom - r}`,
    `Q ${w} ${bottom} ${w - r} ${bottom}`,
    `L ${r} ${bottom}`,
    `Q 0 ${bottom} 0 ${bottom - r}`,
    'Z',
  ].join(' ');
}

/** Goutte qui se déforme en continu (BlobShape de l'app) : 7 points reliés par une courbe lisse. */
function wobblyPath(size: number, time: number, wobble = 0.09) {
  const POINTS = 7;
  const c = size / 2;
  const base = c * (1 - wobble);
  const pts: [number, number][] = [];
  for (let i = 0; i < POINTS; i++) {
    const angle = (i / POINTS) * Math.PI * 2 - Math.PI / 2;
    const r = base * (1 + wobble * Math.sin(time * (i % 2 === 0 ? 1 : 2) + i * 1.9) * 0.9);
    pts.push([c + r * Math.cos(angle), c + r * Math.sin(angle)]);
  }
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < POINTS; i++) {
    const p0 = pts[(i - 1 + POINTS) % POINTS];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % POINTS];
    const p3 = pts[(i + 2) % POINTS];
    d += ` C ${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${
      p2[1] - (p3[1] - p1[1]) / 6
    } ${p2[0]} ${p2[1]}`;
  }
  return `${d} Z`;
}

function CreateBlob() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    // Un cycle toutes les ~4 s, comme dans l'app.
    return animateWhileVisible(path, 1.5, (t) => path.setAttribute('d', wobblyPath(CREATE_SIZE, t)));
  }, []);

  return (
    <span
      // shrink-0 : l'onglet central déborde volontairement dans la bosse, la goutte ne doit pas s'écraser.
      className="relative grid shrink-0 place-items-center transition-transform duration-200 group-active:scale-[0.92]"
      style={{ width: CREATE_SIZE, height: CREATE_SIZE }}>
      <svg
        aria-hidden
        width={CREATE_SIZE}
        height={CREATE_SIZE}
        className="absolute inset-0 [filter:drop-shadow(0_4px_16px_rgb(74_168_255/0.6))]">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6FBCFF" />
            <stop offset="1" stopColor="#1F66D1" />
          </linearGradient>
        </defs>
        <path ref={pathRef} d={wobblyPath(CREATE_SIZE, 0)} fill={`url(#${id})`} />
      </svg>
      <PlusIcon size={24} className="relative text-white transition-transform duration-200 group-active:rotate-90" />
    </span>
  );
}

/**
 * Barre d'onglets flottante, sur mobile uniquement (D.A. de l'app) : verre fumé découpé
 * à la forme de la barre, bosse centrale pour la goutte « Créer », trait bleu sous l'onglet actif.
 */
export function TabBar() {
  const pathname = usePathname();
  const member = useSessionUser() !== null;
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [unread, setUnread] = useState(0);

  // Point rouge sur Alertes : nombre de non lues, relu à chaque page (sauf sur Alertes même).
  const onAlerts = pathname === '/alertes';
  useEffect(() => {
    if (!member || onAlerts) return;
    let cancelled = false;
    unreadCount()
      .then((n) => !cancelled && setUnread(n))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [member, onAlerts, pathname]);
  const showDot = member && !onAlerts && unread > 0;

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const activeIndex = TABS.findIndex((t) => t.match?.(pathname));
  const itemWidth = width / TABS.length;
  const path = width > 0 ? barPath(width) : '';

  return (
    <nav
      aria-label="Navigation"
      className="fixed inset-x-0 z-40 px-4 md:hidden"
      style={{ bottom: 'max(env(safe-area-inset-bottom), 12px)' }}>
      <div ref={ref} className="relative" style={{ height: SHAPE_HEIGHT }}>
        {width > 0 && (
          <>
            {/* Ombre, séparée du verre : un `filter` sur un parent couperait le flou. */}
            <svg aria-hidden width={width} height={SHAPE_HEIGHT} className="absolute inset-0 translate-y-2.5 blur-xl">
              <path d={path} fill="rgb(0 0 0 / 0.45)" />
            </svg>
            {/* Verre : flou + voile fumé, découpés à la forme de la barre. */}
            <div
              aria-hidden
              className="absolute inset-0 bg-[rgb(22_22_24/0.74)] backdrop-blur-[20px] backdrop-saturate-150"
              style={{ clipPath: `path('${path}')` }}
            />
            {/* Liseré très discret qui dessine la silhouette. */}
            <svg aria-hidden width={width} height={SHAPE_HEIGHT} className="absolute inset-0">
              <path d={path} fill="none" stroke="rgb(255 255 255 / 0.08)" />
            </svg>
            {/* Trait lumineux bleu sous l'onglet actif. */}
            {activeIndex >= 0 && !TABS[activeIndex].featured && (
              <span
                aria-hidden
                className="absolute bottom-[5px] h-[3px] rounded-full bg-accent shadow-[0_0_10px_var(--color-accent)]"
                style={{ width: INDICATOR_WIDTH, left: itemWidth * (activeIndex + 0.5) - INDICATOR_WIDTH / 2 }}
              />
            )}
          </>
        )}

        <ul className="absolute inset-x-0 bottom-0 flex" style={{ height: BAR_HEIGHT }}>
          {TABS.map((tab, i) => {
            const active = i === activeIndex;
            return (
              <li key={tab.label} className="flex-1">
                <Link
                  href={member && tab.memberHref ? tab.memberHref : tab.href}
                  aria-current={active ? 'page' : undefined}
                  aria-label={tab.label === 'Alertes' && showDot ? `Alertes, ${unread} non lues` : undefined}
                  className={`group flex h-full flex-col items-center justify-end gap-[3px] pb-[11px] text-[10px] ${
                    active ? 'font-semibold text-white' : 'font-medium text-white/50'
                  }`}>
                  {tab.featured ? (
                    <CreateBlob />
                  ) : (
                    tab.Icon && (
                      <span className="relative">
                        <tab.Icon size={22} filled={active} />
                        {tab.label === 'Alertes' && showDot && (
                          <span className="absolute -right-1 -top-0.5 size-[9px] rounded-full bg-[#FF4D6D] ring-[1.5px] ring-[#1A1A1C]" />
                        )}
                      </span>
                    )
                  )}
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
