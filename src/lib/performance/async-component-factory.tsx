"use client";

import React, { useEffect, useLayoutEffect, useRef } from "react";

// Component code splitting helper with proper JSX syntax
export const createAsyncComponent = <T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T; }>,
  fallbackComponent?: React.ComponentType,
) => {
  const LazyComponent = React.lazy(importFn);

  // Create wrapper component with proper ref forwarding
  const AsyncWrapper = React.forwardRef<any, React.ComponentProps<T>>((props, ref) => {
    const FallbackComponent = fallbackComponent || (() => <div>Loading...</div>);

    return (
      <React.Suspense fallback={<FallbackComponent />}>
        {React.createElement(LazyComponent as React.ComponentType<any>, { ...props, ref })}
      </React.Suspense>
    );
  });

  // Set displayName for debugging
  AsyncWrapper.displayName = `AsyncWrapper(${(importFn as any).name || (LazyComponent as any).name || "Component"})`;

  return AsyncWrapper;
};

// Higher-order component for performance monitoring
export function withPerformanceMonitoring<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  componentName?: string
) {
  const displayName =
    componentName || WrappedComponent.displayName || WrappedComponent.name || "Component";

  type ComponentProps = React.ComponentPropsWithRef<typeof WrappedComponent>;

  const PerformanceMonitoredComponent = React.forwardRef<any, ComponentProps>((props, ref) => {
    const measureEnd = useRef<(() => void) | null>(null);

    useLayoutEffect(() => {
      const startTime = performance.now();
      measureEnd.current = () => {
        const endTime = performance.now();
        const renderTime = endTime - startTime;
        if (renderTime > 16) {
          console.warn(`${displayName} render took ${renderTime.toFixed(2)}ms`);
        }
      };
    }, []);

    useEffect(() => {
      if (measureEnd.current) {
        measureEnd.current();
        measureEnd.current = null;
      }
    }, []);

    return <WrappedComponent {...(props as P)} ref={ref} />;
  });

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`;

  return PerformanceMonitoredComponent;
}

// Memoization helper for expensive components
export const createMemoizedComponent = <P extends object>(
  Component: React.ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean,
) => {
  const MemoizedComponent = React.memo(Component, areEqual);
  MemoizedComponent.displayName = `Memoized(${Component.displayName || Component.name || "Component"})`;
  return MemoizedComponent;
};
