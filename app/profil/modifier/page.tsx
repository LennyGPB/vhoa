import type { Metadata } from 'next';

import { EditProfileScreen } from '@/components/EditProfileScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Modifier le profil',
  robots: { index: false },
};

/** Réservée aux membres (proxy.ts). */
export default function ModifierProfilPage() {
  return (
    <>
      <EditProfileScreen />
      <TabBar />
    </>
  );
}
