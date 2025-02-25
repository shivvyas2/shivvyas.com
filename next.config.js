/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['shivvyas.com', 'www.shivvyas.com'],
  },
  async redirects() {
    return [
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'shivvyas.com',
          },
        ],
        destination: 'https://www.shivvyas.com/:path*',
        permanent: true,
      },
    ];
  },
};

module.exports = nextConfig;
