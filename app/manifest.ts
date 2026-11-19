import type { MetadataRoute } from 'next';

/**
 * Manifeste web : VHOA s'installe comme une app (écran d'accueil, plein écran).
 * L'app installée s'ouvre directement sur le feed, pas sur la page de présentation.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'VHOA : Prends la parole',
    short_name: 'VHOA',
    description: 'L’app d’éloquence pour progresser à l’oral.',
    lang: 'fr',
    start_url: '/feed?source=app',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0a0a0b',
    theme_color: '#0a0a0b',
    categories: ['education', 'social'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Fond bleu plein : Android peut la découper en rond ou en goutte sans bord noir.
      { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
