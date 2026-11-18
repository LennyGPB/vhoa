'use client';

import { useState, useTransition } from 'react';

import { report, type ReportReason, type ReportTarget } from '@/app/actions/public';

import { Sheet } from './feed/Sheet';
import { CheckIcon } from './icons';

const REASONS: { key: ReportReason; label: string }[] = [
  { key: 'harassment', label: 'Harcèlement ou intimidation' },
  { key: 'hate', label: 'Propos haineux' },
  { key: 'violence', label: 'Violence ou menaces' },
  { key: 'sexual', label: 'Contenu sexuel' },
  { key: 'self_harm', label: 'Automutilation ou suicide' },
  { key: 'misinformation', label: 'Fausse information' },
  { key: 'spam', label: 'Spam ou arnaque' },
  { key: 'other', label: 'Autre' },
];

const TITLE: Record<ReportTarget, string> = {
  post: 'Signaler cette prise',
  comment: 'Signaler ce commentaire',
  user: 'Signaler ce profil',
};

/**
 * Signalement d'une prise, d'un commentaire ou d'un profil : motif + précision facultative.
 * `target` à null = panneau fermé. Le résultat est remonté par `onDone` (message à afficher).
 */
export function ReportSheet({
  target,
  onClose,
  onDone,
}: {
  target: { type: ReportTarget; id: string } | null;
  onClose: () => void;
  onDone: (message: string, needsAccount?: boolean) => void;
}) {
  const [reason, setReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [pending, startTransition] = useTransition();

  const close = () => {
    setReason(null);
    setDetails('');
    onClose();
  };

  const send = () => {
    if (!target || !reason) return;
    startTransition(async () => {
      const res = await report({ targetType: target.type, targetId: target.id, reason, details: details || undefined });
      close();
      if (res.ok) onDone('Signalement envoyé. Merci, on va examiner ça.');
      else onDone(res.message, res.code === 'AUTH');
    });
  };

  return (
    <Sheet open={target !== null} onClose={close} title={target ? TITLE[target.type] : 'Signaler'}>
      {target && (
        <div className="flex min-h-0 flex-col px-5 pb-6">
          <h2 className="text-center text-[20px] font-bold">{TITLE[target.type]}</h2>
          <p className="mt-1 text-center text-[13px] text-white/50">Ton signalement reste anonyme.</p>
          <ul role="radiogroup" aria-label="Motif" className="mt-4 flex flex-col gap-1.5 overflow-y-auto">
            {REASONS.map((r) => {
              const on = reason === r.key;
              return (
                <li key={r.key}>
                  <button
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setReason(r.key)}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-[15px] font-medium transition-shadow ${
                      on
                        ? 'bg-accent/10 text-white shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
                        : 'bg-white/[0.04] text-white/85'
                    }`}>
                    {r.label}
                    {on && (
                      <span className="grid size-5 place-items-center rounded-full bg-accent text-white">
                        <CheckIcon size={12} />
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          {reason && (
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              maxLength={500}
              rows={2}
              placeholder="Précise si besoin (facultatif)"
              className="mt-3 w-full resize-none rounded-2xl bg-white/[0.05] p-3.5 text-[15px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
            />
          )}
          <button
            type="button"
            disabled={!reason || pending}
            onClick={send}
            className="mt-4 h-14 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-opacity disabled:opacity-40">
            {pending ? 'Envoi…' : 'Envoyer le signalement'}
          </button>
        </div>
      )}
    </Sheet>
  );
}
