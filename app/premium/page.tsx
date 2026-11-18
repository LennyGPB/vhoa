import type { Metadata } from 'next';

import { PremiumScreen } from '@/components/premium/PremiumScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Premium',
  description:
    'VHOA Premium : 60 analyses du coach IA par mois, ta progression, des gels de série et des effets de profil. 4,99 € par mois ou 35 € par an, sans engagement.',
  alternates: { canonical: '/premium' },
};

export default function PremiumPage() {
  return (
    <>
      <PremiumScreen />
      <TabBar />
    </>
  );
}
