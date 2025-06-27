"use client";

import { cacheUtils } from '@/lib/performance/caching';
import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/database.types";
import { toast } from 'sonner';


class UserProfileManager {
  private static instance: UserProfileManager;
  private profile: UserProfile | null = null;
  private loading = false;
  private error: string | null = null;
  private subscribers = new Set<() => void>();
  private realtimeSubscription: any = null;
  private supabase = createClient();
  private userId: string | null = null;

  static getInstance(): UserProfileManager {
    if (!UserProfileManager.instance) {
      UserProfileManager.instance = new UserProfileManager();
    }
    return UserProfileManager.instance;
  }

  subscribe(callback: () => void) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    this.subscribers.forEach((callback) => callback());
  }


  private async fetchProfile() {
    if (!this.userId) return;

    this.loading = true;
    this.error = null;
    this.notify();

    try {
      // Check cache first
      const cached = await cacheUtils.getCachedProfile(this.userId);
      if (cached.fromCache && cached.data && this.isValidProfile(cached.data)) {
        this.profile = cached.data as UserProfile;
        this.loading = false;
        this.notify();
        return;
      }

      const { data, error } = await this.supabase.from("user_profiles").select("*").eq("user_id", this.userId).single();

      if (error) {
        if (error.code === "PGRST116") {
          // Profile doesn't exist yet - database trigger will create it
          this.profile = null;
          this.error = "Profile not found. Please wait a moment and try again.";
        } else {
          throw error;
        }
      } else {
        this.profile = this.normalizeProfile(data);
        // Cache the result
        if (this.profile) {
          cacheUtils.setCachedProfile(this.userId, this.profile);
        }
      }
    } catch (err) {
      this.error = err instanceof Error ? err.message : "Failed to fetch profile";
      toast({
        title: "Failed to load profile",
        description: this.error,
      });
    }

    this.loading = false;
    this.notify();
  }

  private isValidProfile(data: any): boolean {
    return typeof data === "object" && data !== null && "id" in data && "user_id" in data && "username" in data;
  }
}