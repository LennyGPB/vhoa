import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PostPage } from '@/components/PostPage';
import { TabBar } from '@/components/TabBar';
import { fetchPostMeta, postMetadata } from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

/** Titre, description, aperçu et canonical propres à la prise (liens partagés, Google). */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return postMetadata((await params).id);
}

/** Prise supprimée ou retirée : page « introuvable » (non indexée). */
async function Exists({ params }: Props) {
  if (!(await fetchPostMeta((await params).id))) notFound();
  return null;
}

/** L'identifiant n'est connu qu'à la requête : Suspense obligatoire (cacheComponents). */
export default function PrisePage({ params }: Props) {
  return (
    <>
      <h1 className="sr-only">Prise de parole</h1>
      <Suspense fallback={<div className="h-dvh bg-canvas" />}>
        <Exists params={params} />
        <PostPage />
        <TabBar />
      </Suspense>
    </>
  );
}
