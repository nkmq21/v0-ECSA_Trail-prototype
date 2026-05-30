import type { NextConfig } from 'next'

const nextConfig = {
  cacheComponents: true,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
} as NextConfig

export default nextConfig
