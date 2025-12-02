/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['sharp', 'onnxruntime-node']
  },
  
  // Image optimization
  images: {
    domains: [
      'localhost',
      'res.cloudinary.com',
      'images.unsplash.com',
      'avatars.githubusercontent.com',
      'lh3.googleusercontent.com',
      'pbs.twimg.com',
      's3.amazonaws.com',
      'storage.googleapis.com'
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 31536000, // 1 year
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;"
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Handle node modules that need to be transpiled
    config.module.rules.push({
      test: /\.node$/,
      use: 'raw-loader'
    });

    // Optimize bundle splitting
    if (!isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            priority: 10,
            reuseExistingChunk: true
          },
          common: {
            name: 'common',
            minChunks: 2,
            priority: 5,
            reuseExistingChunk: true
          }
        }
      };
    }

    // Add aliases for better imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname),
      '@/components': require('path').resolve(__dirname, 'components'),
      '@/lib': require('path').resolve(__dirname, 'lib'),
      '@/store': require('path').resolve(__dirname, 'store'),
      '@/types': require('path').resolve(__dirname, 'types'),
      '@/utils': require('path').resolve(__dirname, 'utils')
    };

    // Ignore certain modules in client bundle
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false
      };
    }

    return config;
  },

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' ? 'https://cirkel.io' : '*'
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS'
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-API-Version'
          }
        ]
      },
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  },

  // Redirects for SEO and UX
  async redirects() {
    return [
      {
        source: '/home',
        destination: '/',
        permanent: true
      },
      {
        source: '/feed',
        destination: '/',
        permanent: false
      }
    ];
  },

  // Rewrites for API versioning
  async rewrites() {
    return [
      {
        source: '/api/v1/:path*',
        destination: '/api/v1/:path*'
      },
      {
        source: '/docs',
        destination: '/api-docs'
      }
    ];
  },

  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
    BUILD_TIME: new Date().toISOString(),
    BUILD_ID: process.env.VERCEL_GIT_COMMIT_SHA || 'local'
  },

  // Compression
  compress: true,

  // Power by header
  poweredByHeader: false,

  // Trailing slash
  trailingSlash: false,

  // React strict mode
  reactStrictMode: true,

  // SWC minification
  swcMinify: true,

  // Output configuration
  output: 'standalone',

  // ESLint configuration
  eslint: {
    dirs: ['pages', 'components', 'lib', 'store', 'types', 'utils']
  },

  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false
  },

  // Internationalization
  i18n: {
    locales: ['en', 'es', 'fr', 'de', 'ja', 'ko', 'zh', 'ar', 'hi', 'pt'],
    defaultLocale: 'en',
    localeDetection: true
  },

  // Analytics
  analyticsId: process.env.ANALYTICS_ID,

  // PWA configuration
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
    disable: process.env.NODE_ENV === 'development'
  },

  // Bundle analyzer
  bundleAnalyzer: {
    enabled: process.env.ANALYZE === 'true'
  },

  // Sentry configuration
  sentry: {
    hideSourceMaps: true,
    widenClientFileUpload: true
  },

  // Monitoring
  monitoring: {
    relayGlobalErrors: true
  }
};

// Plugins
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true'
});

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

module.exports = withBundleAnalyzer(withPWA(nextConfig));