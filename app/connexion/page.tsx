import type { Metadata } from 'next';

import { AuthForm } from '@/components/AuthForm';
import { AuthPage } from '@/components/AuthPage';

export const metadata: Metadata = {
  title: 'Se connecter',
  description: 'Connecte-toi à ton compte VHOA.',
  alternates: { canonical: '/connexion' },
  robots: { index: false },
};

export default function ConnexionPage() {
  return (
    <AuthPage title="Bon retour" subtitle="Connecte-toi pour retrouver tes prises.">
      <AuthForm mode="login" googleClientId={process.env.GOOGLE_CLIENT_ID} />
    </AuthPage>
  );
}
