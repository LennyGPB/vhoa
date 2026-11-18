/** Types et réglages communs du parcours Créer. */

export type Format = 'video' | 'audio';

/** Prise prête à être publiée (enregistrée dans le navigateur ou importée). */
export interface Recording {
  blob: Blob;
  /** URL locale (URL.createObjectURL) pour la relire. */
  url: string;
  format: Format;
  /** Type MIME sans paramètres (« video/webm »). */
  mime: string;
  /** Durée en secondes. */
  duration: number;
}

/** Durée max d'une prise et minimum pour qu'elle soit analysable (comme l'app et l'API). */
export const MAX_SECONDS = 60;
export const MIN_SECONDS = 3;

export const CATEGORIES = ['Discours', 'Plaidoirie', 'Débat', 'Storytelling', 'Slam', 'Pitch', 'Impro'] as const;

/** Formats acceptés par l'API (vhoa-api/src/posts/posts.constants.ts). */
export const ACCEPT: Record<Format, string> = {
  video: 'video/mp4,video/quicktime,video/webm,video/3gpp',
  audio: 'audio/mp4,audio/m4a,audio/x-m4a,audio/aac,audio/mpeg,audio/wav,audio/x-wav,audio/webm,audio/ogg,audio/3gpp',
};

export function baseMime(mime: string) {
  return mime.toLowerCase().split(';')[0].trim();
}

/** 42 → « 0:42 » */
export function clock(seconds: number) {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Durée d'un fichier importé (lue par le navigateur). */
export function readDuration(url: string, format: Format): Promise<number> {
  return new Promise((resolve, reject) => {
    const el = document.createElement(format === 'video' ? 'video' : 'audio');
    el.preload = 'metadata';
    el.onloadedmetadata = () => {
      // Certains fichiers WebM annoncent une durée infinie : on force la lecture jusqu'au bout.
      if (Number.isFinite(el.duration)) return resolve(el.duration);
      el.currentTime = 1e7;
      el.ontimeupdate = () => {
        el.ontimeupdate = null;
        resolve(el.duration);
      };
    };
    el.onerror = () => reject(new Error('Fichier illisible'));
    el.src = url;
  });
}

/**
 * Envoi direct du fichier vers le stockage (URL signée de l'API), avec la progression.
 * XMLHttpRequest plutôt que fetch : lui seul donne la progression de l'envoi.
 */
export function uploadFile(
  url: string,
  blob: Blob,
  headers: Record<string, string>,
  onProgress: (ratio: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url);
    for (const [k, v] of Object.entries(headers)) xhr.setRequestHeader(k, v);
    xhr.upload.onprogress = (e) => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`HTTP ${xhr.status}`)));
    xhr.onerror = () => reject(new Error('Réseau'));
    xhr.send(blob);
  });
}
