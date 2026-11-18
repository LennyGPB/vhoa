'use client';

import { useEffect, useId, useRef, type ReactNode } from 'react';

import { animateWhileVisible, blobPath, type BlobLayer } from '@/lib/blob';

/**
 * Effets Premium autour de la photo de profil (comme les décorations d'avatar de Discord),
 * dans la D.A. de VHOA : formes liquides, bleu, voix. Animations en CSS / SVG, sans image.
 */

export type EffectId =
  | 'liquid'
  | 'wave'
  | 'aura'
  | 'orbit'
  | 'sparkle'
  | 'echo'
  | 'bubbles'
  | 'comet'
  | 'tide'
  | 'neon';

export const EFFECTS: { id: EffectId; name: string; description: string }[] = [
  { id: 'liquid', name: 'Goutte liquide', description: 'Une goutte bleue ondule derrière ta photo : la signature de VHOA.' },
  { id: 'wave', name: 'Onde de voix', description: 'Une onde sonore t’entoure et vibre, comme quand tu prends la parole.' },
  { id: 'aura', name: 'Aura', description: 'Un anneau lumineux bleu tourne lentement autour de toi.' },
  { id: 'orbit', name: 'Orbite', description: 'Trois gouttes gravitent autour de ta photo, chacune à son rythme.' },
  { id: 'sparkle', name: 'Étincelles', description: 'Des éclats scintillent autour de toi : l’effet « Convaincu ».' },
  { id: 'echo', name: 'Écho', description: 'Des ondes partent de ta photo et s’effacent, comme ta voix qui porte.' },
  { id: 'bubbles', name: 'Bulles', description: 'De petites bulles bleues remontent doucement autour de toi.' },
  { id: 'comet', name: 'Comète', description: 'Un arc lumineux file autour de ta photo en laissant sa traînée.' },
  { id: 'tide', name: 'Marée', description: 'Deux gouttes liquides superposées ondulent en décalé, comme une vague.' },
  { id: 'neon', name: 'Néon', description: 'Un anneau néon bleu respire doucement autour de toi.' },
];

const IDS = new Set<string>(EFFECTS.map((e) => e.id));

/** Vrai si la valeur (venue de l'API ou d'un cookie) est un effet connu. */
export function isEffectId(value: unknown): value is EffectId {
  return typeof value === 'string' && IDS.has(value);
}

const SHAPE: BlobLayer = { cx: 50, cy: 50, radius: 47, wobble: 0.09, points: 7, phase: 0 };

/** 1. Goutte liquide qui respire derrière la photo. */
function Liquid() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const ref = useRef<SVGPathElement>(null);
  useEffect(() => {
    const path = ref.current;
    if (!path) return;
    return animateWhileVisible(path, 1.2, (t) => path.setAttribute('d', blobPath(SHAPE, t)));
  }, []);
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full [filter:drop-shadow(0_0_10px_rgb(74_168_255/0.55))]">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9AD4FF" />
          <stop offset="0.5" stopColor="#4AA8FF" />
          <stop offset="1" stopColor="#1F66D1" />
        </linearGradient>
      </defs>
      <path ref={ref} d={blobPath(SHAPE, 0)} fill={`url(#${id})`} />
    </svg>
  );
}

/** 2. Onde de voix : des barres disposées en cercle, qui vibrent. */
function Wave() {
  const BARS = 36;
  return (
    <div aria-hidden className="absolute inset-0">
      {Array.from({ length: BARS }, (_, i) => (
        <span
          key={i}
          className="absolute left-1/2 top-1/2 block h-1/2 w-[2.5%] origin-top"
          style={{ transform: `rotate(${(i / BARS) * 360}deg)`, marginLeft: '-1.25%' }}>
          {/* Barre posée au bord extérieur, qui grandit vers l'extérieur. */}
          <span
            className="fx-wave-bar absolute bottom-0 left-0 block h-[22%] w-full origin-bottom rounded-full bg-gradient-to-t from-accent-strong to-azure"
            style={{ animationDelay: `${-((i * 173) % 1100)}ms` }}
          />
        </span>
      ))}
    </div>
  );
}

