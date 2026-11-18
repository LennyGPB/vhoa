'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type ChangeEvent } from 'react';

import { Sheet } from '../feed/Sheet';
import { CloseIcon, FlameIcon, MicIcon, TextIcon, UploadIcon, VideoIcon } from '../icons';
import {
  ACCEPT,
  baseMime,
  clock,
  MAX_SECONDS,
  MIN_SECONDS,
  readDuration,
  type Format,
  type Recording,
} from './shared';

const noop = () => () => {};

/** Caméra / micro utilisables : il faut un contexte sécurisé (https ou localhost) et MediaRecorder. */
function canRecord() {
  return Boolean(navigator.mediaDevices?.getUserMedia) && typeof MediaRecorder !== 'undefined';
}

/** Premier format d'enregistrement pris en charge par le navigateur (et accepté par l'API). */
function pickMime(format: Format) {
  const candidates =
    format === 'video'
      ? ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm']
      : ['audio/mp4', 'audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus'];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) ?? '';
}

const RING = 2 * Math.PI * 40;
const LEVEL_BARS = 24;

type Status = 'starting' | 'ready' | 'denied' | 'error';

/**
 * Étape 1 : caméra (ou micro seul) plein écran, bouton d'enregistrement avec la progression
 * sur 60 s, prompteur, import d'un fichier. Sans accès direct à la caméra (http sur mobile,
 * refus d'autorisation), on propose l'appareil photo du téléphone ou un fichier.
 */
