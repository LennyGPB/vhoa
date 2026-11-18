'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';

import { loadAnalysis, requestAnalysis, type Analysis } from '@/app/actions/public';
import { notifySessionChange } from '@/lib/use-session';

import { BlobBadge } from './BlobBadge';
import { BackIcon, SparkIcon } from './icons';

/* Débit idéal à l'oral : 110 à 170 mots/min (paceLabel côté API). */
const PACE_MIN = 70;
const PACE_MAX = 220;
const POLL_MS = 3000;

const pct = (v: number, min: number, max: number) => Math.min(100, Math.max(0, ((v - min) / (max - min)) * 100));
const sec = (s: number) => `${(Math.round(s * 10) / 10).toString().replace('.', ',')} s`;

function Stat({ value, label, note }: { value: string; label: string; note?: string }) {
  return (
    <div className="glass-solid flex flex-col rounded-[22px] p-4">
      <span className="text-[30px] font-black leading-none tracking-[-0.04em]">{value}</span>
      <span className="mt-1.5 text-[12px] font-medium text-white/50">{label}</span>
      {note && <span className="mt-1.5 text-[12px] font-semibold text-azure">{note}</span>}
    </div>
  );
}

/** Évolution par rapport aux analyses précédentes (Premium). */
function Delta({ label, d, unit, lowerIsBetter }: { label: string; d?: { current: number; average: number; delta: number }; unit: string; lowerIsBetter?: boolean }) {
  if (!d) return null;
  const better = lowerIsBetter ? d.delta < 0 : d.delta > 0;
  const sign = d.delta > 0 ? '+' : '';
  return (
    <div className="flex items-center justify-between rounded-2xl bg-white/[0.04] px-4 py-3">
      <span className="text-[14px] text-white/70">{label}</span>
      <span className={`text-[14px] font-semibold ${d.delta === 0 ? 'text-white/60' : better ? 'text-[#22B07D]' : 'text-[#FF8FA3]'}`}>
        {sign}
        {Math.round(d.delta * 10) / 10} {unit}
      </span>
    </div>
  );
}

