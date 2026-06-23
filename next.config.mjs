/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs', 'puppeteer'],
    // Verhindert, dass Build-Cache & lokale Artefakte in die Serverless-Funktionen
    // getraced werden (sonst > 250 MB → Deploy schlägt fehl bei Cache-Builds).
    outputFileTracingExcludes: {
      '*': [
        '.next/cache/**',
        'node_modules/.cache/**',
        '.vercel/**',
      ],
    },
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
    ]
  },
}

export default nextConfig
