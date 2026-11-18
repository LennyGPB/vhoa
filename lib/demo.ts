/**
 * Données fictives du hero, en attendant de brancher l'API (thème en cours + meilleures prises).
 * Même forme que ce que renverra l'API : il suffira de remplacer ces constantes par un appel.
 */

export interface DemoTake {
  id: string;
  author: string;
  username: string;
  /** Couleur de l'avatar (dégradé bleu de la palette). */
  color: string;
  category: string;
  /** Durée en secondes. */
  duration: number;
  convinced: number;
  /** Extrait de la transcription, affiché sur la vignette. */
  excerpt: string;
}

export const DEMO_THEME = {
  subject: 'Les réseaux sociaux nous rendent-ils plus seuls ?',
  participants: 128,
};

export const DEMO_TAKES: DemoTake[] = [
  {
    id: '1',
    author: 'Inès B.',
    username: 'ines.parle',
    color: '#7CC4FA',
    category: 'Débat',
    duration: 58,
    convinced: 342,
    excerpt: 'On n’a jamais été aussi connectés… ni aussi seuls dans une pièce pleine.',
  },
  {
    id: '2',
    author: 'Yanis K.',
    username: 'yanisk',
    color: '#4AA8FF',
    category: 'Discours',
    duration: 60,
    convinced: 287,
    excerpt: 'Le problème, ce n’est pas l’écran. C’est ce qu’on arrête de se dire en face.',
  },
  {
    id: '3',
    author: 'Camille D.',
    username: 'cam.d',
    color: '#2F8FE8',
    category: 'Storytelling',
    duration: 47,
    convinced: 251,
    excerpt: 'Ma grand-mère a 82 ans. C’est sur Instagram qu’elle a retrouvé sa sœur.',
  },
];
