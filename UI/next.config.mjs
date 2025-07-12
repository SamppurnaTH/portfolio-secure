/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  devIndicators: false,

  async headers() {
    return [
      {
        // Apply to all API routes
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            // ✅ Use environment variables for CORS
            value:
              process.env.NODE_ENV === "development"
                ? process.env.FRONTEND_URL || "http://localhost:3000"
                : process.env.FRONTEND_URL || "*",
          },
          {
            key: "Access-Control-Allow-Methods",
            value: "GET, POST, PUT, DELETE, PATCH, OPTIONS",
          },
          {
            key: "Access-Control-Allow-Headers",
            value:
              "Authorization, Content-Type, X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version",
          },
          {
            key: "Access-Control-Allow-Credentials",
            value: "true", // Needed for cookies/sessions
          },
          {
            key: "Access-Control-Max-Age",
            value: "86400", // Cache preflight for 24 hours
          },
        ],
      },
    ];
  },
};

export default nextConfig;
