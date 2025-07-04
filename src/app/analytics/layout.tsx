import type { Metadata } from "next";
import type React from "react";

export const metadata: Metadata = {
  title: "Analytics - TaskFlow",
  description: "Track your productivity and task completion patterns with detailed analytics and insights.",
};

export default function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
