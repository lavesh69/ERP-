import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(process.env.STANDALONE === "true"
    ? {
        output: "standalone",
        outputFileTracingRoot: path.resolve(process.cwd()),
      }
    : {}),
  reactStrictMode: true,
  env: {
    JWT_SECRET: process.env.JWT_SECRET || "classroom-enterprise-secret-key-32-chars-long",
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;

