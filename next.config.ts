/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      // Enable source maps specifically for Turbopack
      resolveSourceMapLocations: ["**/*"]
    }
  }
};

module.exports = nextConfig;