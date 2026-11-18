'use client';

import { useEffect } from 'react';

import { recordViews } from '@/app/actions/feed';

/** Durée minimale à l'écran pour qu'une prise compte comme vue. */
const VIEW_AFTER_MS = 2000;
const FLUSH_EVERY_MS = 8000;

// Partagés par toute la page : une prise n'est envoyée qu'une fois par visite.
const sent = new Set<string>();
const queue = new Set<string>();
let timer: ReturnType<typeof setInterval> | undefined;

function flush() {
  if (!queue.size) return;
  const ids = [...queue];
  queue.clear();
  ids.forEach((id) => sent.add(id));
  recordViews(ids).catch(() => ids.forEach((id) => sent.delete(id)));
}

/**
 * Compte la vue de la prise affichée (`postId`) si elle reste à l'écran au moins 2 s.
 * Les vues partent par lots toutes les 8 s, et quand l'onglet passe en arrière-plan.
 */
export function useViewTracker(postId: string | null, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    timer ??= setInterval(flush, FLUSH_EVERY_MS);
    const onHide = () => document.visibilityState === 'hidden' && flush();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      clearInterval(timer);
      timer = undefined;
      flush();
    };
  }, [enabled]);

  useEffect(() => {
    if (!enabled || !postId || sent.has(postId) || queue.has(postId)) return;
    const t = setTimeout(() => {
      if (document.visibilityState === 'visible') queue.add(postId);
    }, VIEW_AFTER_MS);
    return () => clearTimeout(t);
  }, [postId, enabled]);
}
