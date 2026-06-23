import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Pin the workspace root: this folder has its own lockfile but sits inside a
  // parent dir that also has one, which otherwise makes Next guess wrong.
  turbopack: {
    root: path.resolve(__dirname),
  },
};

export default nextConfig;
