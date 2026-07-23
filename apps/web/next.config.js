/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@treasurenet/shared'],
  images: {
    domains: ['ipfs.io', 'gateway.pinata.cloud'],
  },
  serverExternalPackages: ['sodium-native'],
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Completely replace sodium-native with an empty stub for browser
      config.resolve.alias = {
        ...config.resolve.alias,
        'sodium-native': require.resolve('./src/lib/sodium-stub'),
        'require-addon': false,
      };
      config.resolve.fallback = {
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
