import type { Metadata } from 'next';

import { ProfileScreen } from '@/components/ProfileScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Mon profil',
  robots: { index: false },
};

/** Réservée aux membres (proxy.ts). */
export default function ProfilPage() {
  return (
    <>
      <ProfileScreen />
      <TabBar />
    </>
  );
}
