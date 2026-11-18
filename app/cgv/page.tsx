import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Conditions générales de vente',
  description: 'Les conditions de l’abonnement VHOA Premium : contenu, prix, paiement, renouvellement, résiliation et rétractation.',
  alternates: { canonical: '/cgv' },
};

export default function CgvPage() {
  const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;
  const mediator = LEGAL.mediator;

  return (
    <LegalPage title="Conditions générales de vente" updated={LEGAL.updated}>
      <LegalSection title="Objet">
        <p>
          Ces conditions s’appliquent à l’abonnement <strong>VHOA Premium</strong>, vendu sur le site VHOA par{' '}
          {LEGAL.editor}, {LEGAL.address}, SIRET {LEGAL.siret} (voir les{' '}
          <Link href="/mentions-legales">mentions légales</Link>). Elles complètent les{' '}
          <Link href="/cgu">conditions d’utilisation</Link>. En t’abonnant, tu les acceptes.
        </p>
      </LegalSection>

      <LegalSection title="Ce que comprend Premium">
        <ul>
          <li>
            <strong>Coach IA :</strong> jusqu’à 60 analyses par mois (au lieu d’une), avec un retour détaillé sur ton
            argumentation et ton rythme, et la comparaison avec tes prises précédentes. Le compteur repart à zéro le 1er de
            chaque mois ; les analyses non utilisées ne sont pas reportées.
          </li>
          <li>
            <strong>Progression :</strong> l’historique de tes analyses et tes statistiques.
          </li>
          <li>
            <strong>Gels de série :</strong> un gel offert chaque mois, pour qu’une semaine sans poster ne casse pas ta
            série.
          </li>
          <li>
            <strong>Effets de profil :</strong> un effet au choix autour de ta photo, visible partout sur VHOA.
          </li>
        </ul>
        <p>
          Premium peut s’enrichir de nouvelles fonctions. Une fonction essentielle ne peut pas être retirée en cours de
          période payée sans que tu en sois prévenu et que tu puisses résilier.
        </p>
      </LegalSection>

      <LegalSection title="Prix">
        <ul>
          <li>
            <strong>Mensuel :</strong> 4,99 € par mois.
          </li>
          <li>
            <strong>Annuel :</strong> 35 € par an.
          </li>
          <li>
            <strong>Offre de lancement :</strong> la première année de l’abonnement annuel est à 25 € au lieu de 35 €,
            pour les 100 premiers abonnements annuels. Le nombre de places restantes affiché sur la page Premium est le
            nombre réel. L’année suivante, l’abonnement est renouvelé au prix normal de 35 €.
          </li>
        </ul>
        <p>
          Les prix sont indiqués en euros, toutes taxes comprises. Ils peuvent évoluer : tout changement t’est annoncé
          par email au moins 30 jours avant de s’appliquer, uniquement à partir du renouvellement suivant. Tu peux
          résilier avant si le nouveau prix ne te convient pas.
        </p>
      </LegalSection>

      <LegalSection title="Commande et paiement">
        <ul>
          <li>
            L’abonnement se souscrit depuis la page <Link href="/premium">Premium</Link>, avec un compte VHOA. Si tu as
            moins de 18 ans, tu dois avoir l’accord de tes parents ou de ton tuteur avant de payer.
          </li>
          <li>
            Le paiement se fait par carte bancaire, sur la page sécurisée de notre prestataire de paiement Stripe. VHOA
            n’a jamais accès à tes données de carte.
          </li>
          <li>
            Le premier paiement est prélevé à la souscription, puis à chaque échéance (chaque mois ou chaque année, à la
            date anniversaire). Une facture t’est envoyée par email à chaque paiement.
          </li>
          <li>
            Si un paiement échoue, de nouvelles tentatives sont faites pendant quelques jours. Sans régularisation,
            l’abonnement prend fin et ton compte repasse en version gratuite.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Durée et renouvellement">
        <p>
          L’abonnement est sans engagement. Il se renouvelle automatiquement pour la même durée (un mois ou un an),
          jusqu’à ce que tu le résilies. Pour l’abonnement annuel, tu reçois un rappel par email avant chaque
          renouvellement, avec la date et le montant du prélèvement, et la possibilité de ne pas renouveler.
        </p>
      </LegalSection>

      <LegalSection title="Résiliation">
        <ul>
          <li>
            Tu peux résilier à tout moment, en quelques secondes : <strong>Profil</strong>, puis{' '}
            <strong>Paramètres</strong>, <strong>Mon abonnement</strong> et <strong>Résilier mon abonnement</strong>. Tu
            peux aussi nous écrire à {mail}.
          </li>
          <li>
            La résiliation prend effet à la fin de la période déjà payée : tu gardes Premium jusque-là, puis plus aucun
            prélèvement n’a lieu. La période en cours n’est pas remboursée, sauf dans le cas prévu ci-dessous (droit de
            rétractation).
          </li>
          <li>
            Si tu supprimes ton compte, l’abonnement est arrêté immédiatement et plus aucun prélèvement n’a lieu.
          </li>
          <li>
            En cas de manquement grave aux <Link href="/cgu">conditions d’utilisation</Link> entraînant la suppression
            de ton compte, l’abonnement prend fin sans remboursement de la période en cours.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Droit de rétractation">
        <p>
          En tant que consommateur, tu disposes en principe d’un délai de 14 jours après la souscription pour te
          rétracter. Au moment de payer, tu demandes à profiter de Premium tout de suite et tu reconnais renoncer à ce
          droit (article L221-28 du Code de la consommation).
        </p>
        <p>
          Malgré cela, si tu changes d’avis dans les 14 jours suivant ta première souscription, écris-nous à {mail} :
          nous te remboursons la part de l’abonnement correspondant à la période restante, sous 14 jours, avec le même
          moyen de paiement.
        </p>
      </LegalSection>

      <LegalSection title="Garanties">
        <p>
          Premium bénéficie de la garantie légale de conformité des contenus et services numériques (articles L224-25-1
          et suivants du Code de la consommation). Si une fonction Premium ne fonctionne pas comme prévu, écris-nous à{' '}
          {mail} : nous la rétablissons dans les meilleurs délais ou, à défaut, nous réduisons le prix ou te
          remboursons.
        </p>
        <p>
          Les retours du coach IA sont produits automatiquement et donnés à titre indicatif (voir les{' '}
          <Link href="/cgu">conditions d’utilisation</Link>).
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Les données liées à ton abonnement (identifiants Stripe, factures) sont traitées comme décrit dans la{' '}
          <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Service client et médiation">
        <p>
          Pour toute question ou réclamation, écris à {mail} : nous te répondons dans les meilleurs délais. Si aucune
          solution n’est trouvée, tu peux recourir gratuitement au médiateur de la consommation
          {mediator ? (
            <>
              {' '}
              : <strong>{mediator.name}</strong>, {mediator.address} (
              <a href={mediator.url} target="_blank" rel="noreferrer">
                {mediator.url.replace(/^https?:\/\//, '')}
              </a>
              ), dans un délai d’un an après ta réclamation écrite auprès de nous.
            </>
          ) : (
            <>, dont les coordonnées sont indiquées ici avant l’ouverture des ventes.</>
          )}
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, tu peux saisir le tribunal de ton lieu de
          domicile ou celui du nôtre.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
