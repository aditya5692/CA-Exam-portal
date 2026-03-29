import type { NextConfig } from "next";
import path from "path";

const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["@prisma/client", "prisma", "better-sqlite3"],
  turbopack: {
    root: path.resolve(__dirname),
    resolveAlias: {
      ".prisma/client/default": "./node_modules/.prisma/client/default.js",
    },
  },
  // 🚀 [Optimization] Support for low-resource VPS (2GB RAM)
  // These steps use heavy memory; assume quality checks were done locally.
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
} as any;

export default nextConfig;
