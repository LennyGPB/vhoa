'use client';

import { type ReactNode, useEffect, useId, useRef } from 'react';

import { animateWhileVisible, blobPath, type BlobLayer } from '@/lib/blob';

const SHAPE: BlobLayer = { cx: 50, cy: 50, radius: 44, wobble: 0.07, points: 7, phase: 0 };

/** Petite goutte en dégradé bleu qui respire, avec une icône au centre (BlobShape de l'app). */
export function BlobBadge({
  children,
  size = 64,
  seed = 0,
}: {
  children: ReactNode;
  size?: number;
  seed?: number;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const paths = svg.querySelectorAll('path');
    return animateWhileVisible(svg, 1.1, (t) => {
      const d = blobPath(SHAPE, t + seed);
      paths.forEach((p) => p.setAttribute('d', d));
    });
  }, [seed]);

  const d = blobPath(SHAPE, seed);

  return (
    <div className="relative grid shrink-0 place-items-center text-white" style={{ width: size, height: size }}>
      <svg ref={svgRef} viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-g`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#7CC4FA" />
            <stop offset="1" stopColor="#2F8FE8" />
          </linearGradient>
          <radialGradient id={`${id}-h`} cx="0.32" cy="0.25" r="0.45">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.55" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <path d={d} fill={`url(#${id}-g)`} />
        {/* Reflet, même tracé que la goutte pour ne jamais déborder. */}
        <path d={d} fill={`url(#${id}-h)`} />
      </svg>
      <span className="relative">{children}</span>
    </div>
  );
}
