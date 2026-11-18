import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
