/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      // Redirect HTTP to HTTPS
      {
        source: '/:path*',
        has: [
          {
            type: 'host',
            value: 'shivvyas.com',
          },
        ],
        destination: 'https://shivvyas.com/:path*',
        permanent: true,
      },
      // Redirect www to non-www
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
    ]
  },
}

module.exports = nextConfig
