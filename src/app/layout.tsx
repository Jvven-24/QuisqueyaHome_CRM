import type { Metadata } from "next";

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
      <body>{children}</body>
    </html>
  );
}
