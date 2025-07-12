"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Category } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Edit, MoreHorizontal, Plus, Tag, Trash2 } from "lucide-react";
import { useState } from "react";
import { InlineErrorFallback } from '../layout/error-boundary';
import { LoadingSpinner } from '../layout/loading-spinner';

interface CategoryListProps {
  categories: Category[];
  loading?: boolean;
  error?: Error | null;
  onEdit?: (category: Category) => void;
  onDelete?: (categoryId: string) => Promise<{ success: boolean; error?: any; }>;
  onRetry?: () => void;
  onCreateNew?: () => void;
  className?: string;
}

export function CategoryList({
  categories,
  loading = false,
  error = null,
  onEdit,
  onDelete,
  onRetry,
  onCreateNew,
  className,
}: CategoryListProps) {
  const [deleteCategory, setDeleteCategory] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleEdit = (category: Category) => {
    onEdit?.(category);
  };

  const handleDelete = (category: Category) => {
    setDeleteCategory(category);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteCategory || !onDelete || deleting) return;

    setDeleting(true);
    try {
      const result = await onDelete(deleteCategory.id);
      if (result.success) {
        setDeleteCategory(null);
      }
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-4", className)}>
        <LoadingSpinner text="Loading categories..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn("space-y-4", className)}>
        <InlineErrorFallback error={error} onRetry={onRetry} />
      </div>
    );
  }

  if (categories.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <Tag className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">No categories yet</h3>
            <p className="text-sm text-muted-foreground mb-4 max-w-sm">
              Create your first category to organize your tasks better.
            </p>
            {onCreateNew && (
              <Button onClick={onCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create Category
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)}>
        {categories.map((category) => (
          <Card key={category.id} className="group hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("w-4 h-4 rounded-full", `category-${category.color}`)} />
                  <CardTitle className="text-base">{category.name}</CardTitle>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                      <span className="sr-only">Open menu</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleEdit(category)}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(category)}
                      className="text-destructive focus:text-destructive"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              {category.description && (
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{category.description}</p>
              )}
              <div className="flex items-center justify-between">
                <Badge variant="secondary" className="text-xs">
                  {/* This would show task count if we had it */}
                  Category
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Created {new Date(category.created_at).toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteCategory} onOpenChange={(open) => !open && setDeleteCategory(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteCategory?.name}"? This will remove the category from all tasks
              that use it. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
