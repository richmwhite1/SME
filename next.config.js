/** @type {import('next').NextConfig} */
const nextConfig = {
  // Strict checks enabled for perfect local environment
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'images.clerk.dev',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'images.openfoodfacts.org',
      },
    ],
    unoptimized: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', 'jsdom'],
  },
}

module.exports = nextConfig

