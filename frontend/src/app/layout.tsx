import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/AppProviders";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  description: "Parametric weather insurance settled by real weather data.",
  icons: {
    apple: [
      {
        type: "image/svg+xml",
        url: "/apple-touch-icon.svg",
      },
    ],
    icon: [
      {
        type: "image/svg+xml",
        url: "/favicon.svg",
      },
      {
        type: "image/svg+xml",
        url: "/icon.svg",
      },
    ],
  },
  metadataBase: new URL("https://parametrix.app"),
  openGraph: {
    description: "Parametric weather insurance settled by real weather data.",
    images: [
      {
        alt: "Parametrix",
        height: 630,
        url: "/og-image.svg",
        width: 1200,
      },
    ],
    title: "Parametrix",
  },
  title: "Parametrix",
  twitter: {
    card: "summary_large_image",
    description: "Parametric weather insurance settled by real weather data.",
    images: ["/og-image.svg"],
    title: "Parametrix",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={cn("font-sans", geist.variable)}
      data-scroll-behavior="smooth"
      lang="en"
    >
      <body>
        <AppProviders>{children}</AppProviders>
        <Toaster richColors theme="dark" />
      </body>
    </html>
  );
}
