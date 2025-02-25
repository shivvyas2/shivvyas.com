/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable static asset handling
  assetPrefix: process.env.NODE_ENV === 'production' ? '' : '',
  
  // Configure image domains if you're using next/image
  images: {
    domains: ['shivvyas.com', 'www.shivvyas.com'],
  },

  // Handle redirects at the Next.js level
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'www.shivvyas.com',
          },
        ],
        destination: 'https://shivvyas.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
