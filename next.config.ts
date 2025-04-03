/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbo: {
      resolveSourceMapLocations: ["**/*"]
    }
  }
};

module.exports = nextConfig;