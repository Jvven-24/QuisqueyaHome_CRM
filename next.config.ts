import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    // Habilita `forbidden()` de next/navigation, que es lo único que permite a
    // una página responder 403 de verdad en vez de un 500 genérico. Marcado
    // experimental por Next; si algún día desaparece, el reemplazo se hace en
    // un solo sitio: src/infrastructure/page-guard.ts.
    authInterrupts: true,
  },
};

export default nextConfig;
