'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState, useSyncExternalStore } from 'react';

import { currentTheme, type CurrentTheme, type PublishMode } from '@/app/actions/create';

import { Sheet } from '../feed/Sheet';
import { BlobBadge } from '../BlobBadge';
import { CheckIcon, FlameIcon, MicIcon, SparkIcon } from '../icons';
import { ThemeCountdown } from '../ThemeCountdown';
import { DetailsStep } from './DetailsStep';
import { DoneStep } from './DoneStep';
import { PreviewStep } from './PreviewStep';
import { RecordStep } from './RecordStep';
import type { Format, Recording } from './shared';

type Flow =
  | { step: 'record'; format: Format }
  | { step: 'preview'; recording: Recording }
  | { step: 'details'; recording: Recording }
  | { step: 'done'; postId: string; mode: PublishMode };

/** Ce que le coach regarde dans une prise (panneau d'arrivée par le coach). */
const COACH_POINTS = [
  'Ton débit : trop lent, idéal ou trop rapide',
  'Tes mots parasites et tes silences',
  'Un retour sur la structure de ton propos',
];

/** On arrive directement sur la caméra ; le bouton micro propose la voix seule (comme l'app). */
const START: Flow = { step: 'record', format: 'video' };

/** Réponse au panneau d'arrivée (défi, ou coach) : pas encore posée, acceptée, ou refermée. */
type Challenge = 'ask' | 'yes' | 'no';

const noop = () => () => {};
/** Arrivé par « Essayer le coach » (/creer?coach=1). Faux au rendu serveur. */
const readViaCoach = () => new URLSearchParams(window.location.search).get('coach') === '1';

/**
 * Parcours de création : enregistrement → aperçu → infos → confirmation.
 * En arrivant, un panneau propose le défi de la semaine. Le relever est facultatif :
 * sans défi, on parle de ce qu'on veut et la prise est publiée normalement.
 */
export function CreateFlow() {
  const router = useRouter();
  const [flow, setFlow] = useState<Flow>(START);
  const [theme, setTheme] = useState<CurrentTheme | null>(null);
  const [challenge, setChallenge] = useState<Challenge>('ask');
  // Arrivé par le coach : présentation du coach au lieu du défi, et « Coach IA seulement »
  // choisi d'avance à l'étape des infos.
  const viaCoach = useSyncExternalStore(noop, readViaCoach, () => false);

  useEffect(() => {
    currentTheme()
      .then(setTheme)
      .catch(() => {});
  }, []);

  /** Prise abandonnée ou envoyée : on libère la copie locale (mémoire du navigateur). */
  const discard = (recording: Recording) => URL.revokeObjectURL(recording.url);

  // Le défi n'accompagne la prise que s'il a été accepté.
  const activeTheme = challenge === 'yes' ? theme : null;

  const restart = () => {
    setChallenge('ask');
    setFlow(START);
  };

  let step: React.ReactNode;
  switch (flow.step) {
    case 'record':
      step = (
        <RecordStep
          format={flow.format}
          themeSubject={activeTheme?.subject}
          onFormatChange={(format) => setFlow({ step: 'record', format })}
          onRecorded={(recording) => setFlow({ step: 'preview', recording })}
          onClose={() => (window.history.length > 1 ? router.back() : router.push('/feed'))}
        />
      );
      break;
    case 'preview':
      step = (
        <PreviewStep
          recording={flow.recording}
          onRetake={() => {
            discard(flow.recording);
            setFlow({ step: 'record', format: flow.recording.format });
          }}
          onContinue={() => setFlow({ step: 'details', recording: flow.recording })}
        />
      );
      break;
    case 'details':
      step = (
        <DetailsStep
          recording={flow.recording}
          theme={activeTheme}
          initialMode={viaCoach ? 'ai' : 'public'}
          onBack={() => setFlow({ step: 'preview', recording: flow.recording })}
          onDone={(postId, mode) => {
            discard(flow.recording);
            setFlow({ step: 'done', postId, mode });
          }}
        />
      );
      break;
    case 'done':
      step = <DoneStep postId={flow.postId} mode={flow.mode} onAgain={restart} />;
      break;
  }

  return (
    <>
      {step}

      {/* Arrivé par le coach : ce qu'il fait, en bref, avant de s'enregistrer. */}
      <Sheet open={flow.step === 'record' && viaCoach && challenge === 'ask'} onClose={() => setChallenge('no')} title="Ton coach IA">
        <div className="px-6 pb-8 pt-1 text-center">
          <div className="flex justify-center">
            <BlobBadge size={64} seed={1.8}>
              <SparkIcon size={26} />
            </BlobBadge>
          </div>
          <p className="mt-5 text-[24px] font-bold leading-tight tracking-[-0.02em]">Ton coach IA t’écoute</p>
          <p className="mt-2 text-[15px] leading-snug text-white/60">
            Parle jusqu’à 60 secondes, sur le sujet de ton choix. Ta prise reste privée : seul ton coach l’écoute.
          </p>
          <ul className="mt-5 flex flex-col gap-2 rounded-[22px] bg-white/[0.04] p-4 text-left">
            {COACH_POINTS.map((point) => (
              <li key={point} className="flex items-center gap-3 text-[14px] leading-snug text-white/80">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent text-white">
                  <CheckIcon size={13} />
                </span>
                {point}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[13px] text-white/45">1 analyse offerte chaque mois · 60 avec Premium</p>
          <button
            type="button"
            onClick={() => setChallenge('no')}
            className="mt-6 inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
            <MicIcon size={18} />
            C’est parti
          </button>
        </div>
      </Sheet>

      {/* Défi de la semaine, proposé en arrivant (facultatif). */}
      <Sheet
        open={flow.step === 'record' && !viaCoach && theme !== null && challenge === 'ask'}
        onClose={() => setChallenge('no')}
        title="Défi de la semaine">
        <div className="px-6 pb-8 pt-1 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1.5 text-[12px] font-semibold text-accent">
            <FlameIcon size={13} />
            Défi de la semaine
            {theme && (
              <span className="text-azure/80">
                · <ThemeCountdown endsAt={theme.endsAt} />
              </span>
            )}
          </span>
          <p className="mt-5 text-balance text-[24px] font-bold leading-tight tracking-[-0.02em]">
            « {theme?.subject} »
          </p>
          <p className="mt-3 text-[15px] text-white/60">
            Relève le défi pour entrer dans le vote « Convaincu » et viser le podium.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <button
              type="button"
              onClick={() => setChallenge('yes')}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
              <FlameIcon size={18} />
              Relever le défi
            </button>
            <button
              type="button"
              onClick={() => setChallenge('no')}
              className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-colors hover:bg-white/[0.06]">
              Parler d’autre chose
            </button>
          </div>
        </div>
      </Sheet>
    </>
  );
}
