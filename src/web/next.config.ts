/**
 * Next.js Configuration File
 * -----------------------------------------------------
 * This file defines the Next.js configuration settings
 * for the B2B sales intelligence platform, including:
 * 1. Edge Network Deployment optimization for Vercel
 * 2. Security headers with comprehensive CSP and related settings
 * 3. Performance optimizations targeting Core Web Vitals
 *
 * Note: We import the type definition for NextConfig from 'next' (version ^14.0.0).
 */

import { type NextConfig } from 'next'; // version ^14.0.0

/**
 * Asynchronously define custom HTTP headers
 * to enhance security and improve user trust.
 * We enforce CSP, HSTS, frame-guards, and additional
 * protective enhancements as per the requirements.
 */
async function headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        {
          key: 'Content-Security-Policy',
          value:
            "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.vercel.app; frame-ancestors 'none';",
        },
        {
          key: 'X-DNS-Prefetch-Control',
          value: 'on',
        },
        {
          key: 'Strict-Transport-Security',
          value: 'max-age=63072000; includeSubDomains; preload',
        },
        {
          key: 'X-Frame-Options',
          value: 'DENY',
        },
        {
          key: 'X-Content-Type-Options',
          value: 'nosniff',
        },
        {
          key: 'Referrer-Policy',
          value: 'strict-origin-when-cross-origin',
        },
        {
          key: 'Permissions-Policy',
          value: 'camera=(), microphone=(), geolocation=(), interest-cohort=()',
        },
      ],
    },
  ];
}

/**
 * Modify the default Webpack configuration to:
 * - Manage code-splitting (splitChunks) for performance
 * - Minimize and apply deterministic module IDs
 */
function webpackConfig(originalConfig: any) {
  // Override optimization settings with advanced chunk strategy
  originalConfig.optimization = {
    ...originalConfig.optimization,
    splitChunks: {
      chunks: 'all',
      minSize: 20000,
      maxSize: 200000,
      minChunks: 1,
      maxAsyncRequests: 30,
      maxInitialRequests: 30,
      cacheGroups: {
        defaultVendors: {
          test: /[\\/]node_modules[\\/]/,
          priority: -10,
          reuseExistingChunk: true,
        },
        default: {
          minChunks: 2,
          priority: -20,
          reuseExistingChunk: true,
        },
      },
    },
    minimize: true,
    moduleIds: 'deterministic',
  };

  return originalConfig;
}

/**
 * Comprehensive Next.js configuration object
 * that enables:
 * - Strict Mode for React
 * - Security Headers
 * - Performance optimizations
 * - Serverless (standalone) output for Vercel's Edge Network
 */
const config: NextConfig = {
  // Enable React Strict Mode for detecting potential issues
  reactStrictMode: true,

  // Removes the 'X-Powered-By' header for security
  poweredByHeader: false,

  // Minify with the SWC compiler for better performance
  swcMinify: true,

  // Gzip compression for improved bandwidth usage
  compress: true,

  // Expose environment variables for public use in Next.js
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  },

  /**
   * Define image handling specifics:
   * - Approved domain: supabase.co
   * - Image formats: avif & webp
   * - Custom device/image sizes
   * - Cache settings
   */
  images: {
    domains: ['supabase.co'],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: false,
  },

  /**
   * A function that returns an array of route configurations,
   * each containing custom security headers to be applied.
   */
  headers,

  /**
   * Overriding the default Webpack config:
   * - Custom optimization for bundle size
   * - Deterministic module IDs for long-term caching
   */
  webpack(originalConfig) {
    return webpackConfig(originalConfig);
  },

  /**
   * Enabling various experimental Next.js features:
   * - serverActions: advanced server-side operations
   * - typedRoutes: typed route definitions
   * - optimizeCss: minifies & optimizes CSS
   * - scrollRestoration: preserves scroll position
   * - legacyBrowsers: disables support for older browsers
   * - newNextLinkBehavior: enhanced link behavior in Next 13+
   */
  experimental: {
    serverActions: true,
    typedRoutes: true,
    optimizeCss: true,
    scrollRestoration: true,
    legacyBrowsers: false,
    newNextLinkBehavior: true,
  },

  /**
   * The compiler configuration allows partial console removal
   * while preserving specific log levels.
   */
  compiler: {
    removeConsole: {
      exclude: ['error', 'warn', 'info'],
    },
  },

  /**
   * Strict TypeScript settings:
   * - 'ignoreBuildErrors: false' enforces build error blocking
   * - 'tsconfigPath' sets the project tsconfig location
   * - 'strict' encourages precise type-checking
   */
  typescript: {
    ignoreBuildErrors: false,
    tsconfigPath: './tsconfig.json',
    // Although Next.js does not natively support a 'strict' field here,
    // we maintain it to highlight the project's focus on type safety.
    strict: true,
  },

  /**
   * Output 'standalone' mode for improved deploy flexibility:
   * - Good fit for serverless/Vercel Edge environment
   * - Contains necessary dependencies
   */
  output: 'standalone',

  // Disables generation of source maps for the production build
  productionBrowserSourceMaps: false,

  /**
   * Analytics ID for Vercel:
   * - Allows performance & usage tracking
   */
  analyticsId: 'vercel-analytics-id',

  /**
   * Optimize font loading:
   * - Reduces layout shift
   * - Improves initial loading performance
   */
  optimizeFonts: true,

  /**
   * Configure how cross-origin requests are performed:
   * - 'anonymous' is suitable for controlling resource requests
   */
  crossOrigin: 'anonymous',
};

/**
 * Export the Next.js configuration object as the default export,
 * which is required for Next.js to detect and use it.
 */
export default config;