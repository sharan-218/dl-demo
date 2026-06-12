import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: [],
  serverExternalPackages: ["pg"],
};

export default nextConfig;
