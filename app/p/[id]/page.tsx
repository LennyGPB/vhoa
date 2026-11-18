import type { Metadata } from 'next';
import { Suspense } from 'react';

import { PostPage } from '@/components/PostPage';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Prise de parole',
  description: 'Écoute cette prise de parole sur VHOA et dis si elle t’a convaincu.',
};

/** L'identifiant n'est connu qu'à la requête : Suspense obligatoire (cacheComponents). */
export default function PrisePage() {
  return (
    <>
      <h1 className="sr-only">Prise de parole</h1>
      <Suspense fallback={<div className="h-svh bg-canvas" />}>
        <PostPage />
        <TabBar />
      </Suspense>
    </>
  );
}
