'use client';

import { type FormEvent, useEffect, useId, useRef, useState } from 'react';

import { joinWaitlist } from '@/app/actions/waitlist';

import { AndroidIcon, AppleIcon, ArrowIcon, CheckIcon } from './icons';

const PLATFORMS = [
  { value: 'ios', label: 'iPhone', Icon: AppleIcon },
  { value: 'android', label: 'Android', Icon: AndroidIcon },
] as const;

type Platform = (typeof PLATFORMS)[number]['value'];

/**
 * Choix de plateforme : la pastille bleue s'étire comme une goutte en changeant d'option
 * (LiquidTabs de l'app). Le bord de tête part d'abord, le bord de queue suit.
 */
function PlatformToggle({ value, onChange }: { value: Platform; onChange: (v: Platform) => void }) {
  const index = PLATFORMS.findIndex((p) => p.value === value);
  const toRight = index === 1;
  const ease = 'cubic-bezier(0.3, 1.4, 0.5, 1)';

  return (
    <div role="radiogroup" aria-label="Ton téléphone" className="glass relative grid grid-cols-2 rounded-full p-1">
      <span
        aria-hidden
        className="absolute inset-y-1 rounded-full bg-accent shadow-[0_8px_24px_-8px_var(--color-accent)]"
        style={{
          left: toRight ? 'calc(50% + 2px)' : '4px',
          right: toRight ? '4px' : 'calc(50% + 2px)',
          transition: `left 420ms ${ease} ${toRight ? 110 : 0}ms, right 420ms ${ease} ${toRight ? 0 : 110}ms`,
        }}
      />
      {PLATFORMS.map(({ value: v, label, Icon }) => (
        <button
          key={v}
          type="button"
          role="radio"
          aria-checked={v === value}
          onClick={() => onChange(v)}
          className={`relative z-10 flex items-center justify-center gap-2 rounded-full py-2.5 text-[14px] font-semibold transition-colors ${
            v === value ? 'text-white' : 'text-white/60 hover:text-white/90'
          }`}>
          <Icon size={15} />
          {label}
        </button>
      ))}
    </div>
  );
}

export function WaitlistForm() {
  const [platform, setPlatform] = useState<Platform>('ios');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  // Le formulaire existe en deux exemplaires (section + modale) : identifiants uniques.
  const inputId = useId();
  const errorId = useId();
  // Moment d'affichage du formulaire : un envoi quasi instantané trahit un robot.
  const shownAt = useRef(0);
  useEffect(() => {
    shownAt.current = Date.now();
  }, []);

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setStatus('sending');
    const website = new FormData(e.currentTarget).get('website');
    const result = await joinWaitlist({
      email,
      platform,
      website: typeof website === 'string' ? website : '',
      elapsedMs: Date.now() - shownAt.current,
    }).catch(() => ({ ok: false as const, error: 'Connexion impossible, réessaie dans un instant.' }));
    if (result.ok) {
      setStatus('done');
    } else {
      setError(result.error);
      setStatus('idle');
    }
  };

  if (status === 'done') {
    return (
      <div className="flex items-center gap-4 rounded-[22px] bg-accent/10 p-5" role="status">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white">
          <CheckIcon size={20} />
        </span>
        <div>
          <p className="font-semibold">C’est noté !</p>
          <p className="text-[14px] text-muted">On t’écrit à {email} le jour de la sortie.</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="relative flex flex-col gap-3" noValidate>
      <PlatformToggle value={platform} onChange={setPlatform} />
      <div className="glass flex items-center gap-2 rounded-full p-1.5 pl-5 focus-within:shadow-[inset_0_0_0_1.5px_var(--color-accent)]">
        <label htmlFor={inputId} className="sr-only">
          Ton email
        </label>
        <input
          id={inputId}
          type="email"
          required
          autoComplete="email"
          placeholder="ton@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          maxLength={254}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
        />
        <button
          type="submit"
          disabled={status === 'sending'}
          className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] font-semibold text-white transition-[filter,opacity] hover:brightness-110 disabled:opacity-60">
          {status === 'sending' ? 'Envoi…' : 'Je m’inscris'}
          <ArrowIcon size={15} />
        </button>
      </div>
      {/* Champ piège : invisible pour un humain, rempli par les robots. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="absolute -left-[9999px] size-px opacity-0"
      />
      {error ? (
        <p id={errorId} role="alert" className="pl-5 text-[13px] font-medium text-[#FF6B85]">
          {error}
        </p>
      ) : (
        <p className="pl-5 text-[12px] leading-relaxed text-white/40">
          Un seul email, le jour de la sortie. Réservé aux 15 ans et plus.{' '}
          <a href="/confidentialite" className="underline underline-offset-2 hover:text-white/70">
            Confidentialité
          </a>
        </p>
      )}
    </form>
  );
}