function Done({ a }: { a: Analysis }) {
  const m = a.metrics!;
  const fillers = (m.fillers ?? []).filter((f) => f.count > 0).sort((x, y) => y.count - x.count);
  return (
    <>
      {/* Les chiffres clés */}
      <div className="grid grid-cols-2 gap-2">
        <Stat value={String(Math.round(m.wordsPerMinute))} label="Mots par minute" note={`Débit ${m.pace}`} />
        <Stat value={String(m.fillerCount)} label="Mots parasites" />
        <Stat value={String(m.silenceCount)} label="Silences" note={m.silenceCount ? `le plus long : ${sec(m.longestSilence)}` : undefined} />
        <Stat value={`${Math.round(m.speakingRatio * 100)} %`} label="Temps de parole" />
      </div>

      {/* Débit, avec la zone idéale surlignée. */}
      <section className="glass-solid rounded-[22px] p-5">
        <h2 className="text-[15px] font-semibold">Ton débit</h2>
        <div className="relative mt-4 h-2 rounded-full bg-white/[0.08]">
          <span
            className="absolute inset-y-0 rounded-full bg-accent/25"
            style={{ left: `${pct(110, PACE_MIN, PACE_MAX)}%`, right: `${100 - pct(170, PACE_MIN, PACE_MAX)}%` }}
          />
          <span
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent shadow-[0_0_12px_var(--color-accent)] ring-[3px] ring-[#16171b]"
            style={{ left: `${pct(m.wordsPerMinute, PACE_MIN, PACE_MAX)}%` }}
          />
        </div>
        <div className="mt-2 flex justify-between text-[11px] text-white/40">
          <span>Trop lent</span>
          <span className="font-semibold text-azure">Idéal</span>
          <span>Trop rapide</span>
        </div>
      </section>

      {fillers.length > 0 && (
        <section className="glass-solid rounded-[22px] p-5">
          <h2 className="text-[15px] font-semibold">Tes mots parasites</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {fillers.map((f) => (
              <li key={f.word} className="rounded-full bg-white/[0.06] px-3 py-1.5 text-[13px] font-semibold text-white/85">
                « {f.word} » <span className="text-accent">×{f.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Le retour du coach */}
      {a.structure && (
        <section className="glass-solid relative overflow-hidden rounded-[22px] p-5">
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(60%_100%_at_50%_0%,rgb(74_168_255/0.14),transparent)]"
          />
          <div className="relative flex items-center gap-3">
            <BlobBadge size={40} seed={3.3}>
              <SparkIcon size={16} />
            </BlobBadge>
            <h2 className="text-[15px] font-semibold">Ton coach</h2>
          </div>
          <p className="relative mt-4 text-[15px] leading-relaxed text-white/85">{a.structure}</p>
        </section>
      )}

      {/* Premium : retour détaillé + comparaison */}
      {a.details ? (
        <section className="glass-solid flex flex-col gap-4 rounded-[22px] p-5">
          {a.details.argumentation && (
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/45">Argumentation</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">{a.details.argumentation}</p>
            </div>
          )}
          {a.details.rhythm && (
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/45">Rythme</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-white/85">{a.details.rhythm}</p>
            </div>
          )}
          {a.details.tips && a.details.tips.length > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/45">À travailler</h3>
              <ol className="mt-2 flex flex-col gap-2.5">
                {a.details.tips.map((tip, i) => (
                  <li key={tip} className="flex gap-3 text-[15px] leading-relaxed text-white/85">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-accent/15 text-[12px] font-bold text-accent">
                      {i + 1}
                    </span>
                    {tip}
                  </li>
                ))}
              </ol>
            </div>
          )}
          {a.comparison && a.comparison.previousCount > 0 && (
            <div>
              <h3 className="text-[13px] font-semibold uppercase tracking-[0.12em] text-white/45">
                Par rapport à tes {a.comparison.previousCount} dernières prises
              </h3>
              <div className="mt-2 flex flex-col gap-1.5">
                <Delta label="Débit" d={a.comparison.wordsPerMinute} unit="mots/min" />
                <Delta label="Mots parasites" d={a.comparison.fillersPerMinute} unit="/ min" lowerIsBetter />
                <Delta label="Temps de parole" d={a.comparison.speakingRatio} unit="" />
              </div>
              {a.details.comparison && <p className="mt-3 text-[14px] leading-relaxed text-white/70">{a.details.comparison}</p>}
            </div>
          )}
        </section>
      ) : (
        <section className="rounded-[22px] bg-accent/10 p-5 shadow-[inset_0_0_0_1.5px_var(--color-accent)]">
          <h2 className="flex items-center gap-2 text-[15px] font-semibold">
            <SparkIcon size={16} className="text-accent" />
            Va plus loin avec Premium
          </h2>
          <p className="mt-1.5 text-[14px] leading-relaxed text-white/70">
            Retour détaillé sur ton argumentation et ton rythme, conseils personnalisés, comparaison avec tes prises
            précédentes et 60 analyses par mois.
          </p>
          <Link
            href="/premium"
            className="mt-4 inline-flex h-11 items-center rounded-full bg-accent px-5 text-[14px] font-semibold text-white transition-[filter] hover:brightness-110">
            Découvrir Premium
          </Link>
        </section>
      )}
    </>
  );
}

/** Page du coach IA pour une prise : attente, résultat, ou demande d'analyse. */
export function AnalysisScreen() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [state, setState] = useState<Analysis | 'none' | 'error' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Chargement, puis nouvelle vérification toutes les 3 s tant que l'analyse est en cours.
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      const res = await loadAnalysis(id);
      if (stopped) return;
      if (!res.ok) {
        if (res.code === 'AUTH') {
          notifySessionChange();
          return router.replace('/connexion');
        }
        setState(res.code === 'NONE' ? 'none' : 'error');
        if (res.code !== 'NONE') setMessage(res.message);
        return;
      }
      setState(res.data);
      if (res.data.status === 'pending') timer = setTimeout(load, POLL_MS);
    };
    load();
    return () => {
      stopped = true;
      clearTimeout(timer);
    };
  }, [id, router]);

  const ask = () =>
    startTransition(async () => {
      const res = await requestAnalysis(id);
      if (!res.ok) return setMessage(res.message);
      setMessage(null);
      setState(res.data);
      // On revérifie l'avancement jusqu'au résultat.
      const poll = async () => {
        const r = await loadAnalysis(id);
        if (r.ok) {
          setState(r.data);
          if (r.data.status === 'pending') setTimeout(poll, POLL_MS);
        }
      };
      setTimeout(poll, POLL_MS);
    });

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -right-48 -top-40 size-[560px] opacity-50" />
      </div>
      <main className="relative mx-auto flex max-w-lg flex-col gap-4 px-4 pb-40 pt-[max(env(safe-area-inset-top),20px)]">
        <header className="mb-2 flex items-center gap-3">
          <button
            type="button"
            onClick={() => (window.history.length > 1 ? router.back() : router.push('/profil'))}
            aria-label="Retour"
            className="glass grid size-11 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </button>
          <h1 className="text-[24px] font-bold tracking-[-0.02em]">Ton analyse</h1>
        </header>

        {state === null && (
          <div className="grid grid-cols-2 gap-2">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-[104px] animate-pulse rounded-[22px] bg-white/[0.04]" />
            ))}
          </div>
        )}

        {state !== null && typeof state === 'object' && state.status === 'pending' && (
          <div className="glass-frame flex flex-col items-center rounded-[28px] px-6 py-12 text-center">
            <BlobBadge size={72} seed={1}>
              <SparkIcon size={28} />
            </BlobBadge>
            <h2 className="mt-5 text-[22px] font-bold">Ton coach écoute ta prise…</h2>
            <p className="mt-2 text-[15px] text-white/60">Débit, mots parasites, silences, structure : ça prend une petite minute.</p>
          </div>
        )}

        {state !== null && typeof state === 'object' && state.status === 'failed' && (
          <div className="glass-frame rounded-[28px] px-6 py-10 text-center">
            <h2 className="text-[22px] font-bold">L’analyse a échoué</h2>
            <p className="mt-2 text-[15px] text-white/60">{state.error ?? 'Réessaie avec une nouvelle prise.'}</p>
          </div>
        )}

        {state !== null && typeof state === 'object' && state.status === 'done' && state.metrics && <Done a={state} />}

        {state === 'none' && (
          <div className="glass-frame flex flex-col items-center rounded-[28px] px-6 py-10 text-center">
            <BlobBadge size={64} seed={2}>
              <SparkIcon size={26} />
            </BlobBadge>
            <h2 className="mt-5 text-[22px] font-bold">Pas encore d’analyse</h2>
            <p className="mt-2 text-[15px] text-white/60">Ton coach peut analyser cette prise : 1 analyse offerte chaque mois.</p>
            <button
              type="button"
              disabled={pending}
              onClick={ask}
              className="mt-7 h-14 w-full rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] disabled:opacity-60">
              {pending ? 'Envoi…' : 'Analyser ma prise'}
            </button>
          </div>
        )}

        {state === 'error' && (
          <div className="glass-frame rounded-[28px] px-6 py-10 text-center">
            <h2 className="text-[22px] font-bold">Analyse introuvable</h2>
            <Link href="/profil" className="mt-6 inline-flex h-12 items-center rounded-full bg-accent px-6 text-[15px] font-semibold text-white">
              Retour au profil
            </Link>
          </div>
        )}

        {message && (
          <p role="alert" className="rounded-2xl bg-[#FF4D6D]/10 px-4 py-3 text-[14px] font-medium text-[#FF8FA3]">
            {message}
          </p>
        )}
      </main>
    </div>
  );
}
