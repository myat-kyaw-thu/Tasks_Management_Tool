"use client";


import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { categoryClient, categoryValidation } from "@/lib/controllers/category.controller";
import type { Category, CategoryInsert, CategoryUpdate } from "@/lib/supabase/types";
import { useCallback, useEffect, useRef, useState } from "react";
// Add caching import at the top
import { cacheUtils } from "@/lib/performance/caching";

// Add caching import at the top
export function useCategories() {
  const cleanupRef = useRef<(() => void)[]>([]);
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const fetchedRef = useRef<string | null>(null);

  const userId = user?.id;
  const fetchCategories = useCallback(async () => {
    if (!userId) {
      setCategories([]);
      setLoading(false);
      return;
    }

    // Prevent duplicate fetches for the same user
    if (fetchedRef.current === userId) {
      return;
    }

    // Create abort controller for cleanup
    const abortController = new AbortController();
    cleanupRef.current.push(() => abortController.abort());

    try {
      setLoading(true);
      setError(null);

      // Try cache first
      const cached = await cacheUtils.getCachedCategories(userId);
      if (Array.isArray(cached) && !abortController.signal.aborted) {
        setCategories(cached);
        setLoading(false);
        fetchedRef.current = userId;
        return;
      }

      const { data, error } = await categoryClient.getCategories();

      // Check if request was aborted before setting state
      if (abortController.signal.aborted) return;

      if (error) {
        setError(error);
        toast({
          title: "Failed to load categories",
          description: error.message,

        });
      } else {
        setCategories(data);
        // Cache the results
        cacheUtils.setCachedCategories(userId, data);
      }

      fetchedRef.current = userId;
    } catch (err) {
      if (!abortController.signal.aborted) {
        setError(err);
        toast({
          title: "Failed to load categories",
          description: "An unexpected error occurred",

        });
      }
    } finally {
      if (!abortController.signal.aborted) {
        setLoading(false);
      }
    }
  }, [userId]);
  const createCategory = useCallback(
    async (categoryData: Omit<CategoryInsert, "user_id">) => {
      if (!userId) return { success: false, error: "User not authenticated" };

      try {
        const validation = categoryValidation.validateCategory(categoryData);
        if (!validation.isValid) {
          toast({
            title: "Invalid category data",
            description: validation.errors[0],

          });
          return { success: false, error: validation.errors };
        }

        const { data, error } = await categoryClient.createCategory(categoryData);

        if (error) {
          toast({
            title: "Failed to create category",
            description: error.message,

          });
          return { success: false, error };
        }

        setCategories((prev) => [...prev, data!]);

        // Invalidate cache after successful creation
        cacheUtils.setCachedCategories(userId, [...categories, data!]);

        toast({
          title: "Category created",
          description: "Your category has been created successfully",
        });
        return { success: true, data };
      } catch (err) {
        toast({
          title: "Failed to create category",
          description: "An unexpected error occurred",

        });
        return { success: false, error: err };
      }
    },
    [userId, categories],
  );
  const updateCategory = useCallback(
    async (categoryId: string, updates: CategoryUpdate) => {
      try {
        const validation = categoryValidation.validateCategory(updates);
        if (!validation.isValid) {
          toast({
            title: "Invalid category data",
            description: validation.errors[0],

          });
          return { success: false, error: validation.errors };
        }

        const originalCategories = [...categories];
        setCategories((prev) =>
          prev.map((category) =>
            category.id === categoryId ? { ...category, ...updates, updated_at: new Date().toISOString() } : category,
          ),
        );

        const { data, error } = await categoryClient.updateCategory(categoryId, updates);

        if (error) {
          setCategories(originalCategories);
          toast({
            title: "Failed to update category",
            description: error.message,

          });
          return { success: false, error };
        }

        setCategories((prev) => prev.map((category) => (category.id === categoryId ? data! : category)));
        toast({
          title: "Category updated",
          description: "Your category has been updated successfully",
        });
        return { success: true, data };
      } catch (err) {
        toast({
          title: "Failed to update category",
          description: "An unexpected error occurred",

        });
        return { success: false, error: err };
      }
    },
    [categories],
  );

  const deleteCategory = useCallback(
    async (categoryId: string) => {
      try {
        const originalCategories = [...categories];
        setCategories((prev) => prev.filter((category) => category.id !== categoryId));

        const { error } = await categoryClient.deleteCategory(categoryId);

        if (error) {
          setCategories(originalCategories);
          toast({
            title: "Failed to delete category",
            description: error.message,

          });
          return { success: false, error };
        }

        toast({
          title: "Category deleted",
          description: "Category and its tasks have been updated",
        });
        return { success: true };
      } catch (err) {
        toast({
          title: "Failed to delete category",
          description: "An unexpected error occurred",

        });
        return { success: false, error: err };
      }
    },
    [categories],
  );
  // Simple effect that only runs when userId changes
  useEffect(() => {
    if (userId && fetchedRef.current !== userId) {
      fetchCategories();
    } else if (!userId) {
      setCategories([]);
      setLoading(false);
      setError(null);
      fetchedRef.current = null;
    }
  }, [userId]); // Only depend on userId
}