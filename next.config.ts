import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The share-image routes read the Cinzel font from disk at runtime.
  outputFileTracingIncludes: {
    "/opengraph-image": ["./src/assets/**"],
    "/hero/[slug]/opengraph-image": ["./src/assets/**"],
    "/lore/[slug]/opengraph-image": ["./src/assets/**"],
  },
};

export default nextConfig;
