import type { Metadata } from 'next';

import { DefisScreen } from '@/components/DefisScreen';
import { TabBar } from '@/components/TabBar';

export const metadata: Metadata = {
  title: 'Défis',
  description: 'Le défi d’éloquence de la semaine, le classement en direct et les derniers podiums.',
  alternates: { canonical: '/defis' },
};

export default function DefisPage() {
  return (
    <>
      <DefisScreen />
      <TabBar />
    </>
  );
}
