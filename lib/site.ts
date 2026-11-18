/** Liens et textes partagés du site. À compléter avec les vraies URLs. */
export const SITE = {
  name: 'VHOA',
  url: 'https://vhoa.fr',
  tagline: 'Prends la parole. Progresse chaque semaine.',
  discord: 'https://discord.gg/NtfXhr2NEz',
  socials: {
    instagram: 'https://instagram.com/',
    tiktok: 'https://tiktok.com/',
  },
} as const;

/** Page d'inscription : il faut un compte pour prendre la parole. */
export const SIGNUP_HREF = '/inscription';

/** Page Créer (prendre la parole). Un visiteur est d'abord envoyé à l'inscription (voir proxy.ts). */
export const CREATE_HREF = '/creer';
/** Créer, en arrivant par le coach : présentation du coach au lieu du défi, mode « Coach IA » choisi. */
export const COACH_HREF = '/creer?coach=1';

/** Lien qui ouvre la modale de la liste d'attente, depuis n'importe quel bouton. */
export const WAITLIST_HASH = '#liste-attente';
