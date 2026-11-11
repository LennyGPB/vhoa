'use client';

import { useActionState, useState } from 'react';

import { ArrowIcon } from '@/components/icons';

import { loginAction, type LoginState } from '../actions';

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(loginAction, { error: null });
  const [show, setShow] = useState(false);

  return (
    <form action={action} className="flex flex-col gap-3">
      <div className="glass flex items-center gap-2 rounded-full p-1.5 pl-5 focus-within:shadow-[inset_0_0_0_1.5px_var(--color-accent)]">
        <label htmlFor="admin-password" className="sr-only">
          Mot de passe
        </label>
        <input
          id="admin-password"
          name="password"
          type={show ? 'text' : 'password'}
          required
          autoFocus
          autoComplete="current-password"
          placeholder="Mot de passe"
          maxLength={200}
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? 'admin-error' : undefined}
          className="min-w-0 flex-1 bg-transparent text-[15px] text-white outline-none placeholder:text-white/35"
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          className="shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold text-white/55 transition-colors hover:text-white">
          {show ? 'Masquer' : 'Afficher'}
        </button>
        <button
          type="submit"
          disabled={pending}
          aria-label="Se connecter"
          className="grid size-11 shrink-0 place-items-center rounded-full bg-accent text-white shadow-[0_8px_24px_-8px_var(--color-accent)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-60">
          {pending ? (
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <ArrowIcon size={18} />
          )}
        </button>
      </div>
      <p
        id="admin-error"
        role="alert"
        className={`min-h-5 pl-5 text-[13px] font-medium text-[#FF6B85] ${state.error ? '' : 'invisible'}`}>
        {state.error}
      </p>
    </form>
  );
}
