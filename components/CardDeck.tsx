'use client';

import { useRef, useState, type PointerEvent, type ReactNode } from 'react';

/** Distance de glissement (px) au-delà de laquelle la carte part. */
const THRESHOLD = 70;
/** Durée de la sortie de la carte, avant qu'elle ne passe au fond du paquet. */
const LEAVE_MS = 260;
/* Décalage de chaque carte de derrière : elle dépasse sous la précédente, un peu plus petite. */
const OFFSET_Y = 18;
const SCALE_STEP = 0.06;

/**
 * Paquet de cartes empilées (mobile) : on fait glisser la carte du dessus à gauche ou à droite,
 * elle file sur le côté puis repasse au fond du paquet, et la suivante arrive devant.
 */
export function CardDeck({ cards, label }: { cards: ReactNode[]; label: string }) {
  const n = cards.length;
  const [front, setFront] = useState(0);
  const [dx, setDx] = useState(0);
  const [leaving, setLeaving] = useState<-1 | 0 | 1>(0);
  const drag = useRef<{ x: number; y: number; id: number; horizontal: boolean | null } | null>(null);

  /** La carte du dessus part du côté `dir`, puis `target` (par défaut la suivante) passe devant. */
  const next = (dir: -1 | 1, target?: number) => {
    if (leaving) return;
    setLeaving(dir);
    setDx(0);
    setTimeout(() => {
      setFront((f) => target ?? (f + 1) % n);
      setLeaving(0);
    }, LEAVE_MS);
  };

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    if (leaving) return;
    drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, horizontal: null };
  };
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const mx = e.clientX - d.x;
    const my = e.clientY - d.y;
    // On attend de savoir si le geste est horizontal : sinon, on laisse la page défiler.
    if (d.horizontal === null && Math.abs(mx) + Math.abs(my) > 8) {
      d.horizontal = Math.abs(mx) > Math.abs(my);
      if (d.horizontal) e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (d.horizontal) setDx(mx);
  };
  const onUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d?.horizontal) return;
    if (Math.abs(dx) > THRESHOLD) next(dx > 0 ? 1 : -1);
    else setDx(0);
  };

  return (
    <div role="region" aria-roledescription="carrousel" aria-label={label}>
      <div
        className="grid touch-pan-y select-none"
        style={{ paddingBottom: OFFSET_Y * (n - 1) }}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        onPointerCancel={onUp}>
        {cards.map((card, i) => {
          // Rang dans le paquet : 0 = carte du dessus.
          const rank = (i - front + n) % n;
          const isFront = rank === 0;
          let transform = `translateY(${rank * OFFSET_Y}px) scale(${1 - rank * SCALE_STEP})`;
          let transition = 'transform 420ms cubic-bezier(0.2, 0.9, 0.2, 1), filter 420ms, opacity 420ms';
          if (isFront && leaving) {
            transform = `translateX(${leaving * 115}%) rotate(${leaving * 14}deg)`;
            transition = `transform ${LEAVE_MS}ms cubic-bezier(0.4, 0, 1, 1), opacity ${LEAVE_MS}ms`;
          } else if (isFront && dx) {
            // La carte suit le doigt, en pivotant légèrement.
            transform = `translateX(${dx}px) rotate(${dx / 22}deg)`;
            transition = 'none';
          }
          return (
            <div
              key={i}
              aria-hidden={!isFront}
              className="rounded-[32px] shadow-[0_0_0_1px_rgb(255_255_255/0.09),0_24px_40px_-18px_rgb(0_0_0/0.9)] [grid-area:1/1] origin-bottom"
              style={{
                transform,
                transition,
                zIndex: n - rank,
                // Les cartes de derrière s'assombrissent un peu : on lit la profondeur du paquet.
                filter: `brightness(${1 - rank * 0.12})`,
                opacity: isFront && leaving ? 0.6 : 1,
              }}>
              {card}
            </div>
          );
        })}
      </div>

      {/* Points : le point actif s'étire (même langage que l'indicateur des prises). */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {cards.map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Étape ${i + 1}`}
            aria-current={i === front}
            onClick={() => {
              if (i !== front) next(1, i);
            }}
            className={`h-[7px] rounded-full transition-[width,background-color] duration-300 ${
              i === front ? 'w-5 bg-accent' : 'w-[7px] bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
