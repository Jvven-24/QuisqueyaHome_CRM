import type { Metadata, Viewport } from "next";
import { Atkinson_Hyperlegible_Next, Hanken_Grotesk } from "next/font/google";
import "./tokens.css";

/**
 * Fuentes del sistema de diseño (T5), portadas de
 * `referencia-prototipo/app/layout.tsx`. `next/font/google` las descarga en
 * build y expone `--font-atkinson`/`--font-hanken`, las mismas variables que
 * consume `globals.css`. Ambas existen en el catálogo de esta versión de
 * Next — no hace falta pila de respaldo.
 */
const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
  adjustFontFallback: false,
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
  adjustFontFallback: false,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#10172d",
};

export const metadata: Metadata = {
  title: "Quisqueya Home Private Desk · CRM",
  description: "Consola de operaciones y CRM inmobiliario de Quisqueya Home",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "QH CRM",
  },
  icons: {
    icon: "/brand/app-icon-192.png",
    apple: "/brand/app-icon-192.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${atkinson.variable} ${hanken.variable}`}>
        {children}
      </body>
    </html>
  );
}
