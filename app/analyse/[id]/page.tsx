import type { Metadata } from 'next';
import { Suspense } from 'react';

import { AnalysisScreen } from '@/components/AnalysisScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Ton analyse',
  robots: { index: false },
};

/** Réservée au membre, auteur de la prise (proxy.ts + API). Suspense : identifiant connu à la requête. */
export default function AnalysePage() {
  return (
    <Suspense fallback={<div className="min-h-svh bg-canvas" />}>
      <AnalysisScreen />
      <TabBar />
    </Suspense>
  );
}
