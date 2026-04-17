import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: [
    "@prisma/client",
    "@prisma/adapter-pg",
    "@prisma/adapter-better-sqlite3",
    "better-sqlite3",
    "pg",
    "prisma",
  ],
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
  poweredByHeader: false,
  async redirects() {
    return [
      {
        source: "/past-year-questions",
        destination: "/study-material",
        permanent: true,
      },
      {
        source: "/student/past-year-questions",
        destination: "/student/free-resources?type=PYQ",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
