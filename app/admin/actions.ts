'use server';

import { headers } from 'next/headers';
import { refresh } from 'next/cache';
import { redirect } from 'next/navigation';

import { requireAdmin, signIn, signOut } from '@/lib/admin-auth';
import { deleteEntry } from '@/lib/admin-data';
import { clientIp } from '@/lib/waitlist';

export type LoginState = { error: string | null };

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const password = formData.get('password');
  if (typeof password !== 'string' || !password) return { error: 'Entre le mot de passe.' };

  const result = await signIn(password, clientIp(await headers()));
  if (result === 'locked') return { error: 'Trop de tentatives. Réessaie dans 15 minutes.' };
  if (result === 'invalid') return { error: 'Mot de passe incorrect.' };
  redirect('/admin');
}

export async function logoutAction() {
  await signOut();
  redirect('/admin/login');
}

export async function deleteEntryAction(id: string) {
  // Chaque action revérifie la session : ne jamais se fier à l'interface.
  await requireAdmin();
  await deleteEntry(id);
  refresh();
}
