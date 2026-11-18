'use client';

import Link from 'next/link';

import { SIGNUP_HREF } from '@/lib/site';
import { useSessionUser, type ViewerUser } from '@/lib/use-session';

import { AvatarEffect, isEffectId } from './AvatarEffect';

/**
 * Avatar : photo si l'utilisateur en a une, sinon son initiale sur un dégradé bleu.
 * Son effet Premium (s'il en a un) est affiché autour, partout où l'avatar apparaît.
 * `noEffect` : pour un aperçu où l'effet est dessiné à part.
 */
export function UserAvatar({
  user,
  size = 36,
  noEffect = false,
}: {
  user: Pick<ViewerUser, 'username' | 'avatarUrl'> & { avatarEffect?: string | null };
  size?: number;
  noEffect?: boolean;
}) {
  const effect = !noEffect && isEffectId(user.avatarEffect) ? user.avatarEffect : null;
  if (effect) {
    return (
      <AvatarEffect effect={effect} size={size}>
        <UserAvatar user={user} size={size} noEffect />
      </AvatarEffect>
    );
  }
  if (user.avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- image distante (R2), taille fixe
      <img
        src={user.avatarUrl}
        alt=""
        width={size}
        height={size}
        className="shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      aria-hidden
      className="grid shrink-0 place-items-center rounded-full bg-[linear-gradient(135deg,#7CC4FA,#1F66D1)] font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.42 }}>
      {user.username[0]?.toUpperCase()}
    </span>
  );
}

/**
 * Coin « compte » des en-têtes : avatar (lien vers le profil) si connecté,
 * sinon « Se connecter » (+ « Commencer » en version complète).
 */
export function AccountNav({ compact = false }: { compact?: boolean }) {
  const user = useSessionUser();

  if (user) {
    return (
      <Link
        href="/profil"
        aria-label={`Mon profil (@${user.username})`}
        className="glass flex items-center gap-2.5 rounded-full p-1 pr-1 transition-colors hover:bg-white/10 sm:pr-4">
        <UserAvatar user={user} size={compact ? 38 : 34} />
        <span className="hidden text-[13px] font-semibold text-white/90 sm:inline">@{user.username}</span>
      </Link>
    );
  }

  if (compact) {
    return (
      <Link
        href="/connexion"
        className="glass rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85 transition-colors hover:text-white">
        Se connecter
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/connexion"
        className="rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/75 transition-colors hover:text-white">
        Se connecter
      </Link>
      <Link
        href={SIGNUP_HREF}
        className="rounded-full bg-accent px-5 py-2.5 text-[13px] font-semibold text-white shadow-[0_10px_30px_-10px_var(--color-accent)] transition-[filter] hover:brightness-110">
        Commencer
      </Link>
    </div>
  );
}
