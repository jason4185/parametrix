import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { AppProviders } from "@/providers/AppProviders";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: "Parametrix",
  description: "Parametric weather insurance for fixed-period coverage.",
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
