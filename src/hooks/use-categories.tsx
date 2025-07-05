"use client";


import { useAuth } from "@/hooks/use-auth";
import { toast } from "@/hooks/use-toast";
import { categoryClient } from "@/lib/controllers/category.controller";
import type { Category } from "@/lib/supabase/types";
import { useCallback, useRef, useState } from "react";
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
}