'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { loadPost } from '@/app/actions/public';
import type { FeedPost } from '@/lib/feed';

import { FeedScreen } from './feed/FeedScreen';

/** Page d'une prise (lien partagé) : la prise en plein écran, comme dans le feed. */
export function PostPage() {
  const { id } = useParams<{ id: string }>();
  const [post, setPost] = useState<FeedPost | null | 'missing' | 'error'>(null);

  useEffect(() => {
    loadPost(id).then((res) => {
      if (res.ok) setPost(res.data ?? 'missing');
      else setPost(res.code === 'NOT_FOUND' || res.code === 'INVALID' ? 'missing' : 'error');
    });
  }, [id]);

  if (post === null) {
    return (
      <div className="grid h-svh place-items-center bg-canvas">
        <span aria-label="Chargement" className="size-10 animate-spin rounded-full border-[3px] border-white/15 border-t-accent" />
      </div>
    );
  }

  if (post === 'missing' || post === 'error') {
    return (
      <div className="flex h-svh items-center justify-center bg-canvas px-6">
        <div className="glass-frame w-full max-w-sm rounded-[32px] px-7 py-10 text-center">
          <h1 className="text-[24px] font-bold tracking-[-0.02em]">
            {post === 'missing' ? 'Cette prise n’est plus disponible' : 'Impossible de charger la prise'}
          </h1>
          <p className="mt-2 text-[15px] text-white/60">
            {post === 'missing' ? 'Elle a été supprimée ou retirée.' : 'Réessaie dans un instant.'}
          </p>
          <Link
            href="/feed"
            className="mt-7 inline-flex h-14 w-full items-center justify-center rounded-full bg-accent text-[16px] font-semibold text-white shadow-[0_18px_50px_-14px_var(--color-accent)]">
            Écouter d’autres prises
          </Link>
        </div>
      </div>
    );
  }

  return <FeedScreen posts={[post]} standalone />;
}
