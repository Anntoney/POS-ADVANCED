/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Generate unique build IDs using timestamp to prevent build mismatch errors
  generateBuildId: async () => {
    return `build-${Date.now()}`
  },
  // Allow cross-origin requests from network IPs during development
  // This fixes the warning about cross-origin requests to /_next/* resources
  experimental: {
    allowedDevOrigins: ['108.181.203.106'],
  },
  // Note: Cache-control headers are handled by middleware.ts
  // This ensures dynamic routes don't get cached aggressively
}

export default nextConfig