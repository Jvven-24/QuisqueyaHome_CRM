import type { Metadata } from "next";
import { Atkinson_Hyperlegible_Next, Hanken_Grotesk } from "next/font/google";
import "./globals.css";

const hanken = Hanken_Grotesk({
  variable: "--font-hanken",
  subsets: ["latin"],
});

const atkinson = Atkinson_Hyperlegible_Next({
  variable: "--font-atkinson",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Quisqueya Home CRM",
  description: "CRM privado para la operación inmobiliaria de Quisqueya Home.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${hanken.variable} ${atkinson.variable}`}>
        {children}
      </body>
    </html>
  );
}
