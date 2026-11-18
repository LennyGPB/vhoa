import type { Metadata } from 'next';

import { CreateFlow } from '@/components/create/CreateFlow';

export const metadata: Metadata = {
  title: 'Prendre la parole',
  robots: { index: false },
};

/** Plein écran, sans barre d'onglets (comme le parcours Créer de l'app). Réservé aux membres (proxy.ts). */
export default function CreerPage() {
  return (
    <main>
      <h1 className="sr-only">Prendre la parole</h1>
      <CreateFlow />
    </main>
  );
}
