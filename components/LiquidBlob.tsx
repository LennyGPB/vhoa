'use client';

import { useEffect, useId, useRef } from 'react';

import { animateWhileVisible, blobPath, type BlobLayer } from '@/lib/blob';

/**
 * Couches du blob dans un viewBox de 400, de l'arrière vers l'avant : le corps, puis des replis
 * aplatis qui tournent lentement (clairs, sombres, irisés) et donnent l'effet de verre plié.
 */
const LAYERS = {
  body: { cx: 200, cy: 200, radius: 138, wobble: 0.11, points: 8, phase: 0, lobes: 0.09 },
  foldDark: { cx: 196, cy: 222, radius: 150, wobble: 0.14, points: 6, phase: 2.6, squash: 0.36, angle: 32, spin: 0.07 },
  foldLight: { cx: 212, cy: 168, radius: 140, wobble: 0.16, points: 6, phase: 1.3, squash: 0.32, angle: -24, spin: -0.06 },
  foldIris: { cx: 236, cy: 246, radius: 104, wobble: 0.2, points: 6, phase: 4.2, squash: 0.34, angle: 78, spin: 0.09 },
  ribbonA: { cx: 204, cy: 192, radius: 128, wobble: 0.18, points: 6, phase: 0.7, squash: 0.48, angle: -18, spin: -0.05 },
  ribbonB: { cx: 186, cy: 226, radius: 104, wobble: 0.22, points: 6, phase: 3.9, squash: 0.42, angle: 58, spin: 0.08 },
} satisfies Record<string, BlobLayer>;

type LayerName = keyof typeof LAYERS;

/**
 * Couche à l'instant `time`. Avec `intensity` > 1, la goutte se déforme davantage,
 * et le corps s'étire puis s'écrase en tournant, comme un liquide qui bouge.
 */
function layerAt(name: LayerName, time: number, intensity: number): BlobLayer {
  const base: BlobLayer = LAYERS[name];
  const layer: BlobLayer = {
    ...base,
    wobble: base.wobble * intensity,
    // Les bosses restent discrètes : trop fortes, la goutte devient triangulaire.
    lobes: (base.lobes ?? 0) * Math.min(intensity, 1.15),
  };
  if (name === 'body' && intensity > 1) {
    const k = intensity - 1;
    layer.squash = 1 + 0.12 * k * Math.sin(time * 1.15);
    layer.angle = 25 * Math.sin(time * 0.35);
    layer.cx = base.cx + 6 * k * Math.sin(time * 0.8);
    layer.cy = base.cy + 5 * k * Math.cos(time * 0.95);
  }
  return layer;
}

/** Même couche à une autre échelle (le viewBox fait 400 ; le découpage CSS travaille en pixels). */
function scaled(layer: BlobLayer, s: number): BlobLayer {
  return { ...layer, cx: layer.cx * s, cy: layer.cy * s, radius: layer.radius * s };
}

/**
 * Opacités des calques. En verre, le corps n'est plus qu'une teinte : on voit le décor à travers,
 * flouté, et ce sont les bords, les reflets et les replis qui dessinent la goutte.
 */
const TONES = {
  solid: { body: [1, 1, 1, 1, 1], dark: 1, light: 1, iris: 0.75, ribbons: 1, shade: 1, edge: 0 },
  glass: { body: [0.42, 0.22, 0.14, 0.3, 0.55], dark: 0.35, light: 0.7, iris: 0.6, ribbons: 1.2, shade: 0.45, edge: 1 },
};
const BODY_STOPS = [
  { offset: 0, color: '#CFEAFF' },
  { offset: 0.2, color: '#7CC4FA' },
  { offset: 0.46, color: '#2F8FE8' },
  { offset: 0.76, color: '#1840A8' },
  { offset: 1, color: '#0A1650' },
];
const LENS_FILTER = 'blur(7px) saturate(170%) brightness(1.12)';

