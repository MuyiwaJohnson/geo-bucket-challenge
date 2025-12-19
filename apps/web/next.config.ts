import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@geoflow/db", "@geoflow/types"],
  reactStrictMode: true,
};

export default nextConfig;
