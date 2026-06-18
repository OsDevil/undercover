import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/undercover",
  images: { unoptimized: true },
  trailingSlash: true,
};

export default nextConfig;
