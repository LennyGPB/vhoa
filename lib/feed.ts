/**
 * Feed : types (même forme que le FeedPost de l'app) et données fictives en attendant l'API.
 * Sans fichier média, la lecture est simulée (chrono, sous-titres, onde) sur la durée du post.
 */

export interface TranscriptCue {
  start: number;
  end: number;
  text: string;
}

export interface FeedAuthor {
  id: string;
  username: string;
  /** Couleur de l'avatar tant qu'il n'y a pas de photo. */
  color: string;
  avatarUrl?: string;
  /** Effet Premium autour de la photo. */
  avatarEffect?: string | null;
}

export interface FeedPost {
  id: string;
  type: 'video' | 'audio';
  /** URL du fichier ; absente en démo (lecture simulée). */
  mediaUrl?: string;
  posterUrl?: string;
  author: FeedAuthor;
  title: string;
  category: string;
  hashtags: string[];
  /** Durée en secondes (60 max). */
  duration: number;
  transcript: TranscriptCue[];
  /** Présent si le post participe à un thème ; `open` = vote « Convaincu » ouvert. */
  theme?: { period: 'weekly' | 'monthly'; subject: string; phase: 'open' | 'closed' };
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  convinced: number;
  /** État propre au membre connecté (tout à false pour un visiteur). */
  viewer: ViewerState;
  /** Post fictif (démo) : les actions restent locales, rien n'est envoyé à l'API. */
  demo?: boolean;
}

export interface ViewerState {
  isLiked: boolean;
  isSaved: boolean;
  isConvinced: boolean;
  isFollowingAuthor: boolean;
}

export const NO_VIEWER: ViewerState = { isLiked: false, isSaved: false, isConvinced: false, isFollowingAuthor: false };

export interface FeedComment {
  id: string;
  author: FeedAuthor;
  text: string;
  /** Il y a combien de temps, déjà formaté. */
  ago: string;
  likes: number;
  isLiked?: boolean;
}

const THEME = {
  period: 'weekly' as const,
  subject: 'Les réseaux sociaux nous rendent-ils plus seuls ?',
  phase: 'open' as const,
};

/** Découpe un texte en sous-titres réguliers sur la durée du post. */
function cues(duration: number, lines: string[]): TranscriptCue[] {
  const step = duration / lines.length;
  return lines.map((text, i) => ({ start: i * step, end: (i + 1) * step, text }));
}

const DEMO_POSTS: Omit<FeedPost, 'viewer' | 'demo'>[] = [
  {
    id: 'p1',
    type: 'video',
    author: { id: 'u1', username: 'ines.parle', color: '#7CC4FA' },
    title: 'Connectés… mais seuls dans une pièce pleine',
    category: 'Débat',
    hashtags: ['#solitude', '#réseaux'],
    duration: 58,
    transcript: cues(58, [
      'On n’a jamais été aussi connectés.',
      'Et pourtant, regardez autour de vous.',
      'Une table, quatre amis, quatre écrans.',
      'Le problème n’est pas le lien.',
      'C’est ce qu’on fait de notre attention.',
      'Posez le téléphone. Juste une heure.',
    ]),
    theme: THEME,
    likes: 1840,
    comments: 96,
    shares: 41,
    saves: 120,
    convinced: 342,
  },
  {
    id: 'p2',
    type: 'audio',
    author: { id: 'u2', username: 'yanisk', color: '#4AA8FF' },
    title: 'Ce n’est pas l’écran le problème',
    category: 'Discours',
    hashtags: ['#éloquence'],
    duration: 60,
    transcript: cues(60, [
      'Le problème, ce n’est pas l’écran.',
      'C’est ce qu’on arrête de se dire en face.',
      'Un message, ça s’efface.',
      'Un regard, ça reste.',
      'Alors la prochaine fois,',
      'dites-le de vive voix.',
    ]),
    theme: THEME,
    likes: 1290,
    comments: 58,
    shares: 22,
    saves: 74,
    convinced: 287,
  },
  {
    id: 'p3',
    type: 'video',
    author: { id: 'u3', username: 'cam.d', color: '#2F8FE8' },
    title: 'Ma grand-mère et Instagram',
    category: 'Storytelling',
    hashtags: ['#famille', '#histoire'],
    duration: 47,
    transcript: cues(47, [
      'Ma grand-mère a 82 ans.',
      'Pendant trente ans, elle a cherché sa sœur.',
      'C’est sur Instagram qu’elle l’a retrouvée.',
      'Alors non, les réseaux ne nous isolent pas.',
      'Ils nous retrouvent.',
    ]),
    theme: THEME,
    likes: 2310,
    comments: 132,
    shares: 88,
    saves: 205,
    convinced: 251,
  },
  {
    id: 'p4',
    type: 'audio',
    author: { id: 'u4', username: 'maitre.sam', color: '#7CC4FA' },
    title: 'Plaidoirie pour le droit à l’ennui',
    category: 'Plaidoirie',
    hashtags: ['#plaidoirie', '#ennui'],
    duration: 54,
    transcript: cues(54, [
      'Mesdames et messieurs les jurés,',
      'je viens défendre un accusé oublié :',
      'l’ennui.',
      'C’est lui qui a inventé nos plus belles idées.',
      'Rendez-lui sa place.',
    ]),
    likes: 640,
    comments: 27,
    shares: 9,
    saves: 33,
    convinced: 0,
  },
  {
    id: 'p5',
    type: 'video',
    author: { id: 'u5', username: 'nora.pitch', color: '#4AA8FF' },
    title: '60 secondes pour vendre un stylo',
    category: 'Pitch',
    hashtags: ['#pitch', '#vente'],
    duration: 60,
    transcript: cues(60, [
      'Je ne vais pas vous vendre un stylo.',
      'Je vais vous vendre une signature.',
      'Celle de votre premier contrat.',
      'Celle de votre première maison.',
      'Le stylo, je vous l’offre.',
    ]),
    likes: 980,
    comments: 44,
    shares: 30,
    saves: 61,
    convinced: 0,
  },
];

