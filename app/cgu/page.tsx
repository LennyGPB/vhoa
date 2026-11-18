import type { Metadata } from 'next';
import Link from 'next/link';

import { LegalPage, LegalSection } from '@/components/LegalPage';
import { LEGAL } from '@/lib/legal';

export const metadata: Metadata = {
  title: 'Conditions d’utilisation',
  description: 'Les règles de VHOA : ton compte, tes prises de parole, la communauté, les défis et le coach IA.',
  alternates: { canonical: '/cgu' },
};

export default function CguPage() {
  const mail = <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a>;

  return (
    <LegalPage title="Conditions d’utilisation" updated={LEGAL.updated}>
      <LegalSection title="Objet">
        <p>
          VHOA est un service pour progresser à l’oral : tu publies des prises de parole d’une minute au plus, la
          communauté les écoute et vote, et un coach IA te fait des retours. Ces conditions définissent les règles
          d’utilisation du service, édité par {LEGAL.editor} (voir les{' '}
          <Link href="/mentions-legales">mentions légales</Link>). En créant un compte, tu les acceptes.
        </p>
      </LegalSection>

      <LegalSection title="Accès et compte">
        <ul>
          <li>VHOA est réservé aux personnes de 15 ans ou plus.</li>
          <li>
            Un compte par personne. Tes informations doivent être exactes, et ton pseudo ne doit pas usurper
            l’identité de quelqu’un d’autre, ni de l’équipe VHOA.
          </li>
          <li>
            Tu es responsable de ce qui se passe sur ton compte : garde ton mot de passe pour toi et préviens-nous si
            tu penses qu’il a été utilisé par quelqu’un d’autre.
          </li>
          <li>
            Le service est gratuit. L’abonnement facultatif Premium (coach IA étendu, gels de série, effets de profil)
            est régi par les <Link href="/cgv">conditions générales de vente</Link>.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Tes prises de parole">
        <ul>
          <li>
            Tu restes propriétaire de tes prises de parole. En les publiant, tu autorises VHOA à les héberger, les
            afficher, les transcrire et les diffuser sur le service (feed, profil, défis, liens de partage), dans le
            monde entier et gratuitement, aussi longtemps qu’elles sont en ligne.
          </li>
          <li>
            Tu garantis avoir le droit de publier ce que tu publies : pas de contenu dont tu n’es pas l’auteur sans
            autorisation, et l’accord des personnes qui apparaissent ou s’expriment dans ta prise.
          </li>
          <li>Tu peux supprimer une prise ou ton compte à tout moment : les contenus concernés sont alors retirés.</li>
          <li>
            Chaque prise est vérifiée automatiquement avant d’être publiée. Une prise refusée peut faire l’objet d’une
            contestation.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Utilisation de tes prises pour faire connaître VHOA">
        <p>
          Les prises publiées font vivre VHOA, et elles sont la meilleure façon de le faire connaître. En publiant une
          prise en public, tu autorises donc aussi VHOA à la réutiliser pour sa promotion, dans les conditions
          suivantes :
        </p>
        <ul>
          <li>
            <strong>Ce qui peut être réutilisé :</strong> ta prise de parole (vidéo ou audio, ton image et ta voix), en
            entier ou en extrait, ainsi que ses sous-titres, ton pseudo et ta photo de profil.
          </li>
          <li>
            <strong>Où :</strong> sur les comptes officiels de VHOA sur les réseaux sociaux (par exemple TikTok,
            Instagram, YouTube, X, LinkedIn), sur le site et l’app VHOA, dans la presse, et dans les publicités et
            supports de présentation de VHOA.
          </li>
          <li>
            <strong>Comment :</strong> la prise peut être coupée, recadrée, sous-titrée ou mise en page, sans jamais en
            déformer le sens ni porter atteinte à ta réputation. Ton pseudo est cité chaque fois que c’est possible.
          </li>
          <li>
            <strong>Pour combien de temps :</strong> autorisation gratuite et non exclusive, valable dans le monde
            entier pendant 5 ans à compter de la publication de la prise. Tu ne perçois aucune rémunération.
          </li>
          <li>
            <strong>Tu peux t’y opposer à tout moment</strong>, pour une prise ou pour toutes, en écrivant à {mail} :
            plus aucune nouvelle utilisation ne sera faite. Les contenus déjà diffusés le resteront, sauf demande de
            retrait de ta part, que nous traiterons dans les meilleurs délais.
          </li>
          <li>Les brouillons et les prises envoyées seulement au coach IA ne sont jamais réutilisés.</li>
        </ul>
      </LegalSection>

      <LegalSection title="Les règles de la communauté">
        <p>Sur VHOA, on peut défendre des idées fortes, mais toujours avec respect. Sont interdits :</p>
        <ul>
          <li>le harcèlement, les menaces, l’intimidation et les attaques personnelles ;</li>
          <li>les propos haineux ou discriminatoires (origine, religion, genre, orientation, handicap…) ;</li>
          <li>l’apologie de la violence ou du terrorisme, et l’incitation à se faire du mal ;</li>
          <li>la nudité et les contenus sexuels ;</li>
          <li>les fausses informations dangereuses, les arnaques et le spam ;</li>
          <li>la publication d’informations personnelles sur autrui ;</li>
          <li>tout contenu illégal ou portant atteinte aux droits d’autrui (droit d’auteur, droit à l’image…).</li>
        </ul>
      </LegalSection>

      <LegalSection title="Signalement et modération">
        <ul>
          <li>
            Tu peux signaler une prise, un commentaire ou un profil, et bloquer un utilisateur. Chaque signalement est
            examiné.
          </li>
          <li>
            En cas de manquement à ces conditions, nous pouvons retirer un contenu, et suspendre ou supprimer un
            compte, selon la gravité. Tu peux contester une décision en écrivant à {mail}.
          </li>
          <li>
            Pour signaler un contenu manifestement illicite, tu peux aussi écrire à {mail} : nous le traitons dans les
            meilleurs délais.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Défis et vote « Convaincu »">
        <ul>
          <li>
            Chaque semaine et chaque mois, un défi propose un sujet. Y participer est facultatif : tu peux aussi parler
            de ce que tu veux.
          </li>
          <li>
            Pendant le défi, chacun peut voter « Convaincu » pour les prises qui l’ont convaincu (pas pour les
            siennes). À la fin, les prises les plus votées forment le podium.
          </li>
          <li>
            Les votes doivent être sincères : faux comptes, échanges de votes ou votes automatisés peuvent entraîner
            le retrait du classement et la suspension du compte. Les défis ne donnent lieu à aucun gain financier.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Le coach IA">
        <p>
          Les retours du coach IA (débit, mots parasites, silences, conseils) sont produits automatiquement. Ils sont
          donnés à titre indicatif pour t’aider à progresser, et peuvent comporter des erreurs. Ils ne remplacent pas
          un accompagnement professionnel.
        </p>
      </LegalSection>

      <LegalSection title="Disponibilité et responsabilité">
        <ul>
          <li>
            Nous faisons de notre mieux pour que VHOA fonctionne sans interruption, mais le service peut être
            momentanément indisponible (maintenance, panne).
          </li>
          <li>
            Les prises de parole et commentaires sont publiés sous la responsabilité de leurs auteurs. En tant
            qu’hébergeur, VHOA retire promptement les contenus illicites qui lui sont signalés.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="Propriété intellectuelle">
        <p>
          Le nom VHOA, le logo, le design du site et ses contenus (hors prises de parole des utilisateurs) sont
          protégés. Ils ne peuvent pas être réutilisés sans autorisation.
        </p>
      </LegalSection>

      <LegalSection title="Données personnelles">
        <p>
          Le traitement de tes données est décrit dans la <Link href="/confidentialite">politique de confidentialité</Link>.
        </p>
      </LegalSection>

      <LegalSection title="Fin d’utilisation">
        <p>
          Tu peux arrêter d’utiliser VHOA et supprimer ton compte à tout moment depuis ton profil (Paramètres, puis
          « Supprimer mon compte »). Nous pouvons supprimer un compte en cas de manquement grave à ces conditions.
        </p>
      </LegalSection>

      <LegalSection title="Modifications">
        <p>
          Ces conditions peuvent évoluer avec le service. En cas de changement important, tu en seras informé sur le
          site. La date de dernière mise à jour figure en haut de cette page.
        </p>
      </LegalSection>

      <LegalSection title="Droit applicable">
        <p>
          Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en
          priorité : écris à {mail}. À défaut, les tribunaux français seront compétents.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
