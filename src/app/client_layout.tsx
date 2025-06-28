"use client";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/hooks/use-auth";
import { Inter } from "next/font/google";
import type React from "react";
import "../app/globals.css";

// Add performance imports at the top
import { bundleOptimization, performanceMonitoring } from "@/lib/performance/bundle-optimization";
import { preloadCriticalComponents } from "@/lib/performance/lazy-loading";

const inter = Inter({ subsets: ["latin"] });

// Add useEffect for performance initialization
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const React = require("react"); // Import React dynamically to avoid redeclaration

  // Initialize performance monitoring in client-side only
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      // Preload critical resources
      bundleOptimization.preloadCriticalResources();

      // Preload critical components
      preloadCriticalComponents();

      // Start performance monitoring
      performanceMonitoring.trackWebVitals();

      // Check memory usage periodically
      const memoryCheck = setInterval(() => {
        performanceMonitoring.checkMemoryUsage();
      }, 30000); // Check every 30 seconds

      return () => clearInterval(memoryCheck);
    }
  }, []);

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preload critical resources */}
        {/* <link rel="preload" href="/fonts/inter-var.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="dns-prefetch" href="https://fonts.gstatic.com" /> */}
      </head>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
