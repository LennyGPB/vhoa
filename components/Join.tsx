import { SITE } from '@/lib/site';

import { BlobBadge } from './BlobBadge';
import { CardBridge } from './BlobBridge';
import { ArrowIcon, DiscordIcon, VoiceWaveIcon } from './icons';
import { WaitlistForm } from './WaitlistForm';

const PERKS = ['Thèmes en avant-première', 'Accès à la bêta', 'Coulisses du développement'];

/** Liste d'attente et Discord : deux cartes en verre reliées par un pont liquide. */
export function Join() {
  return (
    <section id="rejoindre" className="relative isolate scroll-mt-10 overflow-hidden px-5 pb-28 pt-10 sm:px-10 sm:pb-36">
      {/* Lueurs derrière le verre */}
      <div aria-hidden className="absolute inset-0 -z-10">
        <span className="soft-blob -left-[8%] top-[8%] size-[440px] opacity-70" style={{ ['--dx' as string]: '60px', ['--dy' as string]: '-40px' }} />
        <span
          className="soft-blob -right-[8%] bottom-[0%] size-[440px] opacity-70"
          style={{ ['--dx' as string]: '-50px', ['--dy' as string]: '50px', ['--dur' as string]: '18s' }}
        />
      </div>

      <div className="mx-auto max-w-6xl">
        <h2 className="mx-auto max-w-2xl text-center text-[clamp(34px,5.2vw,64px)] font-bold leading-[1.02] tracking-[-0.035em]">
          Prêt à prendre
          <br />
          la parole ?
        </h2>

        <div className="mt-16 flex flex-col items-stretch md:grid md:grid-cols-[1fr_40px_1fr]">
          {/* Liste d'attente */}
          <article className="glass-solid flex flex-col rounded-[32px] p-7 sm:p-10">
            <BlobBadge size={60}>
              <VoiceWaveIcon size={22} />
            </BlobBadge>
            <h3 className="mt-8 text-[26px] font-bold tracking-tight">Liste d’attente</h3>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
              Inscris-toi pour être prévenu·e dès la sortie de VHOA sur ton téléphone.
            </p>
            <div className="mt-auto pt-9">
              <WaitlistForm />
            </div>
          </article>

          <CardBridge />

          {/* Discord */}
          <article className="glass-solid flex flex-col rounded-[32px] p-7 sm:p-10">
            <BlobBadge size={60} seed={3}>
              <DiscordIcon size={24} />
            </BlobBadge>
            <h3 className="mt-8 text-[26px] font-bold tracking-tight">La communauté</h3>
            <p className="mt-2 max-w-sm text-[15px] leading-relaxed text-muted">
              Rejoins le Discord pour suivre le projet de près et donner ton avis avant tout le monde.
            </p>
            <ul className="mt-7 flex flex-col gap-3">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-center gap-3 text-[15px] text-white/85">
                  <span aria-hidden className="size-1.5 rounded-full bg-accent" />
                  {perk}
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-9">
              <a
                href={SITE.discord}
                target="_blank"
                rel="noreferrer"
                className="group flex items-center justify-between rounded-full bg-white py-1.5 pl-6 pr-1.5 text-[15px] font-semibold text-canvas transition-[filter] hover:brightness-95">
                <span className="flex items-center gap-3">
                  <DiscordIcon size={22} className="text-[#5865F2]" />
                  Rejoindre le Discord
                </span>
                <span className="grid size-10 place-items-center rounded-full bg-canvas text-white transition-transform group-hover:translate-x-0.5">
                  <ArrowIcon size={16} />
                </span>
              </a>
            </div>
          </article>
        </div>
      </div>
    </section>
  );
}
