import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Suspense } from 'react';

import { PublicProfileScreen } from '@/components/PublicProfileScreen';
import { TabBar } from '@/components/TabBar';
import { fetchUserMeta, userMetadata } from '@/lib/seo';

type Props = { params: Promise<{ id: string }> };

/** Titre (pseudo), bio, photo et canonical propres au profil. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return userMetadata((await params).id);
}

/** Profil inexistant ou banni : page « introuvable » (non indexée). */
async function Exists({ params }: Props) {
  if (!(await fetchUserMeta((await params).id))) notFound();
  return null;
}

/** L'identifiant n'est connu qu'à la requête : Suspense obligatoire (cacheComponents). */
export default function ProfilPublicPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="min-h-svh bg-canvas" />}>
      <Exists params={params} />
      <PublicProfileScreen />
      <TabBar />
    </Suspense>
  );
}
