/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/",
        destination: "/inbox",
        permanent: false,
      },
      {
        source: "/tradeurl/:addr",
        destination: "/inventory?peer=:addr",
        permanent: true,
      },
    ];
  },
};
