
/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig = {
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['recharts', '@heroicons/react', 'framer-motion', '@radix-ui/react-icons', '@radix-ui/react-dialog', '@radix-ui/react-select']
  },
  webpack: (config) => {
    config.optimization.splitChunks = {
      chunks: 'all',
      minSize: 20000,
      maxSize: 90000,
      cacheGroups: {
        default: false,
        vendors: false,
        framework: {
          chunks: 'all',
          name: 'framework',
          test: /(?<!node_modules.*)[\\/]node_modules[\\/](react|react-dom|scheduler|prop-types|use-subscription)[\\/]/,
          priority: 40,
          enforce: true
        },
        commons: {
          name: 'commons',
          chunks: 'initial',
          minChunks: 2,
          priority: 20
        },
        lib: {
          test(module: any) {
            return module.size() > 50000 &&
              /node_modules[/\\]/.test(module.identifier());
          },
          name(module: any) {
            const hash = crypto.createHash('sha1');
            hash.update(module.libIdent({ context: __dirname }));
            return hash.digest('hex').substring(0, 8);
          },
          priority: 30,
          minChunks: 1,
          reuseExistingChunk: true
        }
      }
    };
    return config;
  },
  swcMinify: true,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production',
  },
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
        ]
      }
    ]
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.NODE_ENV === 'development' 
          ? 'https://52c8265e-6e58-4fdf-ad64-fa60ff0fb5b8-00-3o6lyfavjj71.riker.replit.dev/api/:path*'
          : 'https://tradalystbackend-chantabbai07ai.replit.app/api/:path*'
      }
    ]
  }
}

module.exports = nextConfig
