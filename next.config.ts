import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  turbopack: { root: path.resolve(__dirname) },
  transpilePackages: ["three"],
  // Without this, opening the dev server through its LAN address (the "Network" URL)
  // blocks Next's client assets, so the page never hydrates and only the static
  // fallback renders. Dev-only; no effect on production builds.
  allowedDevOrigins: ["10.*.*.*", "192.168.*.*", "*.local"],
};

export default nextConfig;
