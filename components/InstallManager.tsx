'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';

import {
  initPwa,
  installSnoozed,
  onOpenInstall,
  promptInstall,
  snoozeInstall,
  takeSignupInstall,
  useInstallMode,
  type InstallReason,
} from '@/lib/pwa';

import { BlobBadge } from './BlobBadge';
import { Sheet } from './feed/Sheet';
import { BellIcon, CheckIcon, PlayIcon, PlusIcon, ShareIcon, SparkIcon } from './icons';
import { LiquidBlob } from './LiquidBlob';

const TITLES: Record<InstallReason, { title: ReactNode; text: string }> = {
  signup: {
    title: (
      <>
        Bienvenue ! Garde VHOA <span className="text-accent">sous le pouce</span>
      </>
    ),
    text: 'Installe l’app : elle s’ouvre en un appui, en plein écran, comme les autres.',
  },
  feed: {
    title: (
      <>
        Tu aimes écouter ? <span className="text-accent">Installe l’app</span>
      </>
    ),
    text: 'Retrouve le feed en un appui depuis ton écran d’accueil, sans passer par le navigateur.',
  },
  settings: {
    title: (
      <>
        Installe <span className="text-accent">VHOA</span>
      </>
    ),
    text: 'Une vraie app sur ton écran d’accueil : ouverture en un appui, plein écran, notifications.',
  },
};

/**
 * Propositions d'installation de l'app, pour tout le site (monté dans le layout) :
 * depuis les Paramètres, après l'inscription, et dans le feed après 5 prises écoutées.
 * Les propositions automatiques ne reviennent pas avant 14 jours si on choisit « Plus tard ».
 */
export function InstallManager() {
  const pathname = usePathname();
  const mode = useInstallMode();
  const [reason, setReason] = useState<InstallReason | null>(null);
  const [shown, setShown] = useState<InstallReason>('settings');
  if (reason && reason !== shown) setShown(reason);

  useEffect(() => initPwa(), []);

  useEffect(
    () =>
      onOpenInstall((r) => {
        if (mode === 'installed') return;
        // Propositions automatiques : seulement si on peut vraiment aider (fenêtre du
        // navigateur ou guide iPhone), et pas si elles ont été écartées récemment.
        if (r !== 'settings' && (installSnoozed() || (mode !== 'prompt' && mode !== 'ios'))) return;
        setReason(r);
      }),
    [mode],
  );

  // Après l'inscription : proposition sur la page d'arrivée, une fois le navigateur prêt.
  useEffect(() => {
    if (mode === 'unknown' || !takeSignupInstall()) return;
    const t = setTimeout(() => {
      if (mode !== 'installed' && (mode === 'prompt' || mode === 'ios') && !installSnoozed()) setReason('signup');
    }, 1200);
    return () => clearTimeout(t);
  }, [mode, pathname]);

  const close = () => {
    if (reason && reason !== 'settings') snoozeInstall();
    setReason(null);
  };

  const install = async () => {
    const accepted = await promptInstall();
    if (accepted) setReason(null);
  };

  const copy = TITLES[shown];

  return (
    <Sheet open={reason !== null} onClose={close} title="Installer l’app">
      <div className="overflow-y-auto px-5 pb-6">
        <div className="relative isolate flex flex-col items-center pt-8 text-center">
          <div className="pointer-events-none absolute left-1/2 top-[72px] -z-10 w-[200px] -translate-x-1/2 -translate-y-1/2 opacity-55">
            <LiquidBlob className="h-auto w-full" speed={0.3} seed={8} glow={false} />
          </div>
          {/* L'icône telle qu'elle apparaîtra sur l'écran d'accueil. */}
          {/* eslint-disable-next-line @next/next/no-img-element -- icône locale, taille fixe */}
          <img
            src="/icons/icon-192.png"
            alt=""
            width={84}
            height={84}
            className="size-[84px] rounded-[22px] shadow-[0_18px_44px_-12px_var(--color-accent)]"
          />
          <h2 className="mt-6 text-balance text-[24px] font-black leading-tight tracking-[-0.03em]">{copy.title}</h2>
          <p className="mt-2 max-w-[320px] text-[14.5px] leading-snug text-white/65">{copy.text}</p>
        </div>

        {mode === 'installed' ? (
          <p className="mt-6 flex items-center justify-center gap-2 rounded-[20px] bg-white/[0.04] p-4 text-[15px] font-semibold">
            <CheckIcon size={18} className="text-accent" />
            VHOA est déjà installée sur cet appareil.
          </p>
        ) : mode === 'ios' ? (
          <ol className="mt-6 flex flex-col gap-2 rounded-[22px] bg-white/[0.04] p-4">
            <Step n={1} icon={<ShareIcon size={16} />}>
              Touche <b className="font-semibold text-white">Partager</b> dans la barre de Safari
            </Step>
            <Step n={2} icon={<PlusIcon size={16} />}>
              Choisis <b className="font-semibold text-white">« Sur l’écran d’accueil »</b>
            </Step>
            <Step n={3} icon={<PlayIcon size={14} />}>
              Ouvre VHOA depuis ton écran d’accueil
            </Step>
          </ol>
        ) : mode === 'manual' ? (
          <p className="mt-6 rounded-[20px] bg-white/[0.04] p-4 text-center text-[14px] leading-snug text-white/70">
            Ouvre le menu de ton navigateur et choisis <b className="font-semibold text-white">« Installer l’application »</b>{' '}
            ou <b className="font-semibold text-white">« Ajouter à l’écran d’accueil »</b>.
          </p>
        ) : (
          <ul className="mt-6 grid grid-cols-3 gap-2">
            <Perk icon={<PlayIcon size={14} />} seed={1.1}>
              En un appui
            </Perk>
            <Perk icon={<SparkIcon size={15} />} seed={2.4}>
              Plein écran
            </Perk>
            <Perk icon={<BellIcon size={15} />} seed={3.7}>
              Notifications
            </Perk>
          </ul>
        )}

        <div className="mt-6 flex flex-col gap-2">
          {mode === 'prompt' && (
            <button
              type="button"
              onClick={install}
              className="h-14 rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110">
              Installer l’app
            </button>
          )}
          <button
            type="button"
            onClick={close}
            className={`h-12 rounded-full text-[15px] font-semibold transition-colors ${
              mode === 'prompt' ? 'text-white/65 hover:text-white' : 'bg-white/[0.08] text-white hover:bg-white/[0.12]'
            }`}>
            {mode === 'prompt' ? 'Plus tard' : 'J’ai compris'}
          </button>
        </div>
      </div>
    </Sheet>
  );
}

function Step({ n, icon, children }: { n: number; icon: ReactNode; children: ReactNode }) {
  return (
    <li className="flex items-center gap-3 text-[14px] leading-snug text-white/75">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-accent/15 text-accent" aria-hidden>
        {icon}
      </span>
      <span className="sr-only">Étape {n} :</span>
      <span>{children}</span>
    </li>
  );
}

function Perk({ icon, seed, children }: { icon: ReactNode; seed: number; children: ReactNode }) {
  return (
    <li className="flex flex-col items-center gap-2 rounded-[20px] bg-white/[0.04] px-1.5 py-3.5 text-center">
      <BlobBadge size={32} seed={seed}>
        {icon}
      </BlobBadge>
      <span className="text-[12.5px] font-semibold leading-tight text-white/85">{children}</span>
    </li>
  );
}
