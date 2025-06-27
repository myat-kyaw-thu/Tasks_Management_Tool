"use client";

import { cacheUtils } from '@/lib/performance/caching';
import { createClient } from "@/lib/supabase/client";
import type { UserProfile, UserProfileUpdate } from "@/types/database.types";
import { UserStatus } from '@/types/user-profile.types';
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
  private setupRealtimeSubscription() {
    if (!this.userId || this.realtimeSubscription) return;

    this.realtimeSubscription = this.supabase
      .channel(`user_profiles:${this.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "user_profiles",
          filter: `user_id=eq.${this.userId}`,
        },
        (payload) => this.handleRealtimeUpdate(payload),
      )
      .subscribe();
  }
  private handleRealtimeUpdate(payload: any) {
    const { eventType, new: newRecord } = payload;

    switch (eventType) {
      case "INSERT":
      case "UPDATE":
        this.profile = this.normalizeProfile(newRecord);
        this.error = null; // Clear any "not found" errors
        break;
      case "DELETE":
        this.profile = null;
        break;
    }

    // Update cache
    if (this.userId) {
      if (this.profile) {
        cacheUtils.setCachedProfile(this.userId, this.profile);
      } else {
        cacheUtils.invalidateUserCache(this.userId);
      }
    }

    this.notify();
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

  private normalizeProfile(data: any): UserProfile {
    return {
      ...data,
      status: (data.status ?? "living") as UserStatus,
      social_links: data.social_links ?? {},
    };
  }
  async updateProfile(updates: UserProfileUpdate) {
    if (!this.userId || !this.profile) {
      throw new Error("User not authenticated or profile not loaded");
    }

    // Optimistic update
    const originalProfile = { ...this.profile };
    this.profile = {
      ...this.profile,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    this.notify();

    try {
      const { data, error } = await this.supabase
        .from("user_profiles")
        .update(updates)
        .eq("user_id", this.userId)
        .select()
        .single();

      if (error) throw error;

      this.profile = this.normalizeProfile(data);
      cacheUtils.setCachedProfile(this.userId, this.profile);

      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully",
      });

      return { success: true, data: this.profile };
    } catch (error) {
      // Rollback optimistic update
      this.profile = originalProfile;
      this.notify();

      const errorMessage = error instanceof Error ? error.message : "Failed to update profile";
      toast({
        title: "Failed to update profile",
        description: errorMessage,
      });

      throw error;
    }
  }
  async uploadAvatar(file: File) {
    if (!this.userId) throw new Error("User not authenticated");

    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${this.userId}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await this.supabase.storage.from("avatars").upload(filePath, file);

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = this.supabase.storage.from("avatars").getPublicUrl(filePath);

      await this.updateProfile({ avatar_url: publicUrl });

      return { success: true, url: publicUrl };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to upload avatar";
      toast({
        title: "Failed to upload avatar",
        description: errorMessage,
      });

      throw error;
    }
  }
  async checkUsernameAvailability(username: string) {
    if (!this.userId) return { available: false, error: "User not authenticated" };

    try {
      const { data, error } = await this.supabase
        .from("user_profiles")
        .select("id")
        .eq("username", username)
        .neq("user_id", this.userId)
        .single();

      if (error && error.code === "PGRST116") {
        return { available: true, error: null };
      }

      if (error) {
        return { available: false, error: error.message };
      }

      return { available: false, error: null };
    } catch (err) {
      return {
        available: false,
        error: err instanceof Error ? err.message : "Failed to check username",
      };
    }
  }
  // Getters
  getProfile(): UserProfile | null {
    return this.profile;
  }

  getLoading(): boolean {
    return this.loading;
  }

  getError(): string | null {
    return this.error;
  }

  cleanup() {
    if (this.realtimeSubscription) {
      this.realtimeSubscription.unsubscribe();
      this.realtimeSubscription = null;
    }
    this.subscribers.clear();
  }
}