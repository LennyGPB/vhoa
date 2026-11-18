import type { Metadata } from 'next';

import { PremiumThanks } from '@/components/premium/PremiumThanks';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Bienvenue dans Premium',
  robots: { index: false },
};

/** Retour de Stripe après le paiement (réservée aux membres, proxy.ts). */
export default function PremiumMerciPage() {
  return (
    <>
      <PremiumThanks />
      <TabBar />
    </>
  );
}
