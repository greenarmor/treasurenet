/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@treasurenet/shared'],
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
};

module.exports = nextConfig;
