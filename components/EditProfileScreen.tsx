'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useRef, useState, type ChangeEvent, type ComponentType, type FormEvent, type ReactNode } from 'react';

import {
  changePassword,
  confirmAvatar,
  loadEditableProfile,
  prepareAvatar,
  updateProfile,
  updateSettings,
  type AlertSettings,
  type EditableProfile,
} from '@/app/actions/profile';
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  BIO_MAX,
  DISPLAY_NAME_MAX,
  PASSWORD_HINT,
  PASSWORD_RE,
  USERNAME_HINT,
  USERNAME_RE,
} from '@/lib/profile-rules';
import { notifySessionChange } from '@/lib/use-session';

import { UserAvatar } from './AccountNav';
import { uploadFile } from './create/shared';
import { BackIcon, FlameIcon, HeartIcon, StepsIcon } from './icons';

/** Appareil photo (icône locale : components/icons.tsx est modifié ailleurs en parallèle). */
function CameraIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1.3l1.4-2h5.6l1.4 2h1.3A2.5 2.5 0 0 1 20 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 17.5z" />
      <circle cx="12" cy="13" r="3.5" />
    </svg>
  );
}

const ALERTS: { key: keyof AlertSettings; title: string; text: string; Icon: ComponentType<{ size?: number }> }[] = [
  { key: 'interactions', title: 'Interactions', text: 'J’aime, commentaires, nouveaux abonnés.', Icon: HeartIcon },
  { key: 'themes', title: 'Défis', text: 'Nouveau défi de la semaine et résultats.', Icon: FlameIcon },
  { key: 'progress', title: 'Progression', text: 'Série en danger, badges, analyses prêtes.', Icon: StepsIcon },
];

const field =
  'h-13 w-full rounded-2xl bg-white/[0.05] px-4 text-[16px] text-white placeholder:text-white/35 shadow-[inset_0_0_0_1px_rgb(255_255_255/0.08)] outline-none focus:shadow-[inset_0_0_0_1.5px_var(--color-accent)] disabled:opacity-60';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section aria-label={title} className="flex flex-col gap-3">
      <h2 className="px-1 text-[18px] font-bold">{title}</h2>
      {children}
    </section>
  );
}

