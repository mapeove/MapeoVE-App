import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/hooks/use-auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MapeoVE — Descubre negocios cerca de ti",
  description:
    "Plataforma de descubrimiento local para Venezuela. Encuentra restaurantes, farmacias, gasolineras, hoteles y más en La Victoria, Aragua.",
  keywords: [
    "MapeoVE",
    "Venezuela",
    "La Victoria",
    "Aragua",
    "negocios",
    "directorio",
    "mapa",
    "restaurantes",
    "farmacias",
  ],
  authors: [{ name: "MapeoVE" }],
  icons: {
    icon: "/mapeove-logo.png",
  },
  openGraph: {
    title: "MapeoVE — Descubre negocios cerca de ti",
    description: "Plataforma de descubrimiento local para Venezuela",
    type: "website",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

