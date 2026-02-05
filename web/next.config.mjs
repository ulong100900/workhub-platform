/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drfmmechmkwuaubnroln.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
    // Разрешаем все домены (только для разработки)
    unoptimized: process.env.NODE_ENV === 'development', // ← ДОБАВЬ ЭТУ СТРОКУ
  },
  
  experimental: {
    // serverComponentsExternalPackages: ['@prisma/client'],
  },
  
  env: {
    SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  },
  
  output: 'standalone',
  
  typescript: {
    ignoreBuildErrors: true,
  },
  
  eslint: {
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig