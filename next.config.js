module.exports = {
  swcMinify: true,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  i18n: {
    locales: ["de", "en"],
    defaultLocale: "de",
  },
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      Object.assign(config.resolve.alias, {
        react: "preact/compat",
        "react-dom/test-utils": "preact/test-utils",
        "react-dom": "preact/compat",
      });
    }

    return config;
  },
};
