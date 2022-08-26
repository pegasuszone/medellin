/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: "/tradeurl/:addr",
        destination: "/inventory?peer=:addr",
        permanent: true,
      },
    ];
  },
};
