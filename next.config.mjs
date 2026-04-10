import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  /* config options here */
  ...(process.env.NODE_ENV === "development" && {
    turbopack: {
      root: path.resolve(process.cwd()),
    },
  }),
};

export default nextConfig;