export function RecordStep({
  format,
  themeSubject,
  onFormatChange,
  onRecorded,
  onClose,
}: {
  format: Format;
  themeSubject?: string;
  onFormatChange: (format: Format) => void;
  onRecorded: (recording: Recording) => void;
  onClose: () => void;
}) {
  const supported = useSyncExternalStore(noop, canRecord, () => true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const barsRef = useRef<HTMLDivElement>(null);
  const scriptBoxRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const captureRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<Status>('starting');
  const [attempt, setAttempt] = useState(0);
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [script, setScript] = useState('');
  const [scriptOpen, setScriptOpen] = useState(false);

  // Ouverture de la caméra / du micro (et fermeture en quittant ou en changeant de format).
  useEffect(() => {
    if (!supported) return;
    let cancelled = false;
    let audioCtx: AudioContext | null = null;
    let raf = 0;
    navigator.mediaDevices
      .getUserMedia({
        video:
          format === 'video' ? { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } } : false,
        audio: { echoCancellation: true, noiseSuppression: true },
      })
      .then((stream) => {
        if (cancelled) return stream.getTracks().forEach((t) => t.stop());
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;
        setStatus('ready');
        // Voix seule : barres qui suivent le niveau du micro (sans re-rendu React).
        if (format === 'audio') {
          audioCtx = new AudioContext();
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          audioCtx.createMediaStreamSource(stream).connect(analyser);
          const data = new Uint8Array(analyser.frequencyBinCount);
          const draw = () => {
            analyser.getByteFrequencyData(data);
            const bars = barsRef.current?.children;
            if (bars) {
              for (let i = 0; i < bars.length; i++) {
                const v = data[(i % (data.length - 2)) + 1] / 255;
                (bars[i] as HTMLElement).style.transform = `scaleY(${0.15 + v * 0.85})`;
              }
            }
            raf = requestAnimationFrame(draw);
          };
          draw();
        }
      })
      .catch((err: Error) => {
        if (!cancelled) setStatus(err.name === 'NotAllowedError' ? 'denied' : 'error');
      });
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      audioCtx?.close().catch(() => {});
      if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    };
  }, [format, supported, attempt]);

  // Chrono pendant l'enregistrement, arrêt automatique à 60 s, défilement du prompteur.
  useEffect(() => {
    if (!recording) return;
    const start = performance.now();
    let last = start;
    let raf = 0;
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      setElapsed(t);
      if (scriptBoxRef.current) scriptBoxRef.current.scrollTop += ((now - last) / 1000) * 24;
      last = now;
      if (t >= MAX_SECONDS) recorderRef.current?.stop();
      else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [recording]);

  useEffect(() => {
    if (!error) return;
    const id = setTimeout(() => setError(null), 3200);
    return () => clearTimeout(id);
  }, [error]);

  const start = () => {
    const stream = streamRef.current;
    if (!stream) return;
    const mime = pickMime(format);
    let rec: MediaRecorder;
    try {
      rec = new MediaRecorder(stream, {
        ...(mime ? { mimeType: mime } : {}),
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      });
    } catch {
      setError('Impossible de démarrer l’enregistrement, réessaie.');
      return;
    }
    const chunks: Blob[] = [];
    const startedAt = performance.now();
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      setRecording(false);
      setElapsed(0);
      const duration = Math.min(MAX_SECONDS, (performance.now() - startedAt) / 1000);
      if (duration < MIN_SECONDS) {
        setError('Un peu court : parle au moins 3 secondes.');
        return;
      }
      const type = baseMime(rec.mimeType || mime || (format === 'video' ? 'video/webm' : 'audio/webm'));
      const blob = new Blob(chunks, { type });
      onRecorded({ blob, url: URL.createObjectURL(blob), format, mime: type, duration });
    };
    rec.start(250);
    recorderRef.current = rec;
    if (scriptBoxRef.current) scriptBoxRef.current.scrollTop = 0;
    setRecording(true);
  };

  const stop = () => {
    if (recorderRef.current?.state === 'recording') recorderRef.current.stop();
  };

  /** Fichier importé ou filmé avec l'appareil photo du téléphone. */
  const onFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const kind: Format | null = file.type.startsWith('video/') ? 'video' : file.type.startsWith('audio/') ? 'audio' : null;
    if (!kind) return setError('Format de fichier non pris en charge.');
    const url = URL.createObjectURL(file);
    try {
      const duration = await readDuration(url, kind);
      if (duration > MAX_SECONDS + 1) throw new Error('Durée maximale : 1 minute.');
      if (duration < MIN_SECONDS) throw new Error('Un peu court : au moins 3 secondes.');
      onRecorded({ blob: file, url, format: kind, mime: baseMime(file.type), duration });
    } catch (err) {
      URL.revokeObjectURL(url);
      setError(err instanceof Error && err.message !== 'Fichier illisible' ? err.message : 'Fichier illisible.');
    }
  };

  const unavailable = !supported || status === 'denied' || status === 'error';
  const progress = Math.min(1, elapsed / MAX_SECONDS);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black md:bg-canvas">
      <div className="relative h-full w-full overflow-hidden bg-black md:aspect-[9/16] md:h-[calc(100svh-40px)] md:w-auto md:rounded-[28px] md:shadow-[0_30px_80px_-30px_rgb(0_0_0/0.9),0_0_0_1px_rgb(255_255_255/0.06)]">
        {/* Image de la caméra (en miroir, comme un selfie) ou scène « voix seule ». */}
        {format === 'video' ? (
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className="absolute inset-0 size-full -scale-x-100 object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#0a162c_0%,#174a8c_55%,#050a14_100%)]">
            <span className="soft-blob -left-24 top-10 size-[420px] opacity-70" />
            <div className="absolute inset-x-0 top-[30%] flex flex-col items-center">
              <span className="grid size-24 place-items-center rounded-full bg-[linear-gradient(135deg,#6FBCFF,#1F66D1)] text-white shadow-[0_0_60px_rgb(74_168_255/0.5)]">
                <MicIcon size={40} />
              </span>
              <div ref={barsRef} aria-hidden className="mt-8 flex h-12 items-center gap-[3px]">
                {Array.from({ length: LEVEL_BARS }, (_, i) => (
                  <span key={i} className="h-full w-[3px] origin-center scale-y-[0.15] rounded-full bg-white/80" />
                ))}
              </div>
              <p className="mt-6 text-[15px] font-semibold text-white/70">
                {recording ? 'On t’écoute…' : 'Juste ta voix'}
              </p>
            </div>
          </div>
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(0_0_0/0.5)_0%,transparent_22%,transparent_60%,rgb(0_0_0/0.7)_100%)]"
        />

        {/* Haut : fermer, thème, prompteur. */}
        <div className="absolute inset-x-0 top-0 flex items-center gap-3 px-4 pt-[max(env(safe-area-inset-top),14px)]">
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="glass grid size-11 shrink-0 place-items-center rounded-full text-white">
            <CloseIcon size={20} />
          </button>
          <div className="flex min-w-0 flex-1 justify-center">
            {themeSubject && (
              <p className="glass inline-flex min-w-0 items-center gap-1.5 rounded-full px-3.5 py-2 text-[12px] font-semibold text-white">
                <FlameIcon size={13} className="shrink-0 text-accent" />
                <span className="truncate">{themeSubject}</span>
              </p>
            )}
          </div>
          <button
            type="button"
            onClick={() => setScriptOpen(true)}
            disabled={recording}
            aria-label="Prompteur"
            aria-pressed={script.trim().length > 0}
            className={`glass grid size-11 shrink-0 place-items-center rounded-full transition-colors disabled:opacity-40 ${
              script.trim() ? 'text-accent' : 'text-white'
            }`}>
            <TextIcon size={20} />
          </button>
        </div>

        {/* Prompteur : le texte défile doucement pendant l'enregistrement. */}
        {script.trim() && !unavailable && (
          <div
            ref={scriptBoxRef}
            className="no-scrollbar glass absolute inset-x-4 top-[calc(max(env(safe-area-inset-top),14px)+60px)] max-h-[28%] overflow-y-auto rounded-[22px] px-5 py-4">
            <p className="whitespace-pre-wrap text-[20px] font-semibold leading-snug text-white">{script}</p>
            <div className="h-24" />
          </div>
        )}

        {/* Caméra indisponible : appareil photo du téléphone ou fichier. */}
        {unavailable && (
          <div className="absolute inset-0 flex items-center justify-center px-6">
            <div className="glass-frame w-full max-w-sm rounded-[32px] px-6 py-8 text-center">
              <h2 className="text-[22px] font-bold tracking-[-0.02em]">
                {status === 'denied' ? 'Autorise la caméra et le micro' : 'Caméra indisponible ici'}
              </h2>
              <p className="mt-2 text-[14px] leading-relaxed text-white/60">
                {status === 'denied'
                  ? 'Ton navigateur a bloqué l’accès. Autorise-le dans les réglages du site, puis réessaie.'
                  : 'Ce navigateur ne peut pas enregistrer directement. Utilise l’appareil photo de ton téléphone ou importe un fichier.'}
              </p>
              <div className="mt-6 flex flex-col gap-3">
                <button
                  type="button"
                  onClick={() => captureRef.current?.click()}
                  className="h-13 rounded-full bg-accent text-[15px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
                  {format === 'video' ? 'Filmer avec l’appareil photo' : 'Enregistrer avec le micro'}
                </button>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="h-13 rounded-full text-[15px] font-semibold text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)]">
                  Importer un fichier
                </button>
                {status === 'denied' && (
                  <button
                    type="button"
                    onClick={() => {
                      setStatus('starting');
                      setAttempt((a) => a + 1);
                    }}
                    className="text-[14px] font-semibold text-accent">
                    Réessayer
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Bas : import, bouton d'enregistrement, format. */}
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-4 pb-[max(env(safe-area-inset-bottom),24px)]">
          <p
            className={`rounded-full px-3.5 py-1.5 text-[13px] font-semibold tabular-nums ${
              recording ? 'bg-accent text-white' : 'text-white/80'
            }`}>
            {recording ? `${clock(elapsed)} / ${clock(MAX_SECONDS)}` : unavailable ? '' : 'Touche pour enregistrer'}
          </p>
          <div className="flex w-full items-center justify-center gap-10">
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={recording}
              aria-label={format === 'video' ? 'Importer une vidéo' : 'Importer un fichier audio'}
              className="glass grid size-12 place-items-center rounded-full text-white transition-opacity disabled:opacity-0">
              <UploadIcon size={22} />
            </button>

            <button
              type="button"
              onClick={recording ? stop : start}
              disabled={status !== 'ready' || unavailable}
              aria-label={recording ? 'Terminer l’enregistrement' : 'Enregistrer'}
              className="relative grid size-[88px] place-items-center disabled:opacity-40">
              <svg aria-hidden viewBox="0 0 88 88" className="absolute inset-0 -rotate-90">
                <circle cx="44" cy="44" r="40" fill="none" stroke="rgb(255 255 255 / 0.3)" strokeWidth="4" />
                <circle
                  cx="44"
                  cy="44"
                  r="40"
                  fill="none"
                  stroke="var(--color-accent)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={RING}
                  strokeDashoffset={RING * (1 - progress)}
                />
              </svg>
              <span
                className={`block bg-[linear-gradient(135deg,#6FBCFF,#1F66D1)] shadow-[0_0_30px_rgb(74_168_255/0.6)] transition-all duration-300 ${
                  recording ? 'size-8 rounded-[10px]' : 'size-[66px] rounded-full'
                }`}
              />
            </button>

            <button
              type="button"
              onClick={() => onFormatChange(format === 'video' ? 'audio' : 'video')}
              disabled={recording}
              aria-label={format === 'video' ? 'Passer en voix seule' : 'Repasser en vidéo'}
              className="glass grid size-12 place-items-center rounded-full text-white transition-opacity disabled:opacity-0">
              {format === 'video' ? <MicIcon size={22} /> : <VideoIcon size={22} />}
            </button>
          </div>
        </div>

        {error && (
          <p
            role="status"
            className="rise glass absolute left-1/2 top-24 z-10 max-w-[85%] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-[14px] font-semibold text-white">
            {error}
          </p>
        )}

        <input ref={fileRef} type="file" accept={ACCEPT[format]} onChange={onFile} hidden />
        <input
          ref={captureRef}
          type="file"
          accept={format === 'video' ? 'video/*' : 'audio/*'}
          capture="user"
          onChange={onFile}
          hidden
        />
      </div>

      {/* Prompteur : le texte à lire pendant la prise. */}
      <Sheet open={scriptOpen} onClose={() => setScriptOpen(false)} title="Prompteur">
        <div className="px-5 pb-6">
          <h2 className="text-center text-[20px] font-bold">Ton texte</h2>
          <p className="mt-1 text-center text-[13px] text-white/50">Il défile pendant que tu parles.</p>
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            maxLength={2000}
            rows={7}
            placeholder="Écris ou colle ton texte ici…"
            className="mt-4 w-full resize-none rounded-2xl bg-white/[0.05] p-4 text-[16px] leading-relaxed text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
          />
          <button
            type="button"
            onClick={() => setScriptOpen(false)}
            className="mt-4 h-13 w-full rounded-full bg-accent text-[15px] font-semibold text-white">
            {script.trim() ? 'Afficher le prompteur' : 'Fermer'}
          </button>
        </div>
      </Sheet>
    </div>
  );
}
