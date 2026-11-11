import { SITE, WAITLIST_HASH } from '@/lib/site';

import { AndroidIcon, AppleIcon, ArrowIcon, DiscordIcon, InstagramIcon, TikTokIcon } from './icons';
import { LiquidBlob } from './LiquidBlob';
import { Logo } from './Logo';
import { MobileMenu } from './MobileMenu';

const NAV = [
  { href: '#concept', label: 'Le concept' },
  { href: WAITLIST_HASH, label: 'Liste d’attente' },
  { href: '#faq', label: 'FAQ' },
  { href: SITE.discord, label: 'Communauté' },
];

const SOCIALS = [
  { href: SITE.socials.instagram, label: 'Instagram', Icon: InstagramIcon },
  { href: SITE.socials.tiktok, label: 'TikTok', Icon: TikTokIcon },
  { href: SITE.discord, label: 'Discord', Icon: DiscordIcon },
];

/**
 * Hero : un grand blob derrière un cadre en verre dépoli (net hors du cadre, flou à travers),
 * le nom VHOA en très grand et une seconde goutte, nette, posée par-dessus.
 */
export function Hero() {
  return (
    // Le cadre prend la hauteur de son contenu et reste centré. Le grand blob déborde autour,
    // jusque sur la section suivante : on ne coupe qu'à l'horizontale (overflow-x-clip).
    <section className="relative isolate flex min-h-[min(100svh,1100px)] items-center overflow-x-clip px-3 pb-10 pt-24 sm:px-6 sm:py-16 lg:px-12">
      <MobileMenu items={NAV} cta={{ href: WAITLIST_HASH, label: 'Rejoindre la liste d’attente' }} />

      {/* Grand blob d'arrière-plan : il déborde du cadre en haut et en bas. */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 w-[230vw] sm:w-[min(165svh,1800px,150vw)] -translate-x-1/2 -translate-y-1/2 opacity-90">
        <LiquidBlob className="h-auto w-full" speed={0.25} seed={4} glow={false} />
      </div>

      <div className="glass-frame relative flex flex-1 flex-col rounded-[28px] sm:rounded-[36px]">
        {/* Navigation */}
        {/* Sur mobile, le logo et le menu sont dans la barre au-dessus du cadre (MobileMenu). */}
        <header className="flex items-center justify-center gap-4 px-4 pt-4 sm:px-10 sm:pt-8 md:justify-between">
          <div className="hidden items-center gap-10 md:flex">
            <a href="#" aria-label="VHOA, retour en haut" className="pl-1 transition-opacity hover:opacity-80">
              <Logo height={30} />
            </a>
            <nav aria-label="Navigation principale" className="flex items-center gap-9">
              {NAV.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="text-[13px] font-medium text-white/70 transition-colors hover:text-white">
                  {item.label}
                </a>
              ))}
            </nav>
          </div>

          <p className="glass inline-flex items-center gap-2.5 rounded-full px-4 py-2.5 text-[13px] font-semibold text-white/85">
            <span className="flex items-center gap-1.5 text-white">
              <AppleIcon size={14} />
              <AndroidIcon size={14} />
            </span>
            Bientôt sur iOS & Android
          </p>
        </header>

        {/* Repères latéraux, comme une affiche. */}
        <p className="absolute left-7 top-1/2 hidden -translate-y-1/2 -rotate-90 text-[11px] font-semibold tracking-[0.3em] text-white/55 lg:block">
          2026
        </p>
        <ul className="absolute right-8 top-1/2 hidden -translate-y-1/2 flex-col gap-5 lg:flex">
          {SOCIALS.map(({ href, label, Icon }) => (
            <li key={label}>
              <a
                href={href}
                aria-label={label}
                className="block text-white/60 transition-colors hover:text-white">
                <Icon size={16} />
              </a>
            </li>
          ))}
        </ul>

        {/* Nom + goutte */}
        <div className="relative flex flex-col items-center justify-center pb-14 pt-16 sm:pb-20 sm:pt-20">
          <div className="relative">
            {/* Pas d'animation d'apparition ici : c'est le plus gros élément de la page (mesure LCP de Google). */}
            <h1 className="select-none text-[31vw] sm:text-[clamp(96px,22vw,340px)] font-black leading-[0.9] tracking-[-0.065em] text-[#E4F1FF] [filter:drop-shadow(0_24px_50px_rgb(0_0_0/0.45))]">
              VHOA
              {/* Lu par Google et les lecteurs d'écran, invisible à l'œil. */}
              <span className="sr-only"> : l’app d’éloquence pour progresser à l’oral</span>
            </h1>
            {/* Pas de `filter` sur ces parents : il empêcherait le verre de flouter les lettres derrière. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 w-[46vw] sm:w-[clamp(170px,25vw,400px)] -translate-x-[47%] -translate-y-1/2">
              {/* Ombre portée, séparée de la goutte. */}
              <span
                aria-hidden
                className="absolute inset-x-[18%] -bottom-[6%] h-[16%] rounded-[50%] bg-[#020a1e]/70 blur-2xl"
              />
              {/* La goutte flotte en plus de se déformer. */}
              <div className="float">
                <LiquidBlob speed={1.1} intensity={1.9} glass />
              </div>
            </div>
          </div>

          <p
            className="rise mt-7 text-center text-[15px] font-medium text-azure/80 sm:mt-8 sm:text-[17px]"
            style={{ animationDelay: '140ms' }}>
            Prends la parole. Progresse chaque semaine.
          </p>

          {/* Les deux actions principales, au centre sous le nom. */}
          <div
            className="rise mt-9 flex w-full flex-col items-stretch gap-3 px-5 sm:mt-10 sm:w-auto sm:flex-row sm:items-center sm:gap-4 sm:px-0"
            style={{ animationDelay: '200ms' }}>
            <a
              href={WAITLIST_HASH}
              className="group inline-flex h-16 items-center justify-between gap-5 rounded-full bg-accent pl-8 pr-2 text-[17px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,transform] hover:brightness-110 active:scale-[0.98]">
              Rejoindre la liste d’attente
              <span className="grid size-12 place-items-center rounded-full bg-white/20 transition-transform group-hover:translate-x-0.5">
                <ArrowIcon size={20} />
              </span>
            </a>
            <a
              href={SITE.discord}
              target="_blank"
              rel="noreferrer"
              className="glass inline-flex h-16 items-center justify-center gap-3 rounded-full px-8 text-[17px] font-semibold text-white transition-[background-color,transform] hover:bg-white/10 active:scale-[0.98]">
              <DiscordIcon size={22} />
              Rejoindre le Discord
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
