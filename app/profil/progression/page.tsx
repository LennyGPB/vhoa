import type { Metadata } from 'next';

import { ProgressScreen } from '@/components/ProgressScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Ma progression',
  robots: { index: false },
};

/** Réservée aux membres (proxy.ts) ; courbes et historique réservés à Premium (API). */
export default function ProgressionPage() {
  return (
    <>
      <ProgressScreen />
      <TabBar />
    </>
  );
}
