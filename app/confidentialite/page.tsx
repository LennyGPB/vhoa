import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  description: 'Comment VHOA protège tes données : ce qui est collecté, pourquoi, combien de temps, et tes droits.',
  alternates: { canonical: '/confidentialite' },
};

export default function ConfidentialitePage() {
  const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

  return (
    <LegalPage title="Politique de confidentialité" updated={LEGAL.updated}>
      <LegalSection title="En bref">
        <p>
          On collecte ce qu’il faut pour faire fonctionner VHOA : ton compte, tes prises de parole et ce que tu fais
          sur le site (j’aime, votes, commentaires, abonnements). Pas de publicité, pas de revente, pas de traceurs
          publicitaires. Tu peux supprimer ton compte et toutes tes données à tout moment, depuis ton profil.
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
            <strong>Ton compte :</strong> pseudo, nom affiché, bio et photo si tu en ajoutes, email et mot de passe
            (stocké sous forme chiffrée et irréversible), ou ton identifiant Google si tu te connectes avec Google,
            ainsi que la confirmation que tu as 15 ans ou plus.
          </li>
          <li>
            <strong>Tes prises de parole :</strong> la vidéo ou l’audio que tu publies, leur transcription (texte
            et horodatage des mots), le titre, la catégorie et les hashtags.
          </li>
          <li>
            <strong>Ton activité :</strong> j’aime, votes « Convaincu », commentaires, enregistrements,
            abonnements, blocages, signalements, prises déjà vues, série et badges.
          </li>
          <li>
            <strong>Le coach IA :</strong> les mesures calculées sur tes prises (débit, mots parasites, silences)
            et le retour rédigé.
          </li>
          <li>
            <strong>Sécurité :</strong> les sessions de connexion (navigateur utilisé, dates), et une adresse IP
            utilisée temporairement pour limiter les abus (trop de tentatives de connexion, d’inscription…).
          </li>
          <li>
            <strong>Abonnement Premium :</strong> la formule choisie, les dates et montants des paiements, les
            identifiants de client et d’abonnement Stripe, et ton accord pour un accès immédiat. Les données de carte
            bancaire sont saisies et conservées uniquement par Stripe : nous n’y avons jamais accès.
          </li>
          <li>
            <strong>Liste d’attente :</strong> si tu t’y es inscrit, ton email et le type de téléphone choisi.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Pourquoi, et sur quelle base">
        <ul>
          <li>
            <strong>Fournir le service</strong> (compte, publication, feed, défis, votes, coach IA, alertes) :
            exécution du contrat que tu acceptes avec les <Link href="/cgu">conditions d’utilisation</Link>{' '}
            (article 6.1.b du RGPD).
          </li>
          <li>
            <strong>Modérer et sécuriser</strong> (vérification automatique des contenus, traitement des
            signalements, prévention des abus) : intérêt légitime à protéger la communauté et le service, et
            obligations légales des hébergeurs de contenus (article 6.1.c et f du RGPD).
          </li>
          <li>
            <strong>Abonnement Premium</strong> (paiement, factures) : exécution du contrat prévu par les{' '}
            <Link href="/cgv">conditions générales de vente</Link>, et obligations comptables et fiscales (article 6.1.b
            et c du RGPD).
          </li>
          <li>
            <strong>Liste d’attente</strong> : ton consentement, donné en t’inscrivant (article 6.1.a du RGPD).
          </li>
        </ul>
        <p>Tes données ne servent à aucune publicité ciblée et ne sont jamais vendues.</p>
      </LegalSection>

      <LegalSection title="Ce qui est public">
        <p>
          Ton pseudo, ton nom affiché, ta bio, ta photo, tes prises publiées (avec leurs sous-titres), tes
          commentaires, ta série et tes badges sont visibles par tous, y compris sans compte. Tes brouillons et les
          prises envoyées au coach IA restent privés : toi seul y as accès.
        </p>
      </LegalSection>

      <LegalSection title="Promotion de VHOA">
        <p>
          Comme le prévoient les <Link href="/cgu">conditions d’utilisation</Link>, les prises publiées en public
          (ton image, ta voix, ton pseudo et ta photo de profil) peuvent être reprises, en entier ou en extrait, sur
          les comptes et supports de promotion de VHOA, pendant 5 ans. Tu peux t’y opposer à tout moment en écrivant à{' '}
          {mail} : plus aucune nouvelle utilisation ne sera faite. Les brouillons et les prises envoyées au coach IA ne
          sont jamais utilisés.
        </p>
      </LegalSection>

      <LegalSection title="Durée de conservation">
        <ul>
          <li>Ton compte et tes contenus : tant que ton compte existe.</li>
          <li>
            À la suppression du compte : tout est effacé (compte, prises et leurs fichiers, commentaires, votes,
            abonnements, analyses). Les fichiers sont retirés du stockage dans les heures qui suivent.
          </li>
          <li>Les sessions de connexion : 60 jours au plus après la dernière utilisation.</li>
          <li>
            Les factures et justificatifs de paiement : 10 ans, comme l’exige la loi (article L123-22 du Code de
            commerce), même après la suppression du compte.
          </li>
          <li>La liste d’attente : jusqu’à l’annonce de la sortie de l’app mobile, puis elle est supprimée.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Qui y a accès">
        <p>
          L’éditeur de VHOA, pour faire fonctionner et modérer le service. Les données sont traitées par nos
          prestataires techniques, uniquement pour nous rendre ce service :
        </p>
        <ul>
          <li>
            <strong>Vercel Inc.</strong> (hébergement du site, serveurs en Europe)
          </li>
          <li>
            <strong>Railway Corp.</strong> (hébergement du serveur, serveurs en Europe)
          </li>
          <li>
            <strong>Neon</strong> (base de données, serveurs situés à Francfort, Allemagne)
          </li>
          <li>
            <strong>Cloudflare, Inc.</strong> (stockage des vidéos et des audios)
          </li>
          <li>
            <strong>OpenAI</strong> (transcription des prises, vérification automatique des contenus et retour du
            coach IA ; les données envoyées ne servent pas à entraîner leurs modèles)
          </li>
          <li>
            <strong>Google</strong> (uniquement si tu choisis « Continuer avec Google »)
          </li>
          <li>
            <strong>Stripe Payments Europe Ltd.</strong> (Irlande) (paiement de l’abonnement Premium, factures)
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Transferts hors de l’Union européenne">
        <p>
          Le site, le serveur et la base de données sont hébergés en Europe. Certains prestataires sont toutefois des
          sociétés américaines (Vercel, Railway, Cloudflare, OpenAI, Google, Stripe), qui peuvent accéder aux données ou les
          traiter depuis les États-Unis. Ces transferts sont encadrés par le Data Privacy Framework UE–États-Unis ou par
          les clauses contractuelles types de la Commission européenne.
        </p>
      </LegalSection>

      <LegalSection title="Cookies">
        <p>
          Le site n’utilise aucun cookie publicitaire. Il dépose uniquement les cookies nécessaires à ta connexion
          (ta session, renouvelée automatiquement, et ton pseudo pour l’affichage). Ces cookies sont indispensables
          au service : c’est pourquoi aucun bandeau ne t’est présenté. Ils sont effacés quand tu te déconnectes.
        </p>
      </LegalSection>

      <LegalSection title="Âge minimum">
        <p>VHOA est réservé aux personnes de 15 ans ou plus. Cette condition est confirmée à l’inscription.</p>
      </LegalSection>

      <LegalSection title="Tes droits">
        <p>
          Tu peux à tout moment accéder à tes données, les faire rectifier ou supprimer, t’opposer à leur traitement,
          en demander la limitation ou la portabilité, et retirer ton consentement. Tu peux supprimer ton compte
          toi-même depuis ton profil (Paramètres, puis « Supprimer mon compte »). Pour tout le reste, écris à {mail} :
          on te répond sous un mois maximum.
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
          Les échanges sont chiffrés (HTTPS). Les mots de passe sont stockés sous forme chiffrée et irréversible. Les
          sessions sont gardées dans des cookies inaccessibles aux scripts de la page, et les accès au serveur sont
          limités pour empêcher les abus.
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          Cette politique peut évoluer avec le service. La date de dernière mise à jour figure en haut de cette page.
          Voir aussi les <Link href="/cgu">conditions d’utilisation</Link> et les{' '}
          <Link href="/mentions-legales">mentions légales</Link>.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
