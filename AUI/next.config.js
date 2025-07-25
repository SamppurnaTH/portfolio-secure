/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,

  // ✅ Updated proxy to point to backend on port 4000
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === "production" 
          ? `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`
          : "http://localhost:4000/api/:path*",
      },
    ]
  },
}

module.exports = nextConfig