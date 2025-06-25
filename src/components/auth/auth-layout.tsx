"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";
import { CheckCircle, Shield, Users, Zap } from "lucide-react";
import type React from "react";

interface AuthLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthLayout({ children, className }: AuthLayoutProps) {
  const features = [
    {
      icon: CheckCircle,
      title: "Task Management",
      description: "Organize and track your tasks efficiently with our intuitive interface.",
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is encrypted and secure. We respect your privacy.",
    },
    {
      icon: Zap,
      title: "Real-time Sync",
      description: "Access your tasks from anywhere with instant synchronization.",
    },
    {
      icon: Users,
      title: "Team Ready",
      description: "Built for individuals and teams to collaborate effectively.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold">TaskFlow</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="flex min-h-screen">
        {/* Left Side - Features */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-2/5 bg-muted/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
          <div className="relative z-10 flex flex-col justify-center px-8 xl:px-12">
            <div className="max-w-md">
              <h1 className="text-4xl xl:text-5xl font-bold tracking-tight mb-6">
                Manage tasks with
                <span className="text-primary block">simplicity</span>
              </h1>
              <p className="text-lg text-muted-foreground mb-12">
                TaskFlow helps you organize your work and life, finally. Get started today and experience the
                difference.
              </p>

              <div className="space-y-6">
                {features.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-20 right-20 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-40 h-40 bg-accent/5 rounded-full blur-3xl" />
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 lg:w-1/2 xl:w-3/5 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            <div className={cn("space-y-6", className)}>{children}</div>
          </div>
        </div>
      </div>

      {/* Mobile Header for small screens */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm border-t p-4">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">Secure task management for everyone</p>
        </div>
      </div>
    </div>
  );
}
