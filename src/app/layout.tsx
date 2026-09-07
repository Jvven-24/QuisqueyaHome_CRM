import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

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
});

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quisqueya Home CRM",
  description: "CRM inmobiliario de Quisqueya Home",
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
