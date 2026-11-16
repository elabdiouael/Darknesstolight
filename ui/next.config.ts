import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Bla logo dyal Next.js f z-zawya (mode dev)
  devIndicators: false,
  cacheComponents: true,
  partialPrefetching: true,
  // Les pages l-9dam (dashboard / read) t-jem3o f /khatma -> redirect bach links l-9dam ma ytherssouch
  async redirects() {
    return [
      { source: "/dashboard", destination: "/home", permanent: false },
      { source: "/read/:surahId", destination: "/khatma", permanent: false },
    ];
  },
};

export default nextConfig;