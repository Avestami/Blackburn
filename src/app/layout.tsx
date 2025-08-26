import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { SessionProviderWrapper } from "@/components/providers/session-provider";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import BackgroundNodes from "@/components/BackgroundNodes";

import { ConditionalNavbar } from "@/components/layout/conditional-navbar";
import { ConditionalFooter } from "@/components/layout/conditional-footer";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "BlackBurn Fitness - Transform Your Body, Transform Your Life",
  description:
    "Professional fitness programs, weight tracking, and personalized coaching to help you achieve your fitness goals.",
  keywords:
    "fitness, weight loss, muscle building, personal training, nutrition, workout plans",
  authors: [{ name: "BlackBurn Fitness Team" }],
  manifest: "/manifest.json",
  themeColor: "#dc2626",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "BlackBurn Fitness",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    siteName: "BlackBurn Fitness",
    title: "BlackBurn Fitness - Transform Your Body, Transform Your Life",
    description: "Professional fitness programs, weight tracking, and personalized coaching to help you achieve your fitness goals.",
  },
  twitter: {
    card: "summary",
    title: "BlackBurn Fitness - Transform Your Body, Transform Your Life",
    description: "Professional fitness programs, weight tracking, and personalized coaching to help you achieve your fitness goals.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getServerSession(authOptions);

  return (
    <html lang="en">
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider>
          <SessionProviderWrapper session={session}>
            <LanguageProvider>
              {/* Background layers */}
              <div
                className="fixed inset-0 z-0 bg-gradient-to-br transition-colors duration-300
                from-rose-50 via-white to-rose-100
                dark:from-black dark:via-red-950 dark:to-black"
              />
              <BackgroundNodes />
              
              {/* Global switchers */}
      
              
              {/* Main content */}
              <div className="relative z-20 min-h-screen flex flex-col">
                <ConditionalNavbar />
                <main className="flex-1">
                  {children}
                </main>
                <ConditionalFooter />
              </div>
              
              <Toaster />
            </LanguageProvider>
          </SessionProviderWrapper>
        </ThemeProvider>
      </body>
    </html>
  );
}
