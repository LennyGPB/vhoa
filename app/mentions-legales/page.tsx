import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'VHOA : Mentions légales',
};

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated={LEGAL.updated}>
      <LegalSection title="Éditeur du site">
        <p>
          {LEGAL.editor}, entrepreneur individuel (micro-entreprise)
          <br />
          {LEGAL.address}
          <br />
          SIRET : {LEGAL.siret}
          <br />
          TVA non applicable, article 293 B du Code général des impôts.
          <br />
          Contact : <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>
        </p>
      </LegalSection>

      <LegalSection title="Directeur de la publication">
        <p>{LEGAL.publisher}</p>
      </LegalSection>

      <LegalSection title="Hébergement">
        <p>
          Le site est hébergé par <strong>Vercel Inc.</strong>, 440 N Barranca Ave #4133, Covina, CA 91723,
          États-Unis (
          <a href="https://vercel.com" target="_blank" rel="noreferrer">
            vercel.com
          </a>
          ).
        </p>
        <p>
          Les inscriptions à la liste d’attente sont stockées par <strong>Neon</strong> (
          <a href="https://neon.com" target="_blank" rel="noreferrer">
            neon.com
          </a>
          ), sur des serveurs situés dans l’Union européenne (Francfort, Allemagne).
        </p>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Le nom VHOA, le logo, les textes, les visuels et l’ensemble des éléments du site sont la propriété de
          l’éditeur. Toute reproduction ou réutilisation, totale ou partielle, sans autorisation écrite préalable est
          interdite.
        </p>
      </LegalSection>

      <LegalSection title="Liens externes">
        <p>
          Le site contient des liens vers des services tiers (Discord, Instagram, TikTok). L’éditeur n’est pas
          responsable de leur contenu ni de la manière dont ils traitent tes données : leurs propres conditions
          s’appliquent.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Pour savoir quelles données sont collectées et comment exercer tes droits, consulte la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Les présentes mentions sont soumises au droit français. Pour toute question, écris à{' '}
          <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
