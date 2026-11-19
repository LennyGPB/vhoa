import 'server-only';

import type { Metadata } from 'next';
import { cache } from 'react';

import { api } from './api';

/**
 * Métadonnées des pages partagées (une prise, un profil), lues côté serveur sans session :
 * titre, description et image d'aperçu propres à chaque page, et canonical vers elle-même.
 * `cache` : un seul appel API par requête, partagé entre generateMetadata et la page.
 */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface PostMeta {
  title: string;
  status?: string;
  thumbnailUrl: string;
  author: { username: string };
  theme?: { subject: string } | null;
}

interface UserMeta {
  username: string;
  displayName: string;
  bio: string;
  avatarUrl: string;
}

/** null : introuvable (supprimée, retirée, identifiant invalide). */
export const fetchPostMeta = cache(async (id: string): Promise<PostMeta | null> => {
  if (!UUID.test(id)) return null;
  const res = await api<PostMeta>(`/posts/${id}`);
  if (!res.ok || res.data.status === 'removed') return null;
  return res.data;
});

export const fetchUserMeta = cache(async (id: string): Promise<UserMeta | null> => {
  if (!UUID.test(id)) return null;
  const res = await api<UserMeta>(`/users/${id}`);
  return res.ok ? res.data : null;
});

const image = (url: string | undefined) => (url && url.startsWith('https://') ? [{ url }] : undefined);

export async function postMetadata(id: string): Promise<Metadata> {
  const post = await fetchPostMeta(id);
  if (!post) return { title: 'Prise introuvable', robots: { index: false } };
  const title = post.title || 'Prise de parole';
  const description = post.theme
    ? `@${post.author.username} relève le défi « ${post.theme.subject} ». Écoute sa prise de parole sur VHOA et dis si elle t’a convaincu.`
    : `Écoute la prise de parole de @${post.author.username} sur VHOA et dis si elle t’a convaincu.`;
  const images = image(post.thumbnailUrl);
  return {
    title: `${title} · @${post.author.username}`,
    description,
    alternates: { canonical: `/p/${id}` },
    openGraph: { type: 'article', title, description, url: `/p/${id}`, ...(images ? { images } : {}) },
    twitter: { card: images ? 'summary_large_image' : 'summary', title, description, ...(images ? { images } : {}) },
  };
}

export async function userMetadata(id: string): Promise<Metadata> {
  const user = await fetchUserMeta(id);
  if (!user) return { title: 'Profil introuvable', robots: { index: false } };
  const title = `${user.displayName || user.username} (@${user.username})`;
  const description = user.bio?.trim() || `Les prises de parole de @${user.username} sur VHOA.`;
  const images = image(user.avatarUrl);
  return {
    title,
    description,
    alternates: { canonical: `/u/${id}` },
    openGraph: { type: 'profile', title, description, url: `/u/${id}`, ...(images ? { images } : {}) },
    twitter: { card: 'summary', title, description },
  };
}
