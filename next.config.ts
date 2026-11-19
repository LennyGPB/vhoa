import type { NextConfig } from "next";

/**
 * En-têtes de sécurité sur toutes les pages.
 * - Interdit l'affichage du site dans une iframe (anti-clickjacking, protège le back-office).
 * - CSP limitée aux règles sans risque de casse (pas de script-src : Google Identity et Next
 *   injectent des scripts ; à durcir plus tard avec des nonces).
 * - Caméra et micro autorisés pour le site lui-même (enregistrement des prises).
 */
const SECURITY_HEADERS = [
  { key: 'X-Frame-Options', value: 'DENY' },
  {
    key: 'Content-Security-Policy',
    value: "frame-ancestors 'none'; base-uri 'self'; object-src 'none'; form-action 'self'",
  },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(self), geolocation=(), payment=()' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: SECURITY_HEADERS }];
  },
  // Dev uniquement : laisse le téléphone (même Wi-Fi) charger le site via l'IP du PC.
  // Sans ça, Next bloque le JavaScript et la page ne réagit pas. À mettre à jour si l'IP change.
  allowedDevOrigins: ['192.168.1.137'],
  experimental: {
    agentFeedback: true,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
