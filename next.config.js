/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Enable file system access for local development
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

module.exports = nextConfig;

