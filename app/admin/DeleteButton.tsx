'use client';

import { useTransition } from 'react';

import { deleteEntryAction } from './actions';

/** Supprime une inscription après confirmation. */
export function DeleteButton({ id, email }: { id: string; email: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      aria-label={`Supprimer ${email}`}
      onClick={() => {
        if (!window.confirm(`Supprimer ${email} de la liste d’attente ?`)) return;
        startTransition(() => deleteEntryAction(id));
      }}
      className="grid size-9 place-items-center rounded-full text-white/40 transition-colors hover:bg-[#FF6B85]/15 hover:text-[#FF6B85] disabled:opacity-40">
      {pending ? (
        <span className="size-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
        </svg>
      )}
    </button>
  );
}
