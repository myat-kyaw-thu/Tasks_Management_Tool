"use client";

import { useAuth } from "@/hooks/use-auth";
import type { Category } from "@/lib/supabase/types";
import { useRef, useState } from "react";
// Add caching import at the top
export function useCategories() {
  const cleanupRef = useRef<(() => void)[]>([]);
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const fetchedRef = useRef<string | null>(null);

  const userId = user?.id;
}