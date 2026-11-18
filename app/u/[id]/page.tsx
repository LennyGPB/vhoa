import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PublicProfileScreen } from '@/components/PublicProfileScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Profil',
  description: 'Les prises de parole de cet orateur sur VHOA.',
};

/** L'identifiant n'est connu qu'à la requête : Suspense obligatoire (cacheComponents). */
export default function ProfilPublicPage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-canvas" />}>
      <PublicProfileScreen />
      <TabBar />
    </Suspense>
  );
}
