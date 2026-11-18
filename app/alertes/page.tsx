import type { Metadata } from 'next';

import { AlertsScreen } from '@/components/AlertsScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Alertes',
  robots: { index: false },
};

/** Réservée aux membres (proxy.ts). */
export default function AlertesPage() {
  return (
    <>
      <AlertsScreen />
      <TabBar />
    </>
  );
}
