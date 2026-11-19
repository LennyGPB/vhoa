'use client';

import { useEffect, useRef, useState } from 'react';

/** Types minimaux de Google Identity Services (script chargé à la demande). */
interface GoogleId {
  initialize(options: {
    client_id: string;
    callback: (response: { credential?: string }) => void;
    ux_mode?: 'popup' | 'redirect';
    context?: 'signin' | 'signup' | 'use';
    itp_support?: boolean;
  }): void;
  renderButton(
    parent: HTMLElement,
    options: {
      theme?: 'outline' | 'filled_blue' | 'filled_black';
      size?: 'large' | 'medium' | 'small';
      shape?: 'pill' | 'rectangular';
      text?: 'signin_with' | 'signup_with' | 'continue_with';
      width?: number;
      locale?: string;
      logo_alignment?: 'left' | 'center';
    },
  ): void;
}

declare global {
  interface Window {
    google?: { accounts: { id: GoogleId } };
  }
}

const SCRIPT = 'https://accounts.google.com/gsi/client';

/**
 * Google ne propose pas de bouton plus haut que 40 px (taille « large ») : on l'agrandit en zoom
 * pour qu'il fasse 56 px, comme les champs et le bouton principal du formulaire.
 */
const SCALE = 56 / 40;
let loading: Promise<void> | null = null;

function loadScript() {
  if (window.google?.accounts?.id) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const s = document.createElement('script');
    s.src = SCRIPT;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loading = null;
      reject(new Error('Google indisponible'));
    };
    document.head.appendChild(s);
  });
  return loading;
}

/**
 * Bouton officiel « Continuer avec Google » (exigé par les règles de marque de Google).
 * Renvoie le jeton d'identité Google, que le serveur du site transmet à l'API pour vérification.
 */
export function GoogleButton({
  clientId,
  mode,
  onCredential,
}: {
  clientId: string;
  mode: 'signup' | 'login';
  onCredential: (idToken: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const callback = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    callback.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;
    loadScript()
      .then(() => {
        const el = ref.current;
        const id = window.google?.accounts.id;
        if (cancelled || !el || !id) return;
        id.initialize({
          client_id: clientId,
          callback: (res) => res.credential && callback.current(res.credential),
          ux_mode: 'popup',
          context: mode === 'signup' ? 'signup' : 'signin',
          itp_support: true,
        });
        el.innerHTML = '';
        id.renderButton(el, {
          theme: 'filled_black',
          size: 'large',
          shape: 'pill',
          text: mode === 'signup' ? 'signup_with' : 'continue_with',
          // Largeur avant zoom : une fois agrandi, le bouton occupe toute la largeur du formulaire.
          // Google limite la largeur à 400 px.
          width: Math.min(400, Math.round((el.parentElement?.offsetWidth ?? el.offsetWidth) / SCALE)),
          locale: 'fr',
          logo_alignment: 'center',
        });
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [clientId, mode]);

  if (failed) {
    return (
      <p className="text-center text-[13px] text-white/45">
        Connexion Google indisponible pour le moment. Utilise ton email.
      </p>
    );
  }

  // Hauteur réservée (56 px) : la page ne saute pas quand le bouton apparaît.
  return (
    <div className="flex h-14 w-full items-center justify-center">
      <div
        ref={ref}
        className="flex w-max justify-center [color-scheme:light]"
        style={{ transform: `scale(${SCALE})`, transformOrigin: 'center' }}
      />
    </div>
  );
}
