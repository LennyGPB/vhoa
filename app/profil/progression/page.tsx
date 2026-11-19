import { redirect } from 'next/navigation';

/** Ancienne adresse de « Ma progression » : tout est maintenant dans l'onglet Coach IA. */
export default function ProgressionPage() {
  redirect('/coach');
}
