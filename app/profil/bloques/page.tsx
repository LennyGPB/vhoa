import type { Metadata } from 'next';

import { BlockedScreen } from '@/components/BlockedScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Comptes bloqués',
  robots: { index: false },
};

/** Réservée aux membres (proxy.ts). */
export default function BloquesPage() {
  return (
    <>
      <BlockedScreen />
      <TabBar />
    </>
  );
}
