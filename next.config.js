/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['shivvyas.com', 'www.shivvyas.com'],
  },
  async redirects() {
    return [
      {
        source: '/launchpad',
        destination: '/projects/macbook-launchpad',
        permanent: false,
      },
      {
        // Always the newest release's DMG
        source: '/launchpad/download',
        destination: 'https://github.com/shivvyas2/macbook-launchpad/releases/latest/download/MacBook-Launchpad.dmg',
        permanent: false,
      },
      {
        source: '/stash',
        destination: '/projects/stash',
        permanent: false,
      },
      {
        source: '/stash/download',
        destination: 'https://github.com/shivvyas2/Stash/releases/latest/download/Stash.dmg',
        permanent: false,
      },
      {
        source: '/prepboard',
        destination: '/projects/prepboard',
        permanent: false,
      },
      {
        source: '/prepboard/download',
        destination: 'https://github.com/shivvyas2/Prepboard/releases/latest/download/PrepBoard-mac.dmg',
        permanent: false,
      },
      {
        source: '/cinemahud',
        destination: '/projects/cinemahud',
        permanent: false,
      },
      {
        // The DMG name carries the version, so point at the newest release page
        source: '/cinemahud/download',
        destination: 'https://github.com/shivvyas2/Sony-Alpha-A6400-Cinema-Monitor/releases/latest',
        permanent: false,
      },
      {
        source: '/projects/luna',
        destination: '/projects/contextual-intelligence',
        permanent: true,
      },
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
