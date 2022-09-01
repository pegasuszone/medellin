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
        source: "/link/:addr",
        destination: "/trade?peer=:addr",
        permanent: true,
      },
    ];
  },
};
