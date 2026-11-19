import type { Metadata } from 'next';

import { FeedScreen } from '@/components/feed/FeedScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Feed',
  description: 'Écoute les prises de parole de la communauté VHOA et vote pour les plus convaincantes.',
  alternates: { canonical: '/feed' },
};

export default function FeedPage() {
  return (
    <>
      <h1 className="sr-only">Feed des prises de parole</h1>
      <FeedScreen />
      <TabBar />
    </>
  );
}
