'use client';

import type { ReactNode } from 'react';

/** Petites briques communes du back-office (même D.A. que le site : verre, bleu, arrondis). */

export function SectionTitle({ title, sub, right }: { title: string; sub?: string; right?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-[26px] font-bold tracking-[-0.03em]">{title}</h1>
        {sub && <p className="mt-1 text-[14px] text-white/50">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

/** Pastille de filtre ; sélection en bleu (D.A.). */
export function FilterChips<K extends string>({
  items,
  value,
  onChange,
}: {
  items: { key: K; label: string; count?: number }[];
  value: K;
  onChange: (k: K) => void;
}) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 md:mx-0 md:flex-wrap md:px-0">
      {items.map((it) => {
        const on = it.key === value;
        return (
          <button
            key={it.key}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(it.key)}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              on
                ? 'bg-accent text-white shadow-[0_8px_24px_-8px_var(--color-accent)]'
                : 'bg-white/[0.05] text-white/70 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:text-white'
            }`}>
            {it.label}
            {it.count !== undefined && (
              <span className={`tabular-nums ${on ? 'text-white/80' : 'text-white/40'}`}>{it.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  return (
    <input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-11 w-full rounded-full bg-white/[0.05] px-5 text-[14px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] md:w-72"
    />
  );
}

type Tone = 'neutral' | 'blue' | 'good' | 'warn' | 'bad';
const TONE: Record<Tone, string> = {
  neutral: 'bg-white/[0.07] text-white/70',
  blue: 'bg-accent/15 text-azure',
  good: 'bg-[#22B07D]/15 text-[#5BD6A4]',
  warn: 'bg-[#F5B83D]/15 text-[#F5C766]',
  bad: 'bg-[#FF4D6D]/15 text-[#FF8FA3]',
};

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: Tone }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${TONE[tone]}`}>{children}</span>;
}

/** Bouton d'action compact. `danger` = action destructrice (rouge). */
export function ActionButton({
  children,
  onClick,
  variant = 'ghost',
  disabled,
}: {
  children: ReactNode;
  onClick: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
}) {
  const cls =
    variant === 'primary'
      ? 'bg-accent text-white shadow-[0_8px_24px_-10px_var(--color-accent)] hover:brightness-110'
      : variant === 'danger'
        ? 'text-[#FF8FA3] shadow-[inset_0_0_0_1px_rgb(255_77_109/0.35)] hover:bg-[#FF4D6D]/10'
        : 'text-white/85 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] hover:bg-white/[0.06]';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex h-9 items-center justify-center rounded-full px-4 text-[13px] font-semibold transition-[background-color,filter] disabled:opacity-40 ${cls}`}>
      {children}
    </button>
  );
}

export function Empty({ title, text }: { title: string; text?: string }) {
  return (
    <div className="glass-solid rounded-[24px] px-6 py-12 text-center">
      <p className="text-[17px] font-semibold">{title}</p>
      {text && <p className="mt-1.5 text-[14px] text-white/50">{text}</p>}
    </div>
  );
}

export function Loading({ rows = 4, h = 72 }: { rows?: number; h?: number }) {
  return (
    <div className="flex flex-col gap-2" aria-label="Chargement">
      {Array.from({ length: rows }, (_, i) => (
        <span key={i} className="animate-pulse rounded-[22px] bg-white/[0.04]" style={{ height: h }} />
      ))}
    </div>
  );
}

export function Thumb({ url, type, className = 'h-16 w-11' }: { url?: string; type?: string; className?: string }) {
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-xl bg-[linear-gradient(180deg,#0a162c,#174a8c)] ${className}`}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element -- miniature distante (R2)
        <img src={url} alt="" className="size-full object-cover" />
      ) : (
        <span className="grid size-full place-items-center text-[10px] font-semibold uppercase text-white/60">
          {type === 'audio' ? 'Audio' : '—'}
        </span>
      )}
    </span>
  );
}

const dateTime = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
export const formatDate = (iso: string) => dateTime.format(new Date(iso));
