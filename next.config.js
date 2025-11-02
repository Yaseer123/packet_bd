/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

/** @type {import("next").NextConfig} */
const config = {
  // Only use standalone output in Docker/CI environments (not on Windows local builds)
  // Windows requires admin privileges or Developer Mode for symlinks
  // Docker builds run on Linux, so standalone will be enabled there
  ...(process.platform !== "win32" || process.env.FORCE_STANDALONE === "true"
    ? { output: "standalone" }
    : {}),
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [
          {
            type: "host",
            value: "www.packetbd.com",
          },
        ],
        destination: "https://packetbd.com/:path*",
        permanent: true,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rinorsestore.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "packetbd.s3.ap-southeast-1.amazonaws.com",
        pathname: "/**",
      },
      { protocol: "https", hostname: "res.cloudinary.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "100mb",
    },
  },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
};

export default config;
