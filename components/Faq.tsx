import { FAQ } from '@/lib/faq';

/**
 * Questions fréquentes en accordéon natif (<details>) : accessible au clavier,
 * et tout le texte reste dans la page, donc lisible par Google.
 */
export function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="relative scroll-mt-10 px-5 pb-28 sm:px-10 sm:pb-36">
      <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
        <div>
          <h2
            id="faq-title"
            className="text-balance text-[clamp(34px,5.2vw,64px)] font-bold leading-[1.02] tracking-[-0.035em]">
            Questions
            <br />
            <span className="text-white/40">fréquentes.</span>
          </h2>
          <p className="mt-5 max-w-sm text-[15px] leading-relaxed text-muted">
            Tout ce qu’il faut savoir sur VHOA, l’app pour s’entraîner à la prise de parole.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {FAQ.map((item, i) => (
            <details
              key={item.q}
              open={i === 0}
              className="glass-solid group rounded-[24px] px-6 transition-[background-color] open:bg-[#191b21] sm:px-7">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-5 text-[17px] font-semibold tracking-tight [&::-webkit-details-marker]:hidden">
                <h3>{item.q}</h3>
                {/* Pastille « + » qui pivote en « × » à l'ouverture. */}
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-full bg-white/[0.06] text-white/70 transition-[transform,background-color,color] duration-300 group-open:rotate-45 group-open:bg-accent group-open:text-white">
                  <svg width="12" height="12" viewBox="0 0 12 12">
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </span>
              </summary>
              <p className="-mt-1 pb-6 pr-10 text-[15px] leading-relaxed text-muted">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
