"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { categoryValidation } from "@/lib/controllers/category.controller";
import type { Category, CategoryInsert, CategoryUpdate } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Save, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { InlineLoadingSpinner } from '../layout/loading-spinner';

interface CategoryFormProps {
  category?: Category | null;
  onSubmit: (data: Omit<CategoryInsert, "user_id"> | CategoryUpdate) => Promise<{ success: boolean; error?: any; }>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

const CATEGORY_COLORS = [
  { name: "Red", value: "red", class: "bg-red-500" },
  { name: "Orange", value: "orange", class: "bg-orange-500" },
  { name: "Yellow", value: "yellow", class: "bg-yellow-500" },
  { name: "Green", value: "green", class: "bg-green-500" },
  { name: "Blue", value: "blue", class: "bg-blue-500" },
  { name: "Purple", value: "purple", class: "bg-purple-500" },
  { name: "Pink", value: "pink", class: "bg-pink-500" },
  { name: "Gray", value: "gray", class: "bg-gray-500" },
];

export function CategoryForm({ category, onSubmit, onCancel, loading = false, className }: CategoryFormProps) {
  const isEditing = !!category;

  const [formData, setFormData] = useState({
    name: category?.name || "",
    description: category?.description || "",
    color: category?.color || "blue",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when category changes
  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name,
        description: category.description || "",
        color: category.color,
      });
    }
  }, [category]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const validation = categoryValidation.validateCategory(formData);
    if (!validation.isValid) {
      validation.errors.forEach((error) => {
        if (error.includes("name")) {
          newErrors.name = error;
        } else if (error.includes("description")) {
          newErrors.description = error;
        } else if (error.includes("color")) {
          newErrors.color = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        color: formData.color,
      };

      const result = await onSubmit(submitData);
      if (result.success) {
        if (!isEditing) {
          // Reset form for new categories
          setFormData({
            name: "",
            description: "",
            color: "blue",
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  return (
    <Card className={cn("w-full max-w-lg", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{isEditing ? "Edit Category" : "Create New Category"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <div className="relative">
              <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="name"
                placeholder="Enter category name..."
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className={cn("pl-10", errors.name && "border-destructive")}
                disabled={saving}
                maxLength={50}
              />
            </div>
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={cn("min-h-[80px] resize-none", errors.description && "border-destructive")}
              disabled={saving}
              maxLength={200}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.description && <span className="text-destructive">{errors.description}</span>}
              <span className="ml-auto">{formData.description.length}/200</span>
            </div>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Color *</Label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORY_COLORS.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleInputChange("color", color.value)}
                  className={cn(
                    "flex items-center gap-2 p-2 rounded-md border-2 transition-colors",
                    formData.color === color.value
                      ? "border-primary bg-primary/10"
                      : "border-muted hover:border-muted-foreground/50",
                  )}
                  disabled={saving}
                >
                  <div className={cn("w-4 h-4 rounded-full", color.class)} />
                  <span className="text-sm">{color.name}</span>
                </button>
              ))}
            </div>
            {errors.color && <p className="text-sm text-destructive">{errors.color}</p>}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.name.trim()} className="flex-1">
              {saving ? (
                <>
                  <InlineLoadingSpinner className="mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  {isEditing ? "Update Category" : "Create Category"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
