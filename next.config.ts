import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
  experimental: {
    // Habilita `forbidden()` de next/navigation, que es lo único que permite a
    // una página responder 403 de verdad en vez de un 500 genérico. Marcado
    // experimental por Next; si algún día desaparece, el reemplazo se hace en
    // un solo sitio: src/infrastructure/page-guard.ts.
    authInterrupts: true,
  },
};

export default nextConfig;
