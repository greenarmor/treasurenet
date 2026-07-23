/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@treasurenet/shared'],
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Force browser resolution for Stellar SDK
      config.resolve.conditionNames = ['browser', 'import', 'module', 'require'];
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
