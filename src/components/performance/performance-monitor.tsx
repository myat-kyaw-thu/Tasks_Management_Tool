"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { performanceMonitoring } from "@/lib/performance/bundle-optimization";
import { useEffect, useState } from "react";

interface PerformanceMonitorProps {
  showInProduction?: boolean;
}

export function PerformanceMonitor({ showInProduction = false }: PerformanceMonitorProps) {
  const [memoryUsage, setMemoryUsage] = useState<{ used: number; total: number; } | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only show in development or when explicitly enabled
    const isDev = process.env.NODE_ENV === "development";
    setIsVisible(isDev || showInProduction);

    if (isDev || showInProduction) {
      const interval = setInterval(() => {
        const usage = performanceMonitoring.checkMemoryUsage();
        if (usage) {
          setMemoryUsage(usage);
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [showInProduction]);

  if (!isVisible || !memoryUsage) {
    return null;
  }

  const memoryPercentage = (memoryUsage.used / memoryUsage.total) * 100;
  const getMemoryStatus = () => {
    if (memoryPercentage > 80) return { color: "destructive", label: "High" };
    if (memoryPercentage > 60) return { color: "warning", label: "Medium" };
    return { color: "success", label: "Good" };
  };

  const status = getMemoryStatus();

  return (
    <Card className="fixed bottom-4 right-4 w-64 z-50 opacity-80 hover:opacity-100 transition-opacity">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center justify-between">
          Performance Monitor
          <Badge variant={status.color as any}>{status.label}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xs space-y-1">
        <div className="flex justify-between">
          <span>Memory Usage:</span>
          <span>
            {memoryUsage.used.toFixed(1)}MB / {memoryUsage.total.toFixed(1)}MB
          </span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${status.color === "destructive"
              ? "bg-red-500"
              : status.color === "warning"
                ? "bg-yellow-500"
                : "bg-green-500"
              }`}
            style={{ width: `${memoryPercentage}%` }}
          />
        </div>
      </CardContent>
    </Card>
  );
}
