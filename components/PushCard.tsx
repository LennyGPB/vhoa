'use client';

import { useEffect, useState } from 'react';

import { disablePush, enablePush, pushState, type PushState } from '@/lib/web-push';

import { BlobBadge } from './BlobBadge';
import { BellIcon, CheckIcon } from './icons';

/** Notifications de ce navigateur : les activer, les couper, ou expliquer pourquoi c'est impossible. */
export function PushCard() {
  const [state, setState] = useState<PushState | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    pushState()
      .then(setState)
      .catch(() => setState('unsupported'));
  }, []);

  if (state === null || state === 'unsupported') return null;

  const turnOn = async () => {
    setBusy(true);
    setError(null);
    const res = await enablePush();
    setBusy(false);
    if (res.ok) setState('on');
    else {
      setError(res.message);
      setState(await pushState());
    }
  };

  const turnOff = async () => {
    setBusy(true);
    await disablePush();
    setBusy(false);
    setState('off');
  };

  if (state === 'on') {
    return (
      <div className="flex items-center gap-3 rounded-[20px] bg-white/[0.04] px-4 py-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent text-white">
          <CheckIcon size={15} />
        </span>
        <p className="min-w-0 flex-1 text-[14px] font-medium text-white/80">Notifications activées sur cet appareil</p>
        <button
          type="button"
          onClick={turnOff}
          disabled={busy}
          className="shrink-0 rounded-full px-3 py-2 text-[13px] font-semibold text-white/60 transition-colors hover:text-white disabled:opacity-50">
          Désactiver
        </button>
      </div>
    );
  }

  return (
    <section className="relative overflow-hidden rounded-[24px] bg-[linear-gradient(135deg,rgb(74_168_255/0.16),rgb(74_168_255/0.04)_60%)] p-4 shadow-[inset_0_0_0_1px_rgb(74_168_255/0.22)]">
      <div className="flex items-start gap-3">
        <BlobBadge size={44} seed={2.6}>
          <BellIcon size={19} />
        </BlobBadge>
        <div className="min-w-0 flex-1">
          <h2 className="text-[16px] font-bold">Ne rate rien</h2>
          <p className="mt-0.5 text-[14px] leading-snug text-white/65">
            {state === 'ios-install'
              ? 'Sur iPhone, ajoute d’abord VHOA à ton écran d’accueil (Partager, puis « Sur l’écran d’accueil »), puis ouvre-le depuis là.'
              : state === 'denied'
                ? 'Les notifications sont bloquées pour VHOA. Autorise-les dans les réglages de ton navigateur.'
                : 'Sois prévenu quand on réagit à tes prises, quand ton analyse est prête et quand un nouveau défi tombe.'}
          </p>
        </div>
      </div>
      {state === 'off' && (
        <button
          type="button"
          onClick={turnOn}
          disabled={busy}
          className="mt-3.5 h-12 w-full rounded-full bg-accent text-[15px] font-semibold text-white shadow-[0_14px_40px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110 disabled:opacity-60">
          {busy ? 'Activation…' : 'Activer les notifications'}
        </button>
      )}
      {error && (
        <p role="alert" className="mt-2.5 text-[13px] font-medium text-[#FF8FA3]">
          {error}
        </p>
      )}
    </section>
  );
}