/** Interrupteur bleu (même dessin que « Défi de la semaine » dans Créer). */
function Switch({ on }: { on: boolean }) {
  return (
    <span aria-hidden className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${on ? 'bg-accent' : 'bg-white/15'}`}>
      <span className={`absolute top-1 size-5 rounded-full bg-white transition-[left] duration-200 ${on ? 'left-6' : 'left-1'}`} />
    </span>
  );
}

/** Page « Modifier le profil » du membre connecté. */
export function EditProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<EditableProfile | null | 'error'>(null);
  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  /** Aperçu local de la photo choisie, et progression de l'envoi (null = pas d'envoi). */
  const [preview, setPreview] = useState<string | null>(null);
  const [upload, setUpload] = useState<number | null>(null);
  /** Alerte en cours d'enregistrement (évite les doubles clics). */
  const [alertBusy, setAlertBusy] = useState<keyof AlertSettings | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const expired = () => {
    notifySessionChange();
    router.replace('/connexion');
  };

  /** Remplit le formulaire avec le profil tel que l'API le connaît. */
  const fill = (p: EditableProfile) => {
    setProfile(p);
    setDisplayName(p.displayName);
    setUsername(p.username);
    setBio(p.bio);
  };

  useEffect(() => {
    loadEditableProfile().then((res) => {
      if (!res.ok && res.code === 'AUTH') return expired();
      if (res.ok) fill(res.data);
      else setProfile('error');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- chargement unique à l'arrivée
  }, []);

  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(null), 2600);
    return () => clearTimeout(id);
  }, [toast]);

  // Libère l'aperçu local quand il est remplacé ou que la page se ferme.
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview]);

  if (profile === 'error') {
    return (
      <div className="grid min-h-svh place-items-center bg-canvas px-6 text-center text-white/60">
        Impossible de charger ton profil. Réessaie plus tard.
      </div>
    );
  }

  const p = profile;
  // Seuls les champs modifiés partent à l'API (elle modère chaque texte reçu).
  const changes = p
    ? {
        ...(displayName.trim() !== p.displayName ? { displayName: displayName.trim() } : {}),
        ...(username.trim() !== p.username ? { username: username.trim() } : {}),
        ...(bio.trim() !== p.bio ? { bio: bio.trim() } : {}),
      }
    : {};
  const hasPassword = p?.providers.includes('password') ?? false;
  const wantsPassword = hasPassword && (currentPassword !== '' || newPassword !== '');
  const dirty = Object.keys(changes).length > 0 || wantsPassword;
  const uploading = upload !== null;

  const onPickAvatar = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // pour pouvoir rechoisir le même fichier après une erreur
    if (!file || !p) return;
    setError(null);
    if (!AVATAR_TYPES.includes(file.type)) return setError('Format accepté : JPEG, PNG ou WebP.');
    if (file.size > AVATAR_MAX_BYTES) return setError('Image trop lourde (2 Mo maximum).');

    setPreview(URL.createObjectURL(file));
    setUpload(0);
    try {
      // 1. Adresse d'envoi signée ; 2. envoi direct vers le stockage ; 3. vérification et adoption.
      const prepared = await prepareAvatar({ mimeType: file.type, sizeBytes: file.size });
      if (!prepared.ok) throw prepared;
      try {
        await uploadFile(prepared.data.uploadUrl, file, prepared.data.headers, setUpload);
      } catch {
        throw new Error('Envoi interrompu. Vérifie ta connexion et réessaie.');
      }
      const confirmed = await confirmAvatar(prepared.data.key);
      if (!confirmed.ok) throw confirmed;
      // On garde le formulaire en cours : seule la photo change.
      setProfile((cur) => (cur && cur !== 'error' ? { ...cur, avatarUrl: confirmed.data.avatarUrl } : cur));
      notifySessionChange();
      setToast('Photo mise à jour.');
    } catch (err) {
      if (err && typeof err === 'object' && 'code' in err && err.code === 'AUTH') return expired();
      setError(err instanceof Error ? err.message : (err as { message?: string }).message ?? 'Une erreur est survenue, réessaie.');
    } finally {
      setPreview(null);
      setUpload(null);
    }
  };

  const onToggle = async (key: keyof AlertSettings) => {
    if (!p || alertBusy) return;
    const next = !p.notifications[key];
    // Optimiste : l'interrupteur bascule tout de suite, et revient en arrière si l'API refuse.
    const set = (v: boolean) =>
      setProfile((cur) => (cur && cur !== 'error' ? { ...cur, notifications: { ...cur.notifications, [key]: v } } : cur));
    set(next);
    setAlertBusy(key);
    const res = await updateSettings({ [key]: next });
    setAlertBusy(null);
    if (res.ok) return;
    if (res.code === 'AUTH') return expired();
    set(!next);
    setToast(res.message);
  };

  const onSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!p || !dirty || saving) return;
    setError(null);
    if ('displayName' in changes && (!changes.displayName || changes.displayName.length > DISPLAY_NAME_MAX)) {
      return setError(`Nom affiché : 1 à ${DISPLAY_NAME_MAX} caractères.`);
    }
    if ('username' in changes && !USERNAME_RE.test(changes.username ?? '')) return setError(USERNAME_HINT);
    if (wantsPassword) {
      if (!currentPassword) return setError('Indique ton mot de passe actuel.');
      if (!PASSWORD_RE.test(newPassword)) return setError(PASSWORD_HINT);
    }

    setSaving(true);
    const done: string[] = [];
    try {
      if (Object.keys(changes).length) {
        const res = await updateProfile(changes);
        if (!res.ok) throw res;
        fill(res.data);
        notifySessionChange();
        done.push('Profil enregistré');
      }
      if (wantsPassword) {
        const res = await changePassword({ currentPassword, newPassword });
        if (!res.ok) throw res;
        setCurrentPassword('');
        setNewPassword('');
        done.push('Mot de passe changé');
      }
      setToast(done.length === 2 ? 'Profil et mot de passe enregistrés.' : `${done[0]}.`);
    } catch (err) {
      const res = err as { code?: string; message?: string };
      if (res.code === 'AUTH') return expired();
      // Si le profil est passé mais pas le mot de passe, on le dit aussi.
      setError(`${done.length ? `${done[0]}, mais : ` : ''}${res.message ?? 'Une erreur est survenue, réessaie.'}`);
    } finally {
      setSaving(false);
    }
  };

  const busy = saving || uploading;
  const avatarUrl = preview ?? (p?.avatarUrl || null);

  return (
    <div className="relative min-h-svh overflow-x-clip bg-canvas">
      <div aria-hidden className="pointer-events-none fixed inset-0">
        <span className="soft-blob -right-40 -top-40 size-[560px] opacity-60" />
      </div>

      <form
        onSubmit={onSave}
        className="relative mx-auto flex max-w-lg flex-col gap-8 px-5 pb-64 pt-[max(env(safe-area-inset-top),16px)] md:pb-40">
        <header className="flex items-center gap-3">
          <Link
            href="/profil"
            aria-label="Retour au profil"
            className="glass grid size-11 place-items-center rounded-full text-white">
            <BackIcon size={20} />
          </Link>
          <h1 className="text-[22px] font-bold tracking-[-0.02em]">Modifier le profil</h1>
        </header>

        {!p ? (
          <div aria-label="Chargement" className="flex flex-col items-center gap-4">
            <span className="size-[108px] animate-pulse rounded-full bg-white/[0.06]" />
            {[0, 1, 2].map((i) => (
              <span key={i} className="h-13 w-full animate-pulse rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          <>
            {/* Photo : cliquer l'avatar ouvre le choix de fichier ; l'envoi part tout de suite. */}
            <div className="flex flex-col items-center gap-3">
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                aria-label="Changer la photo"
                className="group relative rounded-full p-1 shadow-[0_0_0_2px_var(--color-accent),0_14px_44px_-10px_var(--color-accent)] disabled:cursor-wait">
                <UserAvatar user={{ username: p.username, avatarUrl }} size={100} />
                {uploading ? (
                  // Progression de l'envoi : anneau bleu qui se remplit.
                  <span
                    aria-hidden
                    className="absolute inset-1 rounded-full"
                    style={{
                      background: `conic-gradient(var(--color-accent) ${upload * 360}deg, rgb(0 0 0 / 0.45) 0deg)`,
                      mask: 'radial-gradient(circle, transparent 0 44px, #000 45px)',
                    }}
                  />
                ) : (
                  <span className="absolute bottom-1 right-1 grid size-9 place-items-center rounded-full bg-accent text-white shadow-[0_0_0_3px_var(--color-canvas)] transition-transform group-hover:scale-105">
                    <CameraIcon size={17} />
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={busy}
                className="text-[14px] font-semibold text-azure disabled:opacity-60">
                {uploading ? `Envoi… ${Math.round(upload * 100)} %` : 'Changer la photo'}
              </button>
              <input
                ref={fileRef}
                type="file"
                accept={AVATAR_TYPES.join(',')}
                onChange={onPickAvatar}
                className="hidden"
              />
              <p className="text-[12px] text-white/40">JPEG, PNG ou WebP · 2 Mo maximum</p>
            </div>

            <Section title="Profil">
              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-white/70">Nom affiché</span>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={DISPLAY_NAME_MAX}
                  disabled={saving}
                  autoComplete="name"
                  className={field}
                />
              </label>

              <label className="flex flex-col gap-2">
                <span className="text-[13px] font-semibold text-white/70">Pseudo</span>
                <span className="relative">
                  <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[16px] text-white/40">
                    @
                  </span>
                  <input
                    value={username}
                    onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                    maxLength={30}
                    disabled={saving}
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    autoComplete="username"
                    className={`${field} pl-9`}
                  />
                </span>
                <span className="px-1 text-[12px] text-white/40">Lettres, chiffres, points ou tirets bas.</span>
              </label>

              <label className="flex flex-col gap-2">
                <span className="flex items-baseline justify-between text-[13px] font-semibold text-white/70">
                  Bio
                  <span className={`tabular-nums font-medium ${bio.length >= BIO_MAX ? 'text-azure' : 'text-white/40'}`}>
                    {bio.length}/{BIO_MAX}
                  </span>
                </span>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={BIO_MAX}
                  rows={3}
                  disabled={saving}
                  placeholder="Quelques mots sur toi"
                  className={`${field} h-auto resize-none py-3.5 leading-snug`}
                />
              </label>
            </Section>

            {/* Alertes : enregistrées dès qu'on bascule un interrupteur. */}
            <Section title="Alertes">
              <div className="glass-solid flex flex-col rounded-[28px] p-1.5">
                {ALERTS.map(({ key, title, text, Icon }) => {
                  const on = p.notifications[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      role="switch"
                      aria-checked={on}
                      disabled={alertBusy !== null}
                      onClick={() => onToggle(key)}
                      className="flex items-center gap-4 rounded-[22px] p-3.5 text-left transition-colors hover:bg-white/[0.04] disabled:cursor-wait">
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent/15 text-accent">
                        <Icon size={18} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold text-white">{title}</span>
                        <span className="mt-0.5 block text-[13px] text-white/55">{text}</span>
                      </span>
                      <Switch on={on} />
                    </button>
                  );
                })}
              </div>
            </Section>

            {/* Mot de passe : comptes email seulement (Google / Apple n'en ont pas). */}
            {hasPassword && (
              <Section title="Mot de passe">
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  maxLength={128}
                  disabled={saving}
                  autoComplete="current-password"
                  placeholder="Mot de passe actuel"
                  aria-label="Mot de passe actuel"
                  className={field}
                />
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={128}
                  disabled={saving}
                  autoComplete="new-password"
                  placeholder="Nouveau mot de passe"
                  aria-label="Nouveau mot de passe"
                  className={field}
                />
                <p className="px-1 text-[12px] text-white/40">
                  8 caractères minimum, avec une lettre et un chiffre. Tes autres appareils seront déconnectés.
                </p>
              </Section>
            )}

            {error && (
              <p role="alert" className="rounded-2xl bg-[#FF4D6D]/10 px-4 py-3 text-[14px] font-medium text-[#FF8FA3]">
                {error}
              </p>
            )}
          </>
        )}

        {/* Bouton fixé en bas, au-dessus de la barre d'onglets sur mobile. */}
        <div className="fixed inset-x-0 bottom-[calc(max(env(safe-area-inset-bottom),12px)_+_88px)] z-30 bg-[linear-gradient(transparent,var(--color-canvas)_45%)] px-5 pb-3 pt-6 md:bottom-0 md:pb-[max(env(safe-area-inset-bottom),20px)]">
          <button
            type="submit"
            disabled={!p || !dirty || busy}
            className="mx-auto block h-14 w-full max-w-lg rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)] transition-[filter,opacity] hover:brightness-110 disabled:opacity-40 disabled:hover:brightness-100">
            {saving ? 'Enregistrement…' : 'Enregistrer'}
          </button>
        </div>
      </form>

      {toast && (
        <p
          role="status"
          className="rise glass fixed left-1/2 top-6 z-50 max-w-[90vw] -translate-x-1/2 rounded-full px-5 py-2.5 text-center text-[14px] font-semibold text-white">
          {toast}
        </p>
      )}
    </div>
  );
}
