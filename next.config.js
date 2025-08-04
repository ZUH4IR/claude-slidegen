/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['yaml', '@anthropic-ai/sdk'],
  eslint: {
    ignoreDuringBuilds: true
  }
}

module.exports = nextConfig