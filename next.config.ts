import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // pdf-parse bundles pdfjs-dist, which spins up a worker via a relative import
  // Turbopack can't resolve once bundled — opt it out of Server Components
  // bundling so it loads through native Node `require` instead.
  serverExternalPackages: ["pdf-parse"],
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://eu-assets.i.posthog.com/static/:path*",
      },
      {
        source: "/ingest/array/:path*",
        destination: "https://eu-assets.i.posthog.com/array/:path*",
      },
      {
        source: "/ingest/:path*",
        destination: "https://eu.i.posthog.com/:path*",
      },
    ];
  },
  // Required to support PostHog trailing slash API requests
  skipTrailingSlashRedirect: true,
};

export default nextConfig;
