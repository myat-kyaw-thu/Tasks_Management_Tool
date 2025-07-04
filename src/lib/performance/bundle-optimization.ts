import { Calendar, Check, Clock, Plus } from "lucide-react";
// Bundle optimization utilities following existing patterns
export const bundleOptimization = {
  // Dynamic imports for heavy libraries
  loadDateLibrary: () => import("date-fns"),

  // Preload critical resources
  preloadCriticalResources: () => {
    // Removed font and CSS preloading to prevent 404 errors
  },

  // Image optimization helpers
  getOptimizedImageProps: (src: string, alt: string, width?: number, height?: number) => ({
    src,
    alt,
    width,
    height,
    loading: "lazy" as const,
    decoding: "async" as const,
    style: { contentVisibility: "auto" },
  }),
};

// Performance monitoring utilities
export const performanceMonitoring = {
  // Measure component render time
  measureRenderTime: (componentName: string) => {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;

      if (renderTime > 16) {
        // Longer than one frame
        console.warn(`${componentName} render took ${renderTime.toFixed(2)}ms`);
      }
    };
  },

  // Track user interactions
  trackInteraction: (action: string, element: string, duration?: number) => {
    if (typeof window !== "undefined" && "performance" in window) {
      performance.mark(`interaction-${action}-${element}`);

      if (duration) {
        console.log(`${action} on ${element} took ${duration.toFixed(2)}ms`);
      }
    }
  },

  // Monitor memory usage
  checkMemoryUsage: () => {
    if (typeof window !== "undefined" && "memory" in performance) {
      const memory = (performance as any).memory;
      const used = memory.usedJSHeapSize / 1048576; // Convert to MB
      const total = memory.totalJSHeapSize / 1048576;

      if (used > 50) {
        // Alert if using more than 50MB
        console.warn(`High memory usage: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
      }

      return { used, total };
    }
    return null;
  },

  // Web Vitals tracking
  trackWebVitals: () => {
    if (typeof window === "undefined") return;

    try {
      // Track Largest Contentful Paint
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log("LCP:", lastEntry.startTime);
      }).observe({ entryTypes: ["largest-contentful-paint"] });

      // Track First Input Delay
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          console.log("FID:", (entry as any).processingStart - entry.startTime);
        });
      }).observe({ entryTypes: ["first-input"] });

      // Track Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        const entries = list.getEntries();
        entries.forEach((entry: any) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        console.log("CLS:", clsValue);
      }).observe({ entryTypes: ["layout-shift"] });
    } catch (error) {
      console.warn("Performance monitoring not supported:", error);
    }
  },
};

// Resource preloading utilities
export const resourcePreloader = {
  // Preload images
  preloadImage: (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = src;
    });
  },

  // Preload multiple images
  preloadImages: async (srcs: string[]): Promise<void> => {
    try {
      await Promise.all(srcs.map((src) => resourcePreloader.preloadImage(src)));
    } catch (error) {
      console.warn("Failed to preload some images:", error);
    }
  },

  // Preload CSS
  preloadCSS: (href: string) => {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "style";
    link.href = href;
    document.head.appendChild(link);
  },

  // Preload JavaScript modules
  preloadModule: (href: string) => {
    if (typeof window === "undefined") return;

    const link = document.createElement("link");
    link.rel = "modulepreload";
    link.href = href;
    document.head.appendChild(link);
  },
};

// Enhanced code splitting with preloading
export const enhancedBundleOptimization = {
  // Preload critical routes based on user behavior
  preloadRoutesByPriority: () => {
    if (typeof window === "undefined") return;

    // Preload dashboard components first (most used)
    const criticalRoutes = [
      () => import("@/app/dashboard/page"),
      () => import("@/components/tasks/task-list"),
      () => import("@/components/tasks/tasks-form."),
    ];

    // Preload secondary routes after critical ones
    const secondaryRoutes = [
      () => import("@/app/analytics/page"),
      () => import("@/components/categories/category-list"),
      () => import("@/components/profile/user-profile-card"),
    ];

    // Load critical routes immediately
    Promise.all(criticalRoutes.map((route) => route().catch(() => null))).then(() => {
      // Load secondary routes after critical ones
      setTimeout(() => {
        secondaryRoutes.forEach((route) => route().catch(() => null));
      }, 2000);
    });
  },

  // Smart chunk splitting based on usage patterns
  optimizeChunkLoading: () => {
    if (typeof window === "undefined") return;

    // Prefetch chunks when user is idle
    if ("requestIdleCallback" in window) {
      requestIdleCallback(() => {
        enhancedBundleOptimization.preloadRoutesByPriority();
      });
    } else {
      setTimeout(enhancedBundleOptimization.preloadRoutesByPriority, 1000);
    }
  },

  // Reduce bundle size by removing unused imports
  getOptimizedImports: () => ({
    // Only import what's needed from lucide-react
    icons: {
      Plus,
      Check,
      Calendar,
      Clock,
    },
  }),
};
