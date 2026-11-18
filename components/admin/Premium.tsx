'use client';

import { useSessionUser } from '@/lib/use-session';

import { UserAvatar } from '../AccountNav';
import { AvatarEffect, EFFECTS, type EffectId } from '../AvatarEffect';
import { Badge, SectionTitle } from './ui';

/** Photo de démonstration : celle de l'admin connecté (ou une initiale). */
function Avatar({ size }: { size: number }) {
  const me = useSessionUser();
  return <UserAvatar user={me ?? { username: 'vhoa', avatarUrl: null }} size={size} noEffect />;
}

function EffectCard({ id, name, description }: { id: EffectId; name: string; description: string }) {
  const me = useSessionUser();
  return (
    <article className="glass-solid flex flex-col overflow-hidden rounded-[28px]">
      {/* Grand aperçu */}
      <div className="relative grid h-56 place-items-center bg-[radial-gradient(70%_70%_at_50%_45%,rgb(74_168_255/0.10),transparent)]">
        <AvatarEffect effect={id} size={104}>
          <Avatar size={104} />
        </AvatarEffect>
      </div>

      <div className="flex flex-1 flex-col gap-4 p-5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-[18px] font-bold">{name}</h3>
            <Badge tone="blue">Premium</Badge>
          </div>
          <p className="mt-1 text-[14px] leading-snug text-white/60">{description}</p>
        </div>

        {/* Mise en situation : colonne d'actions du feed (46 px) et en-tête du profil (petit format). */}
        <div className="mt-auto flex items-center gap-5 rounded-2xl bg-white/[0.04] px-4 py-4">
          <div className="flex flex-col items-center gap-2">
            <AvatarEffect effect={id} size={46}>
              <span className="block rounded-full ring-2 ring-white">
                <Avatar size={46} />
              </span>
            </AvatarEffect>
            <span className="text-[11px] text-white/40">Feed</span>
          </div>
          <div className="flex items-center gap-3">
            <AvatarEffect effect={id} size={34}>
              <Avatar size={34} />
            </AvatarEffect>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold">@{me?.username ?? 'toi'}</span>
              <span className="block text-[11px] text-white/40">Commentaires, alertes</span>
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Propositions d'effets Premium autour de la photo de profil, avec aperçu. */
export function Premium() {
  return (
    <div className="flex flex-col gap-6">
      <SectionTitle
        title="Premium · Effets de profil"
        sub={`${EFFECTS.length} propositions d’effets autour de la photo, en plus du coach IA. Aperçu sur ta propre photo.`}
      />
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {EFFECTS.map((e) => (
          <EffectCard key={e.id} {...e} />
        ))}
      </div>
      <p className="text-[13px] text-white/40">
        Propositions seulement : rien n’est encore visible par les membres. Une fois choisis, les effets pourront être
        activés par les membres Premium depuis « Modifier le profil ».
      </p>
    </div>
  );
}
