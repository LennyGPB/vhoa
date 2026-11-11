import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'VHOA : Politique de confidentialité',
};

export default function ConfidentialitePage() {
  const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

  return (
    <LegalPage title="Politique de confidentialité" updated={LEGAL.updated}>
      <LegalSection title="En bref">
        <p>
          On collecte le strict minimum : ton email et ton téléphone (iPhone ou Android), uniquement pour te
          prévenir de la sortie de VHOA. Pas de publicité, pas de revente, pas de traceurs. Une fois l’app sortie, la
          liste est supprimée.
        </p>
      </LegalSection>

      <LegalSection title="Responsable du traitement">
        <p>
          {LEGAL.editor}, {LEGAL.address}. Contact : {mail}.
        </p>
      </LegalSection>

      <LegalSection title="Données collectées">
        <ul>
          <li>
            <strong>Inscription à la liste d’attente :</strong> ton adresse email, le type de téléphone que tu as
            choisi (iPhone ou Android) et la date d’inscription.
          </li>
          <li>
            <strong>Protection contre les abus :</strong> une empreinte chiffrée et irréversible de ton adresse IP.
            Ton adresse IP elle-même n’est jamais enregistrée.
          </li>
          <li>
            <strong>Données techniques :</strong> comme tout hébergeur, Vercel enregistre des journaux techniques
            (adresse IP, navigateur, pages demandées) pour faire fonctionner et sécuriser le site.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Pourquoi, et sur quelle base">
        <ul>
          <li>
            <strong>Te prévenir de la sortie de l’app</strong> : sur la base de ton consentement, donné en
            t’inscrivant (article 6.1.a du RGPD).
          </li>
          <li>
            <strong>Éviter le spam et les inscriptions automatiques</strong> : sur la base de notre intérêt légitime
            à protéger le service (article 6.1.f du RGPD).
          </li>
        </ul>
        <p>Ton email ne sert à rien d’autre : pas de newsletter, pas de prospection, pas de revente.</p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <p>
          Les inscriptions sont conservées jusqu’à la sortie de l’app. Une fois l’email d’annonce envoyé, la liste
          d’attente (emails, plateformes et empreintes d’IP) est supprimée.
        </p>
      </LegalSection>

      <LegalSection title="Qui y a accès">
        <p>
          Seul l’éditeur de VHOA, via un espace d’administration protégé par mot de passe. Les données sont
          hébergées par nos prestataires techniques, qui ne les utilisent que pour nous rendre ce service :
        </p>
        <ul>
          <li>
            <strong>Vercel Inc.</strong> (hébergement du site, États-Unis)
          </li>
          <li>
            <strong>Neon</strong> (base de données, serveurs situés à Francfort, Allemagne)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Transferts hors de l’Union européenne">
        <p>
          Vercel et Neon sont des sociétés américaines. Les transferts éventuels de données vers les États-Unis sont
          encadrés par le Data Privacy Framework UE–États-Unis (auquel Vercel adhère) ou par les clauses
          contractuelles types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site ne dépose aucun cookie publicitaire ni de mesure d’audience. C’est pourquoi aucun bandeau cookies
          ne t’est présenté. Le seul cookie utilisé sert à la connexion à l’espace d’administration, et ne concerne
          pas les visiteurs.
        </p>
      </LegalSection>

      <LegalSection title="Âge minimum">
        <p>
          L’inscription à la liste d’attente est réservée aux personnes de 15 ans ou plus, comme l’app VHOA.
        </p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Tu peux à tout moment accéder à tes données, les faire rectifier ou supprimer, t’opposer à leur traitement,
          en demander la limitation ou la portabilité, et retirer ton consentement. Pour te désinscrire ou exercer
          ces droits, écris à {mail} : on te répond sous un mois maximum.
        </p>
        <p>
          Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL (
          <a href="https://www.cnil.fr/fr/plaintes" target="_blank" rel="noreferrer">
            cnil.fr
          </a>
          ).
        </p>
      </LegalSection>

      <LegalSection title="Sécurité">
        <p>
          Les échanges avec le site sont chiffrés (HTTPS). L’accès aux inscriptions est protégé par un mot de passe
          fort, et les adresses IP ne sont jamais stockées en clair.
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          Cette politique peut évoluer, notamment à la sortie de l’app. La date de dernière mise à jour figure en
          haut de cette page. Voir aussi les <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
