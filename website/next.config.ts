import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  turbopack: {
    rules: {
      // Treat .geojson files as JSON modules
      '*.geojson': {
        loaders: [],
        as: '*.json',
      },
    },
  },
}

export default nextConfig
