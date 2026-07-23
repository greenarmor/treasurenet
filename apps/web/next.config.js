/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@treasurenet/shared'],
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Stellar SDK uses sodium-native (Node.js native module)
      // Replace with empty modules in browser context
      config.resolve.fallback = {
        ...config.resolve.fallback,
        'sodium-native': false,
        'require-addon': false,
        fs: false,
        net: false,
        tls: false,
        dns: false,
        child_process: false,
      };
    }
    return config;
  },
};

module.exports = nextConfig;
