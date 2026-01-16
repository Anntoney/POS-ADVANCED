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
  // Note: Cache-control headers are handled by middleware.ts
  // This ensures dynamic routes don't get cached aggressively
}

export default nextConfig