"use client";

import type React from "react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, Loader2, Lock, Mail, User } from "lucide-react";

interface AuthFormProps {
  mode: "login" | "register" | "reset" | "magic-link";
  onSubmit: (data: AuthFormData) => Promise<void>;
  loading?: boolean;
  className?: string;
}

export interface AuthFormData {
  email: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
}

export function AuthForm({ mode, onSubmit, loading = false, className }: AuthFormProps) {
  const [formData, setFormData] = useState<AuthFormData>({
    email: "",
    password: "",
    confirmPassword: "",
    name: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Partial<AuthFormData>>({});

  useEffect(() => {
    // Handle extension context invalidation errors
    const handleExtensionError = (event: ErrorEvent) => {
      if (event.message?.includes("Extension context invalidated")) {
        console.warn("Browser extension conflict detected, continuing normally");
        event.preventDefault();
        return false;
      }
    };

    window.addEventListener("error", handleExtensionError);

    return () => {
      window.removeEventListener("error", handleExtensionError);
    };
  }, []);

  const validateForm = (): boolean => {
    const newErrors: Partial<AuthFormData> = {};

    // Email validation
    if (!formData.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Password validation (not for reset or magic-link)
    if (mode !== "reset" && mode !== "magic-link") {
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (formData.password.length < 8) {
        newErrors.password = "Password must be at least 8 characters";
      }

      // Confirm password validation (only for register)
      if (mode === "register") {
        if (!formData.confirmPassword) {
          newErrors.confirmPassword = "Please confirm your password";
        } else if (formData.password !== formData.confirmPassword) {
          newErrors.confirmPassword = "Passwords do not match";
        }

        // Name validation
        if (!formData.name?.trim()) {
          newErrors.name = "Name is required";
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    try {
      e.preventDefault();

      if (!validateForm()) {
        return;
      }

      await onSubmit(formData);
    } catch (error) {
      console.error("Form submission error:", error);
      // Don't let extension errors break the form
    }
  };

  const handleInputChange = (field: keyof AuthFormData, value: string) => {
    try {
      setFormData((prev) => ({ ...prev, [field]: value }));
      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: undefined }));
      }
    } catch (error) {
      // Handle extension conflicts gracefully
      console.warn("Input change error (likely extension conflict):", error);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case "login":
        return "Welcome back";
      case "register":
        return "Create your account";
      case "reset":
        return "Reset your password";
      case "magic-link":
        return "Sign in with magic link";
      default:
        return "Authentication";
    }
  };

  const getDescription = () => {
    switch (mode) {
      case "login":
        return "Sign in to your account to continue";
      case "register":
        return "Create a new account to get started";
      case "reset":
        return "Enter your email to receive a password reset link";
      case "magic-link":
        return "Enter your email to receive a magic sign-in link";
      default:
        return "";
    }
  };

  const getSubmitText = () => {
    if (loading) {
      return (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {mode === "login"
            ? "Signing in..."
            : mode === "register"
              ? "Creating account..."
              : mode === "reset"
                ? "Sending reset link..."
                : "Sending magic link..."}
        </>
      );
    }

    switch (mode) {
      case "login":
        return "Sign in";
      case "register":
        return "Create account";
      case "reset":
        return "Send reset link";
      case "magic-link":
        return "Send magic link";
      default:
        return "Submit";
    }
  };

  return (
    <Card className={cn("w-full max-w-md mx-auto", className)}>
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">{getTitle()}</CardTitle>
        <CardDescription className="text-muted-foreground">{getDescription()}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name || ""}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  onFocus={(e) => {
                    try {
                      // Prevent extension auto-fill conflicts
                      e.target.setAttribute("data-form-type", "other");
                    } catch (error) {
                      // Ignore extension errors
                    }
                  }}
                  onBlur={(e) => {
                    try {
                      e.target.removeAttribute("data-form-type");
                    } catch (error) {
                      // Ignore extension errors
                    }
                  }}
                  className={cn("pl-10", errors.name && "border-destructive focus-visible:ring-destructive")}
                  disabled={loading}
                />
              </div>
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                onFocus={(e) => {
                  try {
                    // Prevent extension auto-fill conflicts
                    e.target.setAttribute("data-form-type", "other");
                  } catch (error) {
                    // Ignore extension errors
                  }
                }}
                onBlur={(e) => {
                  try {
                    e.target.removeAttribute("data-form-type");
                  } catch (error) {
                    // Ignore extension errors
                  }
                }}
                className={cn("pl-10", errors.email && "border-destructive focus-visible:ring-destructive")}
                disabled={loading}
                autoComplete="email"
              />
            </div>
            {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
          </div>

          {mode !== "reset" && mode !== "magic-link" && (
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password || ""}
                  onChange={(e) => handleInputChange("password", e.target.value)}
                  onFocus={(e) => {
                    try {
                      // Prevent extension auto-fill conflicts
                      e.target.setAttribute("data-form-type", "other");
                    } catch (error) {
                      // Ignore extension errors
                    }
                  }}
                  onBlur={(e) => {
                    try {
                      e.target.removeAttribute("data-form-type");
                    } catch (error) {
                      // Ignore extension errors
                    }
                  }}
                  className={cn("pl-10 pr-10", errors.password && "border-destructive focus-visible:ring-destructive")}
                  disabled={loading}
                  autoComplete={mode === "login" ? "current-password" : "new-password"}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{showPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
          )}

          {mode === "register" && (
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={formData.confirmPassword || ""}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  onFocus={(e) => {
                    try {
                      // Prevent extension auto-fill conflicts
                      e.target.setAttribute("data-form-type", "other");
                    } catch (error) {
                      // Ignore extension errors
                    }
                  }}
                  onBlur={(e) => {
                    try {
                      e.target.removeAttribute("data-form-type");
                    } catch (error) {
                      // Ignore extension errors
                    }
                  }}
                  className={cn(
                    "pl-10 pr-10",
                    errors.confirmPassword && "border-destructive focus-visible:ring-destructive",
                  )}
                  disabled={loading}
                  autoComplete="new-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="sr-only">{showConfirmPassword ? "Hide password" : "Show password"}</span>
                </Button>
              </div>
              {errors.confirmPassword && <p className="text-sm text-destructive">{errors.confirmPassword}</p>}
            </div>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {getSubmitText()}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

