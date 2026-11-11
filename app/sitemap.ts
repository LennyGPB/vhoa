import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

/** Date de dernière modification du contenu : à mettre à jour quand les pages changent. */
const UPDATED = new Date('2026-11-11');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, lastModified: UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/mentions-legales`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/confidentialite`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
