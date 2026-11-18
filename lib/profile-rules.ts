/**
 * Règles du profil, partagées par la page /profil/modifier et ses Server Actions
 * (un fichier « use server » ne peut exporter que des fonctions).
 * Reprises de l'API : vhoa-api/src/users/users.dto.ts et auth.dto.ts.
 */

export const USERNAME_RE = /^(?![._])(?!.*[._]{2})[a-z0-9._]{3,30}(?<![._])$/;
export const PASSWORD_RE = /^(?=.*\p{L})(?=.*\d).{8,128}$/u;
export const AVATAR_KEY_RE = /^a\/[0-9a-f-]{36}\/[0-9a-f]{32}\.(jpg|png|webp)$/;

export const AVATAR_TYPES: readonly string[] = ['image/jpeg', 'image/png', 'image/webp'];
export const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
export const DISPLAY_NAME_MAX = 50;
export const BIO_MAX = 160;

export const USERNAME_HINT = 'Pseudo : 3 à 30 caractères, lettres, chiffres, points ou tirets bas.';
export const PASSWORD_HINT = 'Le mot de passe doit faire au moins 8 caractères avec une lettre et un chiffre.';
