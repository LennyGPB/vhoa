/**
 * Feed : types (même forme que le FeedPost de l'app) et conversion des réponses de l'API.
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


/** 1840 → « 1,8 k » (même format que l'app). */
export function formatCount(value: number): string {
  const compact = (n: number, suffix: string) =>
    `${(Math.floor(n * 10) / 10).toString().replace('.', ',')} ${suffix}`;
  if (value >= 1_000_000) return compact(value / 1_000_000, 'M');
  if (value >= 1_000) return compact(value / 1_000, 'k');
  return value.toString();
}
