/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  async redirects() {
    return [
      {
        source: '/',
        destination: '/trade',
        permanent: false,
      },
      {
        source: '/joe',
        destination: '/trade/joe',
        permanent: false,
      },
    ]
  },
}
