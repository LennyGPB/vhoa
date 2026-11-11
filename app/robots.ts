import type { MetadataRoute } from 'next';

import { SITE } from '@/lib/site';

export default function robots(): MetadataRoute.Robots {
  return {
    // L'admin n'a rien à faire dans les moteurs de recherche.
    rules: { userAgent: '*', allow: '/', disallow: '/admin' },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
