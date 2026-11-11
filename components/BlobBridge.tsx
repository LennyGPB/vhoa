'use client';

import { useEffect, useRef } from 'react';

import { animateWhileVisible } from '@/lib/blob';

/** Longueur de contact avec chaque carte et largeur de l'espace franchi. */
const SPAN = 200;
const GAP = 40;
/** Couleur des cartes .glass-solid : le pont doit se confondre avec elles. */
const FILL = '#16171b';

/**
 * Tracé du pont, pensé à l'horizontale (cartes à gauche et à droite) :
 * large contre chaque carte, il se resserre au milieu comme deux gouttes qui fusionnent.
 * `k` = largeur rentrée de chaque côté au niveau du col.
 */
function bridgePath(k: number) {
  const s = SPAN;
  const g = GAP;
  const m = g / 2;
  // Chaque flanc part tangent au bord de la carte, plonge vers le col, puis repart.
  return [
    `M 0 0`,
    `C 0 ${k * 0.55} ${m * 0.35} ${k} ${m} ${k}`,
    `C ${g - m * 0.35} ${k} ${g} ${k * 0.55} ${g} 0`,
    `L ${g} ${s}`,
    `C ${g} ${s - k * 0.55} ${g - m * 0.35} ${s - k} ${m} ${s - k}`,
    `C ${m * 0.35} ${s - k} 0 ${s - k * 0.55} 0 ${s}`,
    'Z',
  ].join(' ');
}

/** Pont « liquide » entre deux cartes (BlobBridge de l'app). Le col respire doucement. */
export function BlobBridge({
  orientation,
  phase = 0,
}: {
  orientation: 'horizontal' | 'vertical';
  /** Décalage pour que plusieurs ponts ne respirent pas en même temps. */
  phase?: number;
}) {
  const pathRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;
    // Col entre 44 et 64 : resserré puis relâché, sur ~5 s.
    return animateWhileVisible(path, 1, (t) =>
      path.setAttribute('d', bridgePath(54 + 10 * Math.sin(t * 1.3 + phase))),
    );
  }, [phase]);

  const vertical = orientation === 'vertical';

  return (
    <svg
      aria-hidden="true"
      width={vertical ? SPAN : GAP}
      height={vertical ? GAP : SPAN}
      viewBox={vertical ? `0 0 ${SPAN} ${GAP}` : `0 0 ${GAP} ${SPAN}`}
      className="block">
      {/* Version verticale : on bascule le tracé horizontal sur sa diagonale. */}
      <g transform={vertical ? 'matrix(0 1 1 0 0 0)' : undefined}>
        <path ref={pathRef} d={bridgePath(54 + 10 * Math.sin(phase))} fill={FILL} />
      </g>
    </svg>
  );
}

/**
 * Pont à placer entre deux cartes d'une grille `md:grid-cols-[1fr_40px_1fr…]` :
 * vertical quand les cartes sont empilées (mobile), horizontal à partir de `md`.
 */
export function CardBridge({ phase = 0 }: { phase?: number }) {
  return (
    <div className="flex justify-center md:items-center">
      <span className="md:hidden">
        <BlobBridge orientation="vertical" phase={phase} />
      </span>
      <span className="hidden md:block">
        <BlobBridge orientation="horizontal" phase={phase} />
      </span>
    </div>
  );
}
