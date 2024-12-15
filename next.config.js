/** @type {import('next').NextConfig} */
const nextConfig = {
  webSocketServerOptions: {
    host: '0.0.0.0'
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
      }
    ]
  }
}

module.exports = nextConfig