export interface LiquidBlobProps {
  className?: string;
  /** Vitesse de l'animation (1 = rythme de l'app). */
  speed?: number;
  /** Décale l'animation pour que deux blobs ne bougent pas pareil. */
  seed?: number;
  /** Halo lumineux autour du blob. */
  glow?: boolean;
  /** Force de la déformation (1 = douce, 2 = très liquide). */
  intensity?: number;
  /** Goutte en verre : on voit, flouté, ce qu'il y a derrière. */
  glass?: boolean;
}

/** Goutte liquide irisée en bleu, signature visuelle de VHOA. */
export function LiquidBlob({
  className,
  speed = 0.55,
  seed = 0,
  glow = true,
  intensity = 1,
  glass = false,
}: LiquidBlobProps) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const lensRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const svg = svgRef.current;
    if (!root || !svg) return;
    // Chaque <path data-layer="…"> suit sa couche (le corps apparaît plusieurs fois : clip, contour…).
    const groups = (Object.keys(LAYERS) as LayerName[]).map(
      (name) => [name, svg.querySelectorAll<SVGPathElement>(`path[data-layer="${name}"]`)] as const,
    );
    const lens = lensRef.current;
    let scale = root.clientWidth / 400;
    let time = seed;

    // Le verre flou est un <div> découpé exactement à la forme du corps (clip-path en pixels).
    const updateLens = () => {
      if (!lens || !scale) return;
      const d = blobPath(scaled(layerAt('body', time, intensity), scale), time);
      lens.style.clipPath = `path('${d}')`;
    };
    const resize = new ResizeObserver(() => {
      scale = root.clientWidth / 400;
      updateLens();
    });
    resize.observe(root);

    const stop = animateWhileVisible(svg, speed, (t) => {
      time = t + seed;
      for (const [name, els] of groups) {
        const d = blobPath(layerAt(name, time, intensity), time);
        els.forEach((el) => el.setAttribute('d', d));
      }
      updateLens();
    });
    return () => {
      stop();
      resize.disconnect();
    };
  }, [intensity, seed, speed]);

  // Tracés initiaux identiques côté serveur et client (pas d'écart d'hydratation).
  const layer = (name: LayerName) => ({
    'data-layer': name,
    d: blobPath(layerAt(name, seed, intensity), seed),
  });
  const url = (name: string) => `url(#${id}-${name})`;
  const tone = TONES[glass ? 'glass' : 'solid'];

  return (
    <div ref={rootRef} className={`relative ${className ?? ''}`}>
      {glass && (
        <div
          ref={lensRef}
          aria-hidden
          className="absolute inset-0"
          // Avant le premier calcul de forme, rien n'est flouté.
          style={{ backdropFilter: LENS_FILTER, WebkitBackdropFilter: LENS_FILTER, clipPath: 'circle(0)' }}
        />
      )}
      <svg
        ref={svgRef}
        viewBox="0 0 400 400"
        className="relative block h-auto w-full"
        aria-hidden="true"
        style={{ overflow: 'visible' }}>
        <defs>
          <linearGradient id={`${id}-body`} x1="0.1" y1="0.05" x2="0.85" y2="0.98">
            {BODY_STOPS.map((stop, i) => (
              <stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={tone.body[i]} />
            ))}
          </linearGradient>
          <linearGradient id={`${id}-light`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#F2F9FF" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#6CC0FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#2F8FE8" stopOpacity="0" />
          </linearGradient>
          {/* Reflet irisé : cyan vers violet, très léger, comme une bulle de savon. */}
          <linearGradient id={`${id}-iris`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#7DF0FF" stopOpacity="0.7" />
            <stop offset="0.55" stopColor="#6E8BFF" stopOpacity="0.45" />
            <stop offset="1" stopColor="#B07CFF" stopOpacity="0.55" />
          </linearGradient>
          <linearGradient id={`${id}-dark`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#030A26" stopOpacity="0.2" />
            <stop offset="0.6" stopColor="#030A26" stopOpacity="0.85" />
            <stop offset="1" stopColor="#030A26" stopOpacity="0.4" />
          </linearGradient>
          <radialGradient id={`${id}-shade`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#020822" stopOpacity="0.8" />
            <stop offset="1" stopColor="#020822" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="0.35" stopColor="#8FF3FF" stopOpacity="0.55" />
            <stop offset="0.7" stopColor="#9C8CFF" stopOpacity="0.45" />
            <stop offset="1" stopColor="#4AA8FF" stopOpacity="0.2" />
          </linearGradient>
          {/* Bord épais et lumineux : vu de biais, le verre a plus de matière sur les bords. */}
          <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E8F6FF" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#5CB8FF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#7A6BFF" stopOpacity="0.7" />
          </linearGradient>
          <linearGradient id={`${id}-ribbon`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="0.5" stopColor="#A6E6FF" stopOpacity="0.25" />
            <stop offset="1" stopColor="#C2A6FF" stopOpacity="0.6" />
          </linearGradient>
          <radialGradient id={`${id}-spec`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.95" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`${id}-glow`} cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#4AA8FF" stopOpacity="0.5" />
            <stop offset="0.55" stopColor="#2F8FE8" stopOpacity="0.16" />
            <stop offset="1" stopColor="#2F8FE8" stopOpacity="0" />
          </radialGradient>
          <filter id={`${id}-soft`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
          <filter id={`${id}-thin`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="1.4" />
          </filter>
          <filter id={`${id}-edgeblur`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="9" />
          </filter>
          <clipPath id={`${id}-clip`}>
            <path {...layer('body')} />
          </clipPath>
        </defs>

        {glow && <circle cx="200" cy="200" r="250" fill={url('glow')} opacity={glass ? 0.6 : 1} />}

        <path {...layer('body')} fill={url('body')} />

        <g clipPath={url('clip')}>
          <path {...layer('foldDark')} fill={url('dark')} filter={url('soft')} opacity={tone.dark} />
          <path
            {...layer('foldLight')}
            fill={url('light')}
            filter={url('soft')}
            opacity={tone.light}
            style={{ mixBlendMode: 'screen' }}
          />
          <path
            {...layer('foldIris')}
            fill={url('iris')}
            filter={url('soft')}
            opacity={tone.iris}
            style={{ mixBlendMode: 'screen' }}
          />
          <path
            {...layer('ribbonA')}
            fill="none"
            stroke={url('ribbon')}
            strokeWidth="5"
            filter={url('thin')}
            opacity={0.6 * tone.ribbons}
          />
          <path
            {...layer('ribbonB')}
            fill="none"
            stroke={url('ribbon')}
            strokeWidth="3"
            filter={url('thin')}
            opacity={0.45 * tone.ribbons}
          />
          {tone.edge > 0 && (
            <path
              {...layer('body')}
              fill="none"
              stroke={url('edge')}
              strokeWidth="34"
              filter={url('edgeblur')}
              opacity={0.75 * tone.edge}
            />
          )}
          {/* Ombre interne en bas à droite pour asseoir le volume. */}
          <circle cx="300" cy="310" r="150" fill={url('shade')} opacity={tone.shade} />
          {/* Reflets spéculaires. */}
          <ellipse
            cx="138"
            cy="116"
            rx="48"
            ry="20"
            transform="rotate(-34 138 116)"
            fill={url('spec')}
            filter={url('thin')}
          />
          {glass && (
            <ellipse
              cx="270"
              cy="292"
              rx="26"
              ry="9"
              transform="rotate(-38 270 292)"
              fill={url('spec')}
              filter={url('thin')}
              opacity="0.55"
            />
          )}
        </g>

        <path {...layer('body')} fill="none" stroke={url('rim')} strokeWidth={glass ? 2 : 1.6} />
      </svg>
    </div>
  );
}
