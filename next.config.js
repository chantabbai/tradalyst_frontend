
/** @type {import('next').NextConfig} */

  experimental: {
    optimizeCss: true,
    modularizeImports: {
      '@heroicons/react/24/outline': {
        transform: '@heroicons/react/24/outline/{{member}}',
      },
      'recharts': {
        transform: 'recharts/{{member}}',
      },
    },
  },

const nextConfig = {
  poweredByHeader: false,
  compress: true,
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }
        ],
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://tradalystbackend-chantabbai07ai.replit.app/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig
