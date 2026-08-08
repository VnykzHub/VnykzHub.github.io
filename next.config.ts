import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  async redirects() {
    return [
      { source: '/writing', destination: '/blog', permanent: true },
      { source: '/writing/:slug', destination: '/blog/:slug', permanent: true },
    ]
  },
}

export default nextConfig
