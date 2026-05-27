/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'prisma'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'static.wikia.nocookie.net',  // TibiaWiki Fandom CDN
      },
      {
        protocol: 'https',
        hostname: 'tibia.fandom.com',
      },
    ],
  },
}

module.exports = nextConfig
