/** @type {import('next').NextConfig} */
const nextConfig = {
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
      }
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