/** Prises de démo : affichées aux visiteurs, et aux membres tant que l'API n'a pas de prises. */
export const FEED_POSTS: FeedPost[] = DEMO_POSTS.map((p) => ({ ...p, viewer: NO_VIEWER, demo: true }));

/* ---------- Conversion des réponses de l'API ---------- */

/** Post du feed tel que renvoyé par l'API (toFeedPost dans vhoa-api). */
export interface ApiFeedPost {
  id: string;
  type: 'video' | 'audio';
  thumbnailUrl: string;
  mediaUrl: string;
  duration: number;
  title: string;
  category: string | null;
  hashtags: string[];
  author: { id: string; username: string; avatarUrl: string; avatarEffect?: string | null };
  transcript?: TranscriptCue[];
  theme?: { period: 'weekly' | 'monthly'; subject: string; phase: 'open' | 'closed' };
  status: string;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  convinced: number;
  viewer: ViewerState;
}

export interface ApiComment {
  id: string;
  author: { id: string; username: string; avatarUrl: string; avatarEffect?: string | null };
  text: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
}

const COLORS = ['#7CC4FA', '#4AA8FF', '#2F8FE8'];

/** Couleur d'avatar stable pour un même utilisateur. */
function colorOf(id: string) {
  let h = 0;
  for (const c of id) h = (h * 31 + c.charCodeAt(0)) | 0;
  return COLORS[Math.abs(h) % COLORS.length];
}

const author = (a: ApiFeedPost['author']): FeedAuthor => ({
  id: a.id,
  username: a.username,
  color: colorOf(a.id),
  avatarUrl: a.avatarUrl || undefined,
  avatarEffect: a.avatarEffect ?? null,
});

export function fromApiPost(p: ApiFeedPost): FeedPost {
  return {
    id: p.id,
    type: p.type,
    mediaUrl: p.mediaUrl || undefined,
    posterUrl: p.thumbnailUrl || undefined,
    author: author(p.author),
    title: p.title,
    category: p.category ?? '',
    hashtags: p.hashtags,
    duration: Math.max(1, p.duration),
    transcript: p.transcript ?? [],
    theme: p.theme,
    likes: p.likes,
    comments: p.comments,
    shares: p.shares,
    saves: p.saves,
    convinced: p.convinced,
    viewer: p.viewer,
  };
}

/** « il y a combien de temps » : 2 min, 5 h, 3 j, 4 sem. */
export function ago(iso: string, now = Date.now()) {
  const min = Math.max(0, Math.round((now - new Date(iso).getTime()) / 60_000));
  if (min < 1) return 'à l’instant';
  if (min < 60) return `${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h`;
  const d = Math.round(h / 24);
  return d < 7 ? `${d} j` : `${Math.round(d / 7)} sem`;
}

export function fromApiComment(c: ApiComment): FeedComment {
  return {
    id: c.id,
    author: author(c.author),
    text: c.text,
    ago: ago(c.createdAt),
    likes: c.likes,
    isLiked: c.isLiked,
  };
}

export const FEED_COMMENTS: FeedComment[] = [
  {
    id: 'c1',
    author: { id: 'u6', username: 'leo.oral', color: '#2F8FE8' },
    text: 'La pause avant « posez le téléphone », parfaite.',
    ago: '2 h',
    likes: 48,
  },
  {
    id: 'c2',
    author: { id: 'u7', username: 'sarah_m', color: '#7CC4FA' },
    text: 'Convaincue. Ton débit est super posé.',
    ago: '5 h',
    likes: 31,
  },
  {
    id: 'c3',
    author: { id: 'u8', username: 'theo.debat', color: '#4AA8FF' },
    text: 'Pas d’accord sur le fond, mais quelle conclusion.',
    ago: '1 j',
    likes: 12,
  },
];

/** 1840 → « 1,8 k » (même format que l'app). */
export function formatCount(value: number): string {
  const compact = (n: number, suffix: string) =>
    `${(Math.floor(n * 10) / 10).toString().replace('.', ',')} ${suffix}`;
  if (value >= 1_000_000) return compact(value / 1_000_000, 'M');
  if (value >= 1_000) return compact(value / 1_000, 'k');
  return value.toString();
}
