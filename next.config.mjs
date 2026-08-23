/** @type {import('next').NextConfig} */
const securityHeaders = [
  // 1. Content Security Policy (CSP)
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.youtube.com https://s.ytimg.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com data:",
      "img-src 'self' data: blob: https://*.mzstatic.com https://*.apple.com https://*.dzcdn.net https://*.ytimg.com https://images.unsplash.com https://lh3.googleusercontent.com https://avatars.githubusercontent.com",
      "media-src 'self' blob: data: https://audio-ssl.itunes.apple.com https://*.itunes.apple.com https://*.apple.com https://*.mzstatic.com https://*.dzcdn.net https://*.deezer.com",
      "connect-src 'self' https://*.supabase.co https://audio-ssl.itunes.apple.com https://*.itunes.apple.com https://*.apple.com https://itunes.apple.com https://*.mzstatic.com",
      "frame-src 'self' https://www.youtube.com https://www.youtube-nocookie.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join('; '),
  },
  // 2. Prevent Clickjacking
  {
    key: 'X-Frame-Options',
    value: 'DENY',
  },
  // 3. Prevent MIME Type Sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // 4. Referrer Policy
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // 5. Restrict Unused Browser Capabilities
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
  },
  // 6. XSS Filter protection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // 7. Strict Transport Security (HSTS)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.mzstatic.com' },
      { protocol: 'https', hostname: '**.dzcdn.net' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
