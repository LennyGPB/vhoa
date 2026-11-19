import Link from 'next/link';

import { CREATE_HREF, SITE } from '@/lib/site';

import { AccountNav } from './AccountNav';
import { ArrowIcon, DiscordIcon, InstagramIcon, TikTokIcon, VoiceWaveIcon } from './icons';
import { LiquidBlob } from './LiquidBlob';
import { Logo } from './Logo';
import { HomeTopTakes, ThemeCardHead, ThemePill, ThemeSubject } from './HomeTheme';

const NAV = [
  { href: '#concept', label: 'Comment ça marche' },
  { href: '/feed', label: 'Les prises' },
  { href: '#coach', label: 'Coach IA' },
  { href: '/defis', label: 'Défis' },
  { href: SITE.discord, label: 'Communauté' },
];

const SOCIALS = [
  { href: SITE.socials.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: SITE.socials.tiktok, label: 'TikTok', Icon: TikTokIcon },
  { href: SITE.discord, label: 'Discord', Icon: DiscordIcon },
];

/**
 * Hero : un grand blob derrière un cadre en verre dépoli, le nom VHOA avec sa goutte,
 * puis le thème de la semaine et le bouton pour prendre la parole (qui mène à l'inscription).
 * Les meilleures prises du thème débordent sous le cadre, reliées par le pont liquide.
 */
export function Hero() {
  return (
    // Le grand blob déborde autour, jusque sur la section suivante : on ne coupe qu'à l'horizontale.
    <section className="relative isolate flex min-h-[min(100svh,1100px)] flex-col justify-center overflow-x-clip px-3 pb-0 pt-20 sm:px-6 sm:pb-16 sm:pt-8 lg:px-12">
      {/* Barre du haut sur mobile (la navigation est dans la barre d'onglets en bas : TabBar). */}
      <div className="absolute inset-x-4 top-4 z-30 flex items-center justify-between md:hidden">
        <a href="#" aria-label="VHOA, retour en haut" className="pl-1">
          <Logo height={30} />
        </a>
        <AccountNav compact />
      </div>

      {/* Grand blob d'arrière-plan : il déborde du cadre en haut et en bas. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[230vw] -translate-x-1/2 -translate-y-1/2 opacity-90 sm:w-[min(165svh,1800px,150vw)]">
        <LiquidBlob className="h-auto w-full" speed={0.25} seed={4} glow={false} />
      </div>

      {/* Thème en direct, posé au-dessus du cadre : le site vit au rythme de la semaine. */}
      <ThemePill className="mb-4 sm:mb-5" />

      <div className="glass-frame relative flex flex-col rounded-[28px] sm:rounded-[36px]">
        {/* Navigation ordinateur (sur mobile : barre d'onglets en bas). */}
        <header className="hidden items-center justify-between gap-4 px-10 pt-8 md:flex">
          <div className="flex items-center gap-10">
            <a href="#" aria-label="VHOA, retour en haut" className="pl-1 transition-opacity hover:opacity-80">
              <Logo height={30} />
            </a>
            <nav aria-label="Navigation principale" className="flex items-center gap-9">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-medium text-white/70 transition-colors hover:text-white xl:text-[14px] 2xl:text-[15px]">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <AccountNav />
        </header>

        {/* Repères latéraux, comme une affiche. */}
        <p className="absolute left-7 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[11px] font-semibold tracking-[0.3em] text-white/55 lg:block">
          2026
        </p>
        <ul className="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col gap-5 lg:flex">
          {SOCIALS.map(({ href, label, Icon }) => (
            <li key={label}>
              <a href={href} aria-label={label} className="block text-white/60 transition-colors hover:text-white">
                <Icon size={16} />
              </a>
            </li>
          ))}
        </ul>

        <div className="relative flex flex-col items-center px-4 pb-32 pt-8 sm:px-10 sm:pb-36 sm:pt-12 xl:pb-44 2xl:pb-52">
          {/* Nom + goutte */}
          <div className="relative mt-4 sm:mt-6">
            {/* Pas d'animation d'apparition ici : c'est le plus gros élément de la page (mesure LCP de Google). */}
            <h1 className="select-none text-[28vw] font-black leading-[0.9] tracking-[-0.065em] text-[#E4F1FF] [filter:drop-shadow(0_24px_50px_rgb(0_0_0/0.45))] sm:text-[clamp(96px,18vw,260px)]">
              VHOA
              {/* Lu par Google et les lecteurs d'écran, invisible à l'œil. */}
              <span className="sr-only"> : prends la parole et progresse à l’oral</span>
            </h1>
            {/* Pas de `filter` sur ces parents : il empêcherait le verre de flouter les lettres derrière. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 w-[42vw] -translate-x-[47%] -translate-y-1/2 sm:w-[clamp(160px,20vw,300px)]">
              <span
                aria-hidden
                className="absolute inset-x-[18%] -bottom-[6%] h-[16%] rounded-[50%] bg-[#020a1e]/70 blur-2xl"
              />
              <div className="float">
                <LiquidBlob speed={1.1} intensity={1.9} glass />
              </div>
            </div>
          </div>

          <p
            className="rise mt-6 text-center text-[15px] font-medium text-azure/80 sm:mt-7 sm:text-[17px] xl:text-[19px] 2xl:text-[21px]"
            style={{ animationDelay: '140ms' }}>
            {SITE.tagline}
          </p>

          {/* Carte du thème : le sujet et l'action principale. */}
          <div
            className="rise glass mt-9 w-full max-w-[640px] rounded-[28px] p-5 sm:mt-10 sm:p-7 xl:max-w-[760px] xl:rounded-[32px] xl:p-9 2xl:max-w-[860px]"
            style={{ animationDelay: '220ms' }}>
            <ThemeCardHead />
            <ThemeSubject
              className="mt-3 text-[clamp(20px,2.6vw,26px)] font-bold leading-snug tracking-[-0.02em] text-white xl:text-[32px] 2xl:text-[36px]"
              fallback="Une minute pour convaincre, sur le sujet de ton choix."
            />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center xl:mt-8">
              {/* Il faut un compte pour publier : le bouton mène à l'inscription. */}
              <Link
                href={CREATE_HREF}
                className="group inline-flex h-14 w-full shrink-0 items-center justify-between gap-4 rounded-full bg-accent pl-6 pr-1.5 sm:w-auto sm:flex-1 text-[16px] font-semibold xl:h-16 xl:pl-7 xl:text-[18px] text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]">
                <span className="flex items-center gap-2.5 whitespace-nowrap">
                  <VoiceWaveIcon size={20} />
                  Prendre la parole
                  {/* Sur petit écran, le libellé tiendrait sur deux lignes. */}
                  <span className="-ml-1 hidden min-[420px]:inline">· 1 min</span>
                </span>
                <span className="grid size-11 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                  <ArrowIcon size={18} />
                </span>
              </Link>
              <Link
                href="/feed"
                className="inline-flex h-14 items-center justify-center rounded-full px-6 text-[16px] font-semibold text-white/85 xl:h-16 xl:px-8 xl:text-[18px] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.12)] transition-[background-color,color] hover:bg-white/[0.06] hover:text-white">
                Écouter les prises
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Meilleures prises du thème : elles chevauchent le bas du cadre. */}
      <HomeTopTakes />
    </section>
  );
}
