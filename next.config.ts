import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Configurar timeouts más largos
  serverRuntimeConfig: {
    // Aumentar timeout para requests del servidor
    requestTimeout: 300000,
  },

  // Configurar el webpack para timeouts más largos
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals = config.externals || [];
    }
    return config;
  },
};

export default nextConfig;