/** 3. Aura : anneau en dégradé conique qui tourne, avec sa lueur. */
function Aura() {
  const ring = 'conic-gradient(from 0deg, #1F66D1, #4AA8FF, #C7E8FF, #4AA8FF, #1F66D1, transparent 70%, #1F66D1)';
  // Anneau fin juste autour de la photo (closest-side : 100 % = bord de la zone).
  const mask = 'radial-gradient(circle closest-side, transparent 80%, #000 81%, #000 95%, transparent 96%)';
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="fx-spin absolute inset-[6%] rounded-full opacity-70 blur-md" style={{ background: ring, ['--fx-dur' as string]: '5s' }} />
      <div
        className="fx-spin absolute inset-[6%] rounded-full"
        style={{ background: ring, WebkitMask: mask, mask, ['--fx-dur' as string]: '5s' }}
      />
    </div>
  );
}

/** 4. Orbite : trois gouttes qui tournent autour, à des vitesses et distances différentes. */
function Orbit() {
  const drops = [
    { inset: '4%', size: '11%', dur: '4.5s', from: '0deg' },
    { inset: '9%', size: '8%', dur: '6.5s', from: '140deg' },
    { inset: '1%', size: '6%', dur: '8s', from: '250deg' },
  ];
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="absolute inset-[9%] rounded-full shadow-[inset_0_0_0_1px_rgb(124_196_250/0.25)]" />
      {drops.map((d, i) => (
        <div key={i} className="absolute" style={{ inset: d.inset, transform: `rotate(${d.from})` }}>
          <div className="fx-spin size-full" style={{ ['--fx-dur' as string]: d.dur }}>
            <span
              className="absolute left-1/2 top-0 block -translate-x-1/2 -translate-y-1/2 rounded-full bg-[linear-gradient(135deg,#C7E8FF,#4AA8FF_55%,#1F66D1)] shadow-[0_0_10px_rgb(74_168_255/0.8)]"
              style={{ width: d.size, height: d.size }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/** 5. Étincelles : éclats à 4 branches qui scintillent tour à tour autour de la photo. */
function Sparkle() {
  const spots = [
    { x: 12, y: 18, s: 16, d: 0 },
    { x: 86, y: 10, s: 12, d: 0.6 },
    { x: 94, y: 62, s: 15, d: 1.3 },
    { x: 70, y: 92, s: 11, d: 0.3 },
    { x: 18, y: 84, s: 13, d: 1.7 },
    { x: 2, y: 50, s: 10, d: 0.9 },
  ];
  return (
    <div aria-hidden className="absolute inset-0">
      {spots.map((p, i) => (
        <svg
          key={i}
          viewBox="0 0 24 24"
          className="fx-twinkle absolute -translate-x-1/2 -translate-y-1/2 text-azure [filter:drop-shadow(0_0_6px_rgb(124_196_250/0.9))]"
          style={{ left: `${p.x}%`, top: `${p.y}%`, width: `${p.s}%`, height: `${p.s}%`, animationDelay: `${p.d}s` }}>
          <path fill="currentColor" d="M12 0c.6 6.6 5.4 11.4 12 12-6.6.6-11.4 5.4-12 12-.6-6.6-5.4-11.4-12-12C6.6 11.4 11.4 6.6 12 0Z" />
        </svg>
      ))}
    </div>
  );
}

/** 6. Écho : trois ondes qui partent de la photo, décalées dans le temps. */
function Echo() {
  return (
    <div aria-hidden className="absolute inset-0">
      {[0, 0.8, 1.6].map((d) => (
        <span
          key={d}
          className="fx-ripple absolute inset-0 rounded-full shadow-[inset_0_0_0_2px_#4AA8FF,0_0_12px_rgb(74_168_255/0.5)]"
          style={{ animationDelay: `${d}s` }}
        />
      ))}
    </div>
  );
}

/** 7. Bulles : remontent autour de la photo, à des places et des vitesses différentes. */
function Bubbles() {
  const bubbles = [
    { x: 14, y: 70, s: 9, d: 0, dur: 2.8 },
    { x: 84, y: 76, s: 7, d: 0.7, dur: 3.2 },
    { x: 6, y: 46, s: 6, d: 1.5, dur: 2.6 },
    { x: 93, y: 50, s: 10, d: 1.1, dur: 3.4 },
    { x: 26, y: 88, s: 6, d: 2, dur: 3 },
    { x: 72, y: 92, s: 8, d: 0.3, dur: 2.9 },
  ];
  return (
    <div aria-hidden className="absolute inset-0">
      {bubbles.map((b, i) => (
        <span
          key={i}
          className="fx-rise absolute rounded-full bg-[radial-gradient(circle_at_35%_30%,#E6F4FF,#7CC4FA_45%,rgb(47_143_232/0.5))] shadow-[0_0_8px_rgb(124_196_250/0.6)]"
          style={{
            left: `${b.x}%`,
            top: `${b.y}%`,
            width: `${b.s}%`,
            height: `${b.s}%`,
            animationDelay: `${b.d}s`,
            ['--fx-dur' as string]: `${b.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/** 8. Comète : arc lumineux à traînée qui tourne autour de la photo. */
function Comet() {
  const tail = 'conic-gradient(from 0deg, transparent 0deg, transparent 230deg, rgb(74 168 255 / 0.15) 270deg, #4AA8FF 340deg, #E6F4FF 358deg, transparent 360deg)';
  const mask = 'radial-gradient(circle closest-side, transparent 82%, #000 83%, #000 94%, transparent 95%)';
  return (
    <div aria-hidden className="absolute inset-0">
      <div className="fx-spin absolute inset-[5%] rounded-full blur-[3px]" style={{ background: tail, WebkitMask: mask, mask, ['--fx-dur' as string]: '2.2s' }} />
      <div className="fx-spin absolute inset-[5%] rounded-full" style={{ background: tail, WebkitMask: mask, mask, ['--fx-dur' as string]: '2.2s' }} />
    </div>
  );
}

const TIDE_BACK: BlobLayer = { cx: 50, cy: 50, radius: 48, wobble: 0.1, points: 6, phase: 2.1 };
const TIDE_FRONT: BlobLayer = { cx: 50, cy: 50, radius: 42, wobble: 0.08, points: 7, phase: 0 };

/** 9. Marée : deux gouttes superposées qui ondulent en décalé. */
function Tide() {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const back = useRef<SVGPathElement>(null);
  const front = useRef<SVGPathElement>(null);
  useEffect(() => {
    const b = back.current;
    const f = front.current;
    if (!b || !f) return;
    return animateWhileVisible(b, 0.9, (t) => {
      b.setAttribute('d', blobPath(TIDE_BACK, t));
      f.setAttribute('d', blobPath(TIDE_FRONT, t * 1.3));
    });
  }, []);
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="absolute inset-0 size-full">
      <defs>
        <linearGradient id={`${id}b`} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1840A8" stopOpacity="0.55" />
          <stop offset="1" stopColor="#7CC4FA" stopOpacity="0.55" />
        </linearGradient>
        <linearGradient id={`${id}f`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#C7E8FF" />
          <stop offset="1" stopColor="#2F8FE8" />
        </linearGradient>
      </defs>
      <path ref={back} d={blobPath(TIDE_BACK, 0)} fill={`url(#${id}b)`} />
      <path ref={front} d={blobPath(TIDE_FRONT, 0)} fill={`url(#${id}f)`} />
    </svg>
  );
}

/** 10. Néon : anneau double (trait net + lueur) qui respire. */
function Neon() {
  return (
    <svg aria-hidden viewBox="0 0 100 100" className="fx-breathe absolute inset-0 size-full">
      <circle cx="50" cy="50" r="40" fill="none" stroke="#7CC4FA" strokeWidth="2.2" />
      <circle cx="50" cy="50" r="45" fill="none" stroke="#4AA8FF" strokeWidth="1" strokeDasharray="2 4" strokeLinecap="round" />
    </svg>
  );
}

const RENDER: Record<EffectId, () => ReactNode> = {
  liquid: () => <Liquid />,
  wave: () => <Wave />,
  aura: () => <Aura />,
  orbit: () => <Orbit />,
  sparkle: () => <Sparkle />,
  echo: () => <Echo />,
  bubbles: () => <Bubbles />,
  comet: () => <Comet />,
  tide: () => <Tide />,
  neon: () => <Neon />,
};

/**
 * Photo de profil + effet. L'effet occupe une zone 1,45 fois plus grande que la photo,
 * centrée dessus : la mise en page autour ne bouge pas (la photo garde sa taille).
 */
export function AvatarEffect({ effect, size, children }: { effect: EffectId | null; size: number; children: ReactNode }) {
  if (!effect) return <>{children}</>;
  const box = Math.round(size * 1.45);
  // Effets « derrière » la photo (pleins ou anneaux) ; les autres passent devant.
  const behind = effect === 'liquid' || effect === 'aura' || effect === 'tide' || effect === 'echo';
  return (
    <span className="relative inline-grid place-items-center" style={{ width: size, height: size }}>
      <span
        className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        style={{ width: box, height: box, zIndex: behind ? 0 : 2 }}>
        {RENDER[effect]()}
      </span>
      <span className="relative z-[1] rounded-full">{children}</span>
    </span>
  );
}
