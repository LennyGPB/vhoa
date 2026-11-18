'use client';

import { useState, type FormEvent, type KeyboardEvent } from 'react';

import { prepareUpload, submitPost, type CurrentTheme, type PublishMode } from '@/app/actions/create';

import { BackIcon, CheckIcon, CloseIcon, FlameIcon, MicIcon, SparkIcon, VideoIcon } from '../icons';
import { CATEGORIES, clock, uploadFile, type Recording } from './shared';

const MODES: { key: PublishMode; title: string; text: string; cta: string }[] = [
  { key: 'public', title: 'Publier', text: 'Visible par tous après une vérification automatique.', cta: 'Publier' },
  { key: 'draft', title: 'Brouillon', text: 'Gardé pour plus tard, rien n’est publié.', cta: 'Enregistrer le brouillon' },
  { key: 'ai', title: 'Coach IA seulement', text: 'Reste privé : seul ton coach IA l’écoute.', cta: 'Envoyer au coach IA' },
];

const TAG_RE = /^[\p{L}\p{N}_]{1,30}$/u;

/** Étape 3 : titre, catégorie, hashtags, thème, mode ; puis envoi du fichier et validation. */
export function DetailsStep({
  recording,
  theme,
  initialMode = 'public',
  onBack,
  onDone,
}: {
  recording: Recording;
  theme: CurrentTheme | null;
  /** Mode choisi d'avance (« Coach IA seulement » en arrivant par le coach). */
  initialMode?: PublishMode;
  onBack: () => void;
  onDone: (postId: string, mode: PublishMode) => void;
}) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDraft, setTagDraft] = useState('');
  const [joinTheme, setJoinTheme] = useState(true);
  const [mode, setMode] = useState<PublishMode>(initialMode);
  const [error, setError] = useState<string | null>(null);
  /** null = pas d'envoi en cours ; sinon progression 0 → 1. */
  const [upload, setUpload] = useState<number | null>(null);

  const addTag = (raw: string) => {
    const tag = raw.trim().replace(/^#+/, '').toLowerCase();
    if (!tag) return;
    if (!TAG_RE.test(tag)) return setError('Hashtag : lettres, chiffres ou tiret bas, 30 caractères max.');
    setTags((t) => (t.includes(`#${tag}`) || t.length >= 5 ? t : [...t, `#${tag}`]));
    setTagDraft('');
  };

  const onTagKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === ',') {
      e.preventDefault();
      addTag(tagDraft);
    } else if (e.key === 'Backspace' && !tagDraft) {
      setTags((t) => t.slice(0, -1));
    }
  };

  const send = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    if (mode === 'public' && title.trim().length < 3) return setError('Ajoute un titre (3 caractères minimum).');
    if (mode === 'public' && !category) return setError('Choisis une catégorie.');
    const hashtags = tagDraft.trim() ? [...tags, `#${tagDraft.trim().replace(/^#+/, '').toLowerCase()}`].slice(0, 5) : tags;

    setUpload(0);
    try {
      // 1. L'API prépare le post et donne une adresse d'envoi signée.
      const prepared = await prepareUpload({
        type: recording.format,
        mimeType: recording.mime,
        sizeBytes: recording.blob.size,
        duration: Math.round(recording.duration * 10) / 10,
      });
      if (!prepared.ok) throw new Error(prepared.message);

      // 2. Le fichier part directement du navigateur vers le stockage.
      try {
        await uploadFile(prepared.data.uploadUrl, recording.blob, prepared.data.headers, setUpload);
      } catch {
        throw new Error('Envoi interrompu. Vérifie ta connexion et réessaie.');
      }

      // 3. Infos de la prise + lancement du traitement (conversion, transcription, modération).
      const submitted = await submitPost({
        postId: prepared.data.postId,
        mode,
        title,
        category,
        hashtags,
        joinTheme: Boolean(theme) && joinTheme,
      });
      if (!submitted.ok) throw new Error(submitted.message);
      onDone(prepared.data.postId, mode);
    } catch (err) {
      setUpload(null);
      setError(err instanceof Error ? err.message : 'Une erreur est survenue, réessaie.');
    }
  };

  const sending = upload !== null;
  const cta = MODES.find((m) => m.key === mode)!.cta;

  return (
    <div className="min-h-svh bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -right-40 -top-40 size-[560px] opacity-60" />
      </div>

      <form onSubmit={send} className="relative mx-auto flex max-w-lg flex-col gap-7 px-5 pb-36 pt-[max(env(safe-area-inset-top),16px)]">
        <header className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            disabled={sending}
            aria-label="Retour à l’aperçu"
            className="glass grid size-11 place-items-center rounded-full text-white disabled:opacity-40">
            <BackIcon size={20} />
          </button>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">Ta prise</h1>
          <span className="glass ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12px] font-semibold text-white/80">
            {recording.format === 'video' ? <VideoIcon size={14} /> : <MicIcon size={14} />}
            {clock(recording.duration)}
          </span>
        </header>

        {/* Titre */}
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-white/70">Titre</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={100}
            disabled={sending}
            placeholder="Résume ta prise en une phrase"
            className="h-13 rounded-2xl bg-white/[0.05] px-4 text-[16px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)]"
          />
        </label>

        {/* Catégorie : sélection en bleu (D.A.). */}
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[13px] font-semibold text-white/70">Catégorie</legend>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((c) => {
              const on = category === c;
              return (
                <button
                  key={c}
                  type="button"
                  disabled={sending}
                  aria-pressed={on}
                  onClick={() => setCategory(on ? null : c)}
                  className={`h-10 rounded-full px-4 text-[14px] font-semibold transition-colors ${
                    on
                      ? 'bg-accent text-white shadow-[0_8px_24px_-8px_var(--color-accent)]'
                      : 'bg-white/[0.05] text-white/75 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] hover:text-white'
                  }`}>
                  {c}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Hashtags */}
        <label className="flex flex-col gap-2">
          <span className="text-[13px] font-semibold text-white/70">
            Hashtags <span className="font-medium text-white/40">· facultatif</span>
          </span>
          <div className="flex min-h-13 flex-wrap items-center gap-2 rounded-2xl bg-white/[0.05] px-3 py-2 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] focus-within:shadow-[inset_0_0_0_1.5px_var(--color-accent)]">
            {tags.map((t) => (
              <span key={t} className="inline-flex items-center gap-1 rounded-full bg-accent/15 py-1 pl-3 pr-1.5 text-[13px] font-semibold text-azure">
                {t}
                <button
                  type="button"
                  onClick={() => setTags((list) => list.filter((x) => x !== t))}
                  aria-label={`Retirer ${t}`}
                  className="grid size-5 place-items-center rounded-full hover:bg-white/10">
                  <CloseIcon size={12} />
                </button>
              </span>
            ))}
            {tags.length < 5 && (
              <input
                value={tagDraft}
                onChange={(e) => setTagDraft(e.target.value)}
                onKeyDown={onTagKey}
                onBlur={() => tagDraft && addTag(tagDraft)}
                disabled={sending}
                placeholder={tags.length ? 'Ajouter…' : '#éloquence'}
                className="h-9 min-w-24 flex-1 bg-transparent px-1 text-[15px] text-white placeholder:text-white/35 outline-none"
              />
            )}
          </div>
        </label>

        {/* Défi de la semaine accepté en arrivant (publication seulement) : on peut encore se retirer. */}
        {theme && mode === 'public' && (
          <button
            type="button"
            onClick={() => setJoinTheme((j) => !j)}
            disabled={sending}
            aria-pressed={joinTheme}
            className={`flex items-center gap-4 rounded-[22px] p-4 text-left transition-shadow ${
              joinTheme
                ? 'bg-accent/10 shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
                : 'bg-white/[0.04] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]'
            }`}>
            <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
              <FlameIcon size={18} />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-white">Défi de la semaine relevé</span>
              <span className="mt-0.5 block truncate text-[13px] text-white/55">« {theme.subject} »</span>
            </span>
            <span
              aria-hidden
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${joinTheme ? 'bg-accent' : 'bg-white/15'}`}>
              <span
                className={`absolute top-1 size-5 rounded-full bg-white transition-[left] duration-200 ${joinTheme ? 'left-6' : 'left-1'}`}
              />
            </span>
          </button>
        )}

        {/* Mode de publication. */}
        <fieldset className="flex flex-col gap-2.5">
          <legend className="mb-2.5 text-[13px] font-semibold text-white/70">Que veux-tu en faire ?</legend>
          {MODES.map((m) => {
            const on = mode === m.key;
            return (
              <button
                key={m.key}
                type="button"
                disabled={sending}
                aria-pressed={on}
                onClick={() => setMode(m.key)}
                className={`flex items-center gap-4 rounded-[22px] p-4 text-left transition-shadow ${
                  on
                    ? 'bg-accent/10 shadow-[inset_0_0_0_1.5px_var(--color-accent)]'
                    : 'bg-white/[0.04] shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)]'
                }`}>
                <span
                  className={`grid size-6 shrink-0 place-items-center rounded-full transition-colors ${
                    on ? 'bg-accent text-white' : 'shadow-[inset_0_0_0_1.5px_rgb(255_255_255/0.25)]'
                  }`}>
                  {on && <CheckIcon size={14} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-[15px] font-semibold text-white">
                    {m.key === 'ai' && <SparkIcon size={14} className="text-accent" />}
                    {m.title}
                  </span>
                  <span className="mt-0.5 block text-[13px] text-white/55">{m.text}</span>
                </span>
              </button>
            );
          })}
        </fieldset>

        {error && (
          <p role="alert" className="rounded-2xl bg-[#FF4D6D]/10 px-4 py-3 text-[14px] font-medium text-[#FF8FA3]">
            {error}
          </p>
        )}

        {/* Bouton d'envoi, fixé en bas (pouce). */}
        <div className="fixed inset-x-0 bottom-0 bg-[linear-gradient(transparent,var(--color-canvas)_35%)] px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-8">
          <button
            type="submit"
            disabled={sending}
            className="relative mx-auto block h-14 w-full max-w-lg overflow-hidden rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter] hover:brightness-110 disabled:cursor-wait">
            {/* Progression de l'envoi, qui remplit le bouton. */}
            {sending && (
              <span
                aria-hidden
                className="absolute inset-y-0 left-0 bg-white/20 transition-[width] duration-200"
                style={{ width: `${Math.round(upload * 100)}%` }}
              />
            )}
            <span className="relative">{sending ? `Envoi en cours… ${Math.round(upload * 100)} %` : cta}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
