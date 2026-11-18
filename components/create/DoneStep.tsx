'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { postStatus, type PublishMode } from '@/app/actions/create';

import { LiquidBlob } from '../LiquidBlob';

/** Vérifications espacées de 2,5 s, pendant 4 minutes au plus. */
const POLL_MS = 2500;
const POLL_MAX = 96;

type Final = 'published' | 'draft' | 'private' | 'rejected' | 'failed' | 'removed';

const COPY: Record<Final | 'processing' | 'timeout', { title: string; text: string }> = {
  processing: {
    title: 'Vérification en cours',
    text: 'On convertit, on transcrit et on vérifie ta prise. Ça prend en général moins d’une minute.',
  },
  published: { title: 'C’est en ligne !', text: 'Ta prise est dans le feed. Que le meilleur convainque !' },
  draft: { title: 'Brouillon enregistré', text: 'Gardé pour plus tard, rien n’est publié.' },
  private: { title: 'Ton coach est sur le coup', text: 'Ton analyse arrive : débit, mots parasites, silences et conseils.' },
  rejected: { title: 'Prise refusée', text: 'Elle ne respecte pas les règles de la communauté.' },
  removed: { title: 'Prise refusée', text: 'Elle ne respecte pas les règles de la communauté.' },
  failed: { title: 'Le traitement a échoué', text: 'Le fichier n’a pas pu être lu. Réessaie avec une nouvelle prise.' },
  timeout: {
    title: 'Ça prend plus de temps que prévu',
    text: 'Ta prise est toujours en traitement. Elle apparaîtra dès qu’elle sera prête.',
  },
};

/** Étape 4 : suivi du traitement côté serveur, puis la suite logique selon le résultat. */
export function DoneStep({ postId, mode, onAgain }: { postId: string; mode: PublishMode; onAgain: () => void }) {
  const [state, setState] = useState<keyof typeof COPY>('processing');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let tries = 0;
    let timer: ReturnType<typeof setTimeout>;
    let stopped = false;
    const poll = async () => {
      const res = await postStatus(postId);
      if (stopped) return;
      tries++;
      if (res.ok && res.data.status !== 'processing' && res.data.status !== 'uploading') {
        setState((res.data.status in COPY ? res.data.status : 'failed') as Final);
        setMessage(res.data.message ?? null);
        return;
      }
      if (tries >= POLL_MAX) return setState('timeout');
      timer = setTimeout(poll, POLL_MS);
    };
    timer = setTimeout(poll, 1200);
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [postId]);

  const copy = COPY[state];
  const bad = state === 'rejected' || state === 'removed' || state === 'failed';
  const waiting = state === 'processing';

  return (
    <div className="relative isolate flex min-h-svh items-center justify-center overflow-hidden px-6">
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[170vw] -translate-x-1/2 -translate-y-1/2 opacity-80 md:w-[min(110vh,1100px)]">
        <LiquidBlob className="h-auto w-full" speed={waiting ? 0.6 : 0.25} seed={3} glow={false} />
      </div>

      <div role="status" className="glass-frame w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
        {waiting && (
          <span aria-hidden className="mx-auto mb-6 block size-10 animate-spin rounded-full border-[3px] border-white/15 border-t-accent" />
        )}
        <h1 className="text-[28px] font-bold leading-tight tracking-[-0.03em]">{copy.title}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-white/65">{bad && message ? message : copy.text}</p>
        {waiting && mode === 'public' && (
          <p className="mt-2 text-[13px] text-white/40">Tu peux quitter cette page : on s’occupe du reste.</p>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {state === 'published' || (waiting && mode === 'public') ? (
            <Link
              href="/feed"
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
              Aller au feed
            </Link>
          ) : bad ? (
            <button
              type="button"
              onClick={onAgain}
              className="h-14 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
              Recommencer
            </button>
          ) : state === 'private' || (waiting && mode === 'ai') ? (
            <Link
              href={`/analyse/${postId}`}
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
              Voir mon analyse
            </Link>
          ) : (
            <Link
              href="/profil"
              className="inline-flex h-14 items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
              Voir mon profil
            </Link>
          )}
          {!bad && (
            <button
              type="button"
              onClick={onAgain}
              className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06]">
              Nouvelle prise
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
