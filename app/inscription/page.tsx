import type { Metadata } from 'next';

import { AuthForm } from '@/components/AuthForm';
import { AuthPage } from '@/components/AuthPage';

export const metadata: Metadata = {
  title: 'Créer un compte',
  description: 'Crée ton compte VHOA pour prendre la parole sur le thème de la semaine.',
  alternates: { canonical: '/inscription' },
};

export default function InscriptionPage() {
  return (
    <AuthPage title="Prends la parole" subtitle="Crée ton compte pour participer au thème de la semaine.">
      <AuthForm mode="signup" googleClientId={process.env.GOOGLE_CLIENT_ID} />
    </AuthPage>
  );
}
