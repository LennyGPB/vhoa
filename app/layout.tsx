import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'VHOA : Prends la parole',
  description:
    'Un thème par semaine, une minute pour convaincre. Rejoins la liste d’attente de VHOA et la communauté sur Discord.',
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
