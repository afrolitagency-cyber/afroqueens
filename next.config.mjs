/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: `/${process.env.CLOUDINARY_CLOUD_NAME ?? 'dcn8ukwsh'}/image/upload/**`,
      },
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },

  transpilePackages: ['@blocknote/core', '@blocknote/react', '@blocknote/mantine'],

  experimental: {
    instrumentationHook: true,
    serverActions: { bodySizeLimit: '10mb' },
  },
}

export default nextConfig
