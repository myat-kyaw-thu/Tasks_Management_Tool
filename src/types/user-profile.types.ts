export type UserStatus =
  | "boring"
  | "trying_hard"
  | "living"
  | "having_fun"
  | "focused"
  | "relaxed"
  | "excited"
  | "tired"
  | "motivated"
  | "creative";

export interface SocialLinks {
  twitter?: string;
  linkedin?: string;
  github?: string;
  instagram?: string;
  website?: string;
  [key: string]: string | undefined;
}

export interface UserProfile {
  id: string;
  user_id: string;
  username: string | null;
  age: number | null;
  bio: string | null;
  date_of_birth: string | null;
  avatar_url: string | null;
  social_links: SocialLinks;
  status: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserProfileInsert {
  user_id: string;
  username?: string | null;
  age?: number | null;
  bio?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  social_links?: SocialLinks;
  status?: UserStatus;
}

export interface UserProfileUpdate {
  username?: string | null;
  age?: number | null;
  bio?: string | null;
  date_of_birth?: string | null;
  avatar_url?: string | null;
  social_links?: SocialLinks;
  status?: UserStatus;
}

export const STATUS_EMOJIS: Record<UserStatus, string> = {
  boring: "😴",
  trying_hard: "💪",
  living: "🌟",
  having_fun: "🎉",
  focused: "🎯",
  relaxed: "😌",
  excited: "🚀",
  tired: "😪",
  motivated: "🔥",
  creative: "🎨",
};

export const STATUS_LABELS: Record<UserStatus, string> = {
  boring: "Boring",
  trying_hard: "Trying Hard",
  living: "Living",
  having_fun: "Having Fun",
  focused: "Focused",
  relaxed: "Relaxed",
  excited: "Excited",
  tired: "Tired",
  motivated: "Motivated",
  creative: "Creative",
};
