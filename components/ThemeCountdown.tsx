'use client';

import { useEffect, useState } from 'react';

/** Fin de la semaine en cours : dimanche 23 h 59 (même règle que l'app). */
function endOfWeek(now: Date) {
  const end = new Date(now);
  end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
  end.setHours(23, 59, 0, 0);
  return end;
}

function format(ms: number) {
  const minutes = Math.max(0, Math.floor(ms / 60_000));
  const d = Math.floor(minutes / 1440);
  const h = Math.floor((minutes % 1440) / 60);
  const m = minutes % 60;
  if (d > 0) return `${d} j ${h} h`;
  if (h > 0) return `${h} h ${m} min`;
  return `${m} min`;
}

/**
 * Temps restant avant la clôture du thème. Calculé côté navigateur uniquement
 * (l'heure du serveur et celle du visiteur diffèrent) : rien n'est affiché avant.
 */
export function ThemeCountdown({ endsAt }: { endsAt?: string }) {
  const [left, setLeft] = useState<string | null>(null);

  useEffect(() => {
    const end = endsAt ? new Date(endsAt) : endOfWeek(new Date());
    const tick = () => setLeft(format(end.getTime() - Date.now()));
    tick();
    const id = setInterval(tick, 30_000);
    return () => clearInterval(id);
  }, [endsAt]);

  return <span className="tabular-nums">{left ? `encore ${left}` : ' '}</span>;
}
