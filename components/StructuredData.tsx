import { FAQ } from '@/lib/faq';
import { LEGAL } from '@/lib/legal';
import { SITE } from '@/lib/site';

/**
 * Données structurées (schema.org, JSON-LD) : décrivent à Google et aux moteurs IA
 * qui édite le site, ce qu'est l'app et les questions fréquentes.
 */
export function StructuredData() {
  const org = `${SITE.url}/#organisation`;
  const graph = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': org,
        name: 'VHOA',
        url: SITE.url,
        logo: `${SITE.url}/icon.png`,
        email: LEGAL.email,
        founder: { '@type': 'Person', name: LEGAL.publisher },
        // Comptes officiels de la marque (à compléter avec Instagram et TikTok).
        sameAs: [SITE.discord],
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE.url}/#site`,
        name: 'VHOA',
        url: SITE.url,
        inLanguage: 'fr-FR',
        publisher: { '@id': org },
      },
      {
        '@type': 'MobileApplication',
        name: 'VHOA',
        description:
          'L’app d’éloquence pour progresser à l’oral : un thème par semaine, une minute pour convaincre, le vote de la communauté et un coach IA.',
        operatingSystem: 'iOS, Android',
        applicationCategory: 'EducationalApplication',
        inLanguage: 'fr-FR',
        publisher: { '@id': org },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'EUR', availability: 'https://schema.org/PreOrder' },
      },
      {
        '@type': 'FAQPage',
        mainEntity: FAQ.map((item) => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      // « < » échappé : empêche toute injection de balise dans le script.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(graph).replace(/</g, '\\u003c') }}
    />
  );
}
