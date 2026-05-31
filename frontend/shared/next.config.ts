import path from "path";
import type { NextConfig } from "next";

const sharedDir = __dirname;
const repoRoot = path.join(sharedDir, "../..");
const frontendDir = path.join(sharedDir, "..");
const backendDir = path.join(repoRoot, "backend");

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    // Docker image build sets SKIP_TYPECHECK=true (repo has known TS debt).
    ignoreBuildErrors: process.env.SKIP_TYPECHECK === "true",
  },
  images: {
    qualities: [75, 92],
  },
  // Monorepo: trace backend + sibling page folders from repo root in production.
  outputFileTracingRoot: repoRoot,
  // App lives in shared/, but page UI imports reach ../loginpage, ../dashboard, etc.
  // Keep Turbopack root at frontend/ (not repo root) so App Router resolves
  // frontend/shared/src/app/api/* correctly in dev.
  turbopack: {
    root: frontendDir,
    resolveAlias: {
      "@": path.join(sharedDir, "src"),
      "@backend": backendDir,
    },
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": path.join(sharedDir, "src"),
      "@backend": backendDir,
    };

    const fileLoaderRule = config.module.rules.find(
      (rule: { test?: { test?: (s: string) => boolean } }) =>
        rule.test?.test?.(".svg")
    );
    if (fileLoaderRule && typeof fileLoaderRule === "object") {
      fileLoaderRule.exclude = /\.svg$/i;
    }

    config.module.rules.push({
      test: /\.svg$/i,
      issuer: /\.[jt]sx?$/,
      use: ["@svgr/webpack"],
    });

    return config;
  },
};

export default nextConfig;
