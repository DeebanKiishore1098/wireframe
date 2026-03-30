import type { NextConfig } from "next";
import path from "path";
import { fileURLToPath } from "url";

const nextConfig: NextConfig = {
  serverExternalPackages: ["pdf-parse", "mammoth"], // Safety for native node modules
  turbopack: {
    // __dirname is not available in ES module mode next.config natively in some environments.
    // However, if tsconfig allows it, this resolves the root directory specifically.
    root: process.cwd(), 
  },
};

export default nextConfig;
