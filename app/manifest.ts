import type { MetadataRoute } from 'next';

/** Manifeste web : nom et icônes si le site est ajouté à l'écran d'accueil. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'VHOA : Prends la parole',
    short_name: 'VHOA',
    description: 'L’app d’éloquence pour progresser à l’oral.',
    lang: 'fr',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    icons: [
      { src: '/icon.png', sizes: '512x512', type: 'image/png' },
      { src: '/apple-icon.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
