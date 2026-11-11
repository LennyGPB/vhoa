const TWO_PI = Math.PI * 2;

export interface BlobLayer {
  /** Centre du tracé (unités du viewBox). */
  cx: number;
  cy: number;
  radius: number;
  /** Déformation maximale (part du rayon). */
  wobble: number;
  points: number;
  /** Décalage de phase : deux couches avec la même phase bougent ensemble. */
  phase: number;
  /** Rotation lente du tracé (radians par unité de temps). */
  spin?: number;
  /** Aplatissement (1 = rond) : une goutte écrasée devient un repli, un ruban. */
  squash?: number;
  /** Orientation de départ (degrés). */
  angle?: number;
  /** Bosses régulières en plus de la respiration (forme plus « froissée »). */
  lobes?: number;
}

/**
 * Goutte fermée qui respire (même principe que BlobShape dans l'app) :
 * des points autour du centre, chacun avec son rythme, reliés par une courbe Catmull-Rom.
 */
export function blobPath(layer: BlobLayer, time: number): string {
  const { cx, cy, radius, wobble, points, phase, spin = 0, squash = 1, angle = 0, lobes = 0 } =
    layer;
  const rot = (angle * Math.PI) / 180 + time * spin;
  const cos = Math.cos(rot);
  const sin = Math.sin(rot);
  const pts: [number, number][] = [];
  for (let i = 0; i < points; i++) {
    const a = (i / points) * TWO_PI - Math.PI / 2;
    const wave =
      0.6 * Math.sin(time * (i % 2 === 0 ? 1 : 1.6) + i * 1.9 + phase) +
      0.4 * Math.sin(time * 0.7 + i * 0.8 + phase * 2);
    const r = radius * (1 + wobble * wave + lobes * Math.sin(a * 3 + time * 0.4 + phase));
    const x = r * Math.cos(a);
    const y = r * Math.sin(a) * squash;
    pts.push([cx + x * cos - y * sin, cy + x * sin + y * cos]);
  }
  const f = (n: number) => n.toFixed(2);
  let d = `M ${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < points; i++) {
    const p0 = pts[(i - 1 + points) % points];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % points];
    const p3 = pts[(i + 2) % points];
    d += ` C ${f(p1[0] + (p2[0] - p0[0]) / 6)} ${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(
      p2[0] - (p3[0] - p1[0]) / 6,
    )} ${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])} ${f(p2[1])}`;
  }
  return `${d} Z`;
}

/**
 * Lance une boucle d'animation qui ne tourne que lorsque l'élément est visible
 * et qui ralentit si « réduire les animations » est actif. Renvoie la fonction de nettoyage.
 */
export function animateWhileVisible(
  target: Element,
  speed: number,
  onFrame: (time: number) => void,
): () => void {
  // « Réduire les animations » (souvent coupé d'office sous Windows) : la goutte reste vivante,
  // c'est la signature du site, mais bouge nettement plus lentement.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) speed *= 0.4;
  let raf = 0;
  let visible = false;
  const start = performance.now();
  const tick = (now: number) => {
    raf = 0;
    if (!visible) return;
    onFrame(((now - start) / 1000) * speed);
    raf = requestAnimationFrame(tick);
  };
  const io = new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    if (visible && !raf) raf = requestAnimationFrame(tick);
  });
  io.observe(target);
  return () => {
    io.disconnect();
    cancelAnimationFrame(raf);
  };
}
