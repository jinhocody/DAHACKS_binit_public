import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  // The site moved to binit-app.vercel.app; old sortsnap.vercel.app links keep working by redirecting there.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "sortsnap.vercel.app" }],
        destination: "https://binit-app.vercel.app/:path*",
        permanent: true,
      },
    ];
  },
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
