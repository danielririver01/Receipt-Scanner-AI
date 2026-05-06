import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  experimental: {
    webpackBuildWorker: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'tesseract.js': path.resolve(__dirname, 'node_modules/tesseract.js'),
      };
    }

    // Optimizar serialización del cache
    config.cache = {
      ...config.cache,
      type: 'filesystem',
      compression: 'gzip',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 días
    };

    return config;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, x-api-key" },
        ]
      }
    ]
  }
};

export default nextConfig;
