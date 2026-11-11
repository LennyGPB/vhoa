import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';

import { SITE } from '@/lib/site';

import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

const DESCRIPTION =
  'VHOA, l’app d’éloquence pour progresser à l’oral : un thème par semaine, une minute pour convaincre, le vote de la communauté et un coach IA. Bientôt sur iOS et Android.';

export const metadata: Metadata = {
  // Base des URL absolues (aperçus de liens, plan du site, adresses canoniques).
  metadataBase: new URL(SITE.url),
  title: {
    default: 'VHOA : Prends la parole, l’app d’éloquence',
    // Les autres pages donnent juste leur nom : « VHOA : Mentions légales ».
    template: 'VHOA : %s',
  },
  description: DESCRIPTION,
  applicationName: 'VHOA',
  authors: [{ name: 'Lenny GOMES' }],
  creator: 'Lenny GOMES',
  publisher: 'VHOA',
  category: 'education',
  keywords: [
    'éloquence',
    'prise de parole',
    'parler en public',
    'art oratoire',
    'progresser à l’oral',
    'aisance à l’oral',
    'débat',
    'coach IA',
    'application éloquence',
    'VHOA',
  ],
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: 'VHOA',
    title: 'VHOA : Prends la parole, l’app d’éloquence',
    description: DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: 'VHOA : Prends la parole, l’app d’éloquence',
    description: DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1, 'max-video-preview': -1 },
  },
  // Évite que Safari iOS transforme des numéros (SIRET…) en liens d'appel.
  formatDetection: { telephone: false, email: false, address: false },
};

export const viewport: Viewport = {
  themeColor: '#0a0a0b',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="fr" className={`${inter.variable} antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
