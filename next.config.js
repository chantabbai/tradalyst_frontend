/** @type {import('next').NextConfig} */
const nextConfig = {
  webSocketServerOptions: {
    host: '0.0.0.0'
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