/** @type {import('next').NextConfig} */
const nextConfig: import('next').NextConfig = {
  experimental: {
    serverActions: {},
  },
  images: {
    domains: ['localhost'],
  },
};

module.exports = nextConfig;