import type { Metadata } from 'next';

import { SubscriptionScreen } from '@/components/premium/SubscriptionScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Mon abonnement',
  robots: { index: false },
};

/** Réservée aux membres (proxy.ts). */
export default function AbonnementPage() {
  return (
    <>
      <SubscriptionScreen />
      <TabBar />
    </>
  );
}
