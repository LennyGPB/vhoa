'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { loadBlocked, setBlock, type BlockedUser } from '@/app/actions/public';
import { notifySessionChange } from '@/lib/use-session';

import { UserAvatar } from './AccountNav';
import { BlobBadge } from './BlobBadge';
import { BackIcon, ShieldIcon } from './icons';

type Row = BlockedUser & { blocked: boolean; busy: boolean };

/** « Comptes bloqués » : la liste des comptes bloqués, avec un bouton pour débloquer (et annuler). */
export function BlockedScreen() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[] | null | 'error'>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadBlocked().then((res) => {
      if (!res.ok && res.code === 'AUTH') {
        notifySessionChange();
        router.replace('/connexion');
        return;
      }
      setRows(res.ok ? res.data.map((u) => ({ ...u, blocked: true, busy: false })) : 'error');
    });
  }, [router]);

  const toggle = async (id: string, block: boolean) => {
    setError(null);
    const patch = (change: Partial<Row>) =>
      setRows((list) => (Array.isArray(list) ? list.map((r) => (r.id === id ? { ...r, ...change } : r)) : list));
    patch({ busy: true });
    const res = await setBlock(id, block);
    if (res.ok) patch({ blocked: block, busy: false });
    else {
      patch({ busy: false });
      if (res.code === 'AUTH') {
        notifySessionChange();
        return router.replace('/connexion');
      }
      setError(res.message);
    }
  };

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -right-48 -top-48 size-[520px] opacity-40" />
      </div>
      <main className="relative mx-auto flex max-w-lg flex-col gap-5 px-5 pb-40 pt-[max(env(safe-area-inset-top),16px)]">
        <header className="flex items-center gap-3">
          <Link href="/profil" aria-label="Retour au profil" className="glass grid size-11 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </Link>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">Comptes bloqués</h1>
        </header>

        <p className="px-1 text-[14px] leading-snug text-white/55">
          Toi et un compte bloqué ne voyez plus vos contenus respectifs. Il n’est pas prévenu, ni quand tu le bloques, ni
          quand tu le débloques.
        </p>

        {rows === null && (
          <div aria-label="Chargement" className="flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-[68px] animate-pulse rounded-[20px] bg-white/[0.04]" />
            ))}
          </div>
        )}
        {rows === 'error' && <p className="py-16 text-center text-[15px] text-white/55">Impossible de charger la liste. Réessaie plus tard.</p>}

        {Array.isArray(rows) && rows.length === 0 && (
          <section className="glass-frame flex flex-col items-center rounded-[28px] p-7 text-center">
            <BlobBadge size={60} seed={3.6}>
              <ShieldIcon size={24} />
            </BlobBadge>
            <h2 className="mt-5 text-[19px] font-bold">Aucun compte bloqué</h2>
            <p className="mt-2 max-w-xs text-[14px] leading-snug text-white/55">
              Pour bloquer quelqu’un, ouvre son profil puis le menu « ⋯ ».
            </p>
          </section>
        )}

        {Array.isArray(rows) && rows.length > 0 && (
          <ul className="flex flex-col gap-2">
            {rows.map((u) => (
              <li key={u.id} className="glass-solid flex items-center gap-3 rounded-[20px] p-3">
                <UserAvatar user={u} size={44} noEffect />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-semibold">@{u.username}</span>
                  <span className="block text-[12.5px] text-white/45">{u.blocked ? 'Bloqué' : 'Débloqué'}</span>
                </span>
                <button
                  type="button"
                  onClick={() => toggle(u.id, !u.blocked)}
                  disabled={u.busy}
                  aria-label={`${u.blocked ? 'Débloquer' : 'Bloquer à nouveau'} @${u.username}`}
                  className={`h-10 shrink-0 rounded-full px-4 text-[14px] font-semibold transition-colors disabled:opacity-60 ${
                    u.blocked ? 'bg-accent text-white hover:brightness-110' : 'bg-white/[0.08] text-white/80 hover:bg-white/[0.12]'
                  }`}>
                  {u.busy ? '…' : u.blocked ? 'Débloquer' : 'Annuler'}
                </button>
              </li>
            ))}
          </ul>
        )}

        {error && (
          <p role="alert" className="text-center text-[14px] font-medium text-[#FF6B81]">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}
