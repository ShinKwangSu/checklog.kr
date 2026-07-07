/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@checklog/ui', '@checklog/database'],
}

export default nextConfig
