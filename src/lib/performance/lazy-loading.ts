import { lazy } from "react";

// Lazy load heavy components following existing patterns
export const LazyTaskForm = lazy(() =>
  import("@/components/tasks/tasks-form.").then((module) => ({ default: module.TaskForm })),
);

export const LazyTaskList = lazy(() =>
  import("@/components/tasks/task-list").then((module) => ({ default: module.TaskList })),
);

export const LazyUserProfileEditor = lazy(() =>
  import("@/components/profile/user-profile-editor").then((module) => ({ default: module.UserProfileEditor })),
);

// Fixed notification dropdown lazy loading
export const LazyNotificationDropdown = lazy(() =>
  import("@/components/notifications/notification-dropdown").then((module) => ({
    default: module.NotificationDropdown,
  })),
);

// Preload critical components
export const preloadCriticalComponents = () => {
  // Preload task form since it's frequently used
  import("@/components/tasks/tasks-form.");
  // Preload task list for dashboard
  import("@/components/tasks/task-list");
  // Preload notification dropdown for header
  import("@/components/notifications/notification-dropdown");
};

// Component preloading utilities
export const componentPreloader = {
  // Preload specific component
  preloadComponent: (importFn: () => Promise<any>) => {
    return importFn().catch((error) => {
      console.warn("Failed to preload component:", error);
    });
  },

  // Preload multiple components
  preloadComponents: (importFns: Array<() => Promise<any>>) => {
    return Promise.allSettled(importFns.map((fn) => componentPreloader.preloadComponent(fn)));
  },

  // Preload on user interaction
  preloadOnHover: (element: HTMLElement, importFn: () => Promise<any>) => {
    let preloaded = false;

    const handleHover = () => {
      if (!preloaded) {
        preloaded = true;
        componentPreloader.preloadComponent(importFn);
        element.removeEventListener("mouseenter", handleHover);
      }
    };

    element.addEventListener("mouseenter", handleHover);

    // Cleanup function
    return () => element.removeEventListener("mouseenter", handleHover);
  },

  // Preload on viewport intersection
  preloadOnIntersection: (element: HTMLElement, importFn: () => Promise<any>) => {
    if (typeof window === "undefined" || !("IntersectionObserver" in window)) {
      return () => { };
    }

    let preloaded = false;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !preloaded) {
            preloaded = true;
            componentPreloader.preloadComponent(importFn);
            observer.unobserve(element);
          }
        });
      },
      { rootMargin: "50px" },
    );

    observer.observe(element);

    // Cleanup function
    return () => observer.disconnect();
  },
};
