module.exports = {
  reactStrictMode: true,
  images: {
    domains: [
      "etgsXXXXXXXXXXXindyo.supabase.co",
      "etgsXXXXXXXXXXXindyo.supabase.in",
      'lh3.googleusercontent.com',
    ],
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback.fs = false;
    }
    return config;
  },
};
