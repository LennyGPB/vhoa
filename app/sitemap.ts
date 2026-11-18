import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

/** Date de dernière modification du contenu : à mettre à jour quand les pages changent. */
const UPDATED = new Date('2026-11-11');

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: SITE.url, lastModified: UPDATED, changeFrequency: 'weekly', priority: 1 },
    { url: `${SITE.url}/feed`, lastModified: UPDATED, changeFrequency: 'daily', priority: 0.8 },
    { url: `${SITE.url}/defis`, lastModified: UPDATED, changeFrequency: 'daily', priority: 0.7 },
    { url: `${SITE.url}/premium`, lastModified: UPDATED, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${SITE.url}/mentions-legales`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/confidentialite`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/cgu`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
    { url: `${SITE.url}/cgv`, lastModified: UPDATED, changeFrequency: 'yearly', priority: 0.2 },
  ];
}
