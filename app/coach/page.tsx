import type { Metadata } from 'next';

import { ProgressScreen } from '@/components/ProgressScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Coach IA',
  robots: { index: false },
};

/** Onglet Coach IA. Réservé aux membres (proxy.ts) ; courbes et historique réservés à Premium (API). */
export default function CoachPage() {
  return (
    <>
      <ProgressScreen />
      <TabBar />
    </>
  );
}
