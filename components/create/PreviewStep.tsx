'use client';

import { useEffect, useRef, useState } from 'react';

import { Sheet } from '../feed/Sheet';
import { ArrowIcon, BackIcon, MicIcon, PlayIcon } from '../icons';
import { clock, type Recording } from './shared';

/** Étape 2 : on réécoute sa prise (en boucle), puis on recommence ou on continue. */
export function PreviewStep({
  recording,
  onRetake,
  onContinue,
}: {
  recording: Recording;
  onRetake: () => void;
  onContinue: () => void;
}) {
  const mediaRef = useRef<HTMLVideoElement & HTMLAudioElement>(null);
  const [paused, setPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [confirm, setConfirm] = useState(false);

  useEffect(() => {
    const media = mediaRef.current;
    if (!media) return;
    if (paused || confirm) media.pause();
    else media.play().catch(() => setPaused(true));
  }, [paused, confirm]);

  const isVideo = recording.format === 'video';
  const progress = Math.min(1, time / recording.duration);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black md:bg-canvas">
      <div className="relative h-full w-full overflow-hidden bg-black md:aspect-[9/16] md:h-[calc(100svh-40px)] md:w-auto md:rounded-[28px] md:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.06)]">
        {isVideo ? (
          <video
            ref={mediaRef}
            src={recording.url}
            loop
            playsInline
            onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
            className="absolute inset-0 size-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a162c_0%,#174a8c_55%,#050a14_100%)]">
            <span className="soft-blob -left-24 top-10 size-[420px] opacity-70" />
            <div className="absolute inset-x-0 top-[34%] flex flex-col items-center">
              <span className="grid size-24 place-items-center rounded-full bg-[linear-gradient(135deg,#6FBCFF,#1F66D1)] text-white shadow-[0_0_60px_rgb(74_168_255/0.5)]">
                <MicIcon size={40} />
              </span>
              <p className="mt-6 text-[15px] font-semibold text-white/70">Réécoute ta prise</p>
            </div>
            <audio ref={mediaRef} src={recording.url} loop onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)} />
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.45)_0%,transparent_20%,transparent_60%,rgb(0_0_0/0.75)_100%)]"
        />

        {/* Tap = pause / lecture. */}
        <button
          type="button"
          onClick={() => setPaused((p) => !p)}
          aria-label={paused ? 'Lire' : 'Mettre en pause'}
          className="absolute inset-0"
        />
        {paused && (
          <span
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 grid size-[84px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/35 pl-1.5 text-white/90">
            <PlayIcon size={40} />
          </span>
        )}

        <div className="absolute inset-x-0 top-0 flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),14px)]">
          <button
            type="button"
            onClick={() => setConfirm(true)}
            aria-label="Recommencer"
            className="glass grid size-11 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </button>
          <span className="glass rounded-full px-3.5 py-2 text-[13px] font-semibold tabular-nums text-white">
            {clock(time)} / {clock(recording.duration)}
          </span>
          <span className="size-11" />
        </div>

        <div className="absolute inset-x-0 bottom-0 flex flex-col gap-4 px-4 pb-[max(env(safe-area-inset-bottom),24px)]">
          <div aria-hidden className="mx-1 h-0.5 overflow-hidden rounded-full bg-white/20">
            <div className="h-full bg-white" style={{ width: `${progress * 100}%` }} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirm(true)}
              className="glass h-14 rounded-full text-[16px] font-semibold text-white">
              Recommencer
            </button>
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex h-14 items-center justify-center gap-2 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
              Continuer
              <ArrowIcon size={18} />
            </button>
          </div>
        </div>
      </div>

      <Sheet open={confirm} onClose={() => setConfirm(false)} title="Recommencer ?">
        <div className="px-6 pb-8 pt-2 text-center">
          <h2 className="text-[22px] font-bold">Recommencer ?</h2>
          <p className="mt-2 text-[15px] text-white/60">Cette prise sera supprimée.</p>
          <div className="mt-6 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setConfirm(false)}
              className="h-14 rounded-full text-[16px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
              Annuler
            </button>
            <button
              type="button"
              onClick={onRetake}
              className="h-14 rounded-full bg-accent text-[16px] font-semibold text-white">
              Recommencer
            </button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
