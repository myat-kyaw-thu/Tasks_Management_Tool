"use client";

import { createClient } from "@/lib/supabase/client";
import type { UserProfile } from "@/types/database.types";


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
}