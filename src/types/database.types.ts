export type Json = string | number | boolean | null | { [key: string]: Json | undefined; } | Json[];

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          color: "blue" | "green" | "yellow" | "red" | "purple" | "pink" | "indigo" | "gray" | "orange" | "teal";
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          color?: "blue" | "green" | "yellow" | "red" | "purple" | "pink" | "indigo" | "gray" | "orange" | "teal";
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          color?: "blue" | "green" | "yellow" | "red" | "purple" | "pink" | "indigo" | "gray" | "orange" | "teal";
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      email_logs: {
        Row: {
          id: string;
          recipient: string;
          subject: string;
          template: string;
          status: string;
          external_id: string | null;
          error_message: string | null;
          sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          recipient: string;
          subject: string;
          template: string;
          status?: string;
          external_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          recipient?: string;
          subject?: string;
          template?: string;
          status?: string;
          external_id?: string | null;
          error_message?: string | null;
          sent_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      subtasks: {
        Row: {
          id: string;
          task_id: string;
          title: string;
          is_completed: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          title: string;
          is_completed?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          title?: string;
          is_completed?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "subtasks_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
        ];
      };
      task_activities: {
        Row: {
          id: string;
          task_id: string;
          user_id: string;
          action: string;
          old_values: Json | null;
          new_values: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          task_id: string;
          user_id: string;
          action: string;
          old_values?: Json | null;
          new_values?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          task_id?: string;
          user_id?: string;
          action?: string;
          old_values?: Json | null;
          new_values?: Json | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "task_activities_task_id_fkey";
            columns: ["task_id"];
            isOneToOne: false;
            referencedRelation: "tasks";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "task_activities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      tasks: {
        Row: {
          id: string;
          user_id: string;
          category_id: string | null;
          title: string;
          description: string | null;
          is_completed: boolean;
          priority: "low" | "medium" | "high";
          due_date: string | null;
          completed_at: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
          deleted_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id?: string | null;
          title: string;
          description?: string | null;
          is_completed?: boolean;
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          category_id?: string | null;
          title?: string;
          description?: string | null;
          is_completed?: boolean;
          priority?: "low" | "medium" | "high";
          due_date?: string | null;
          completed_at?: string | null;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
          deleted_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "tasks_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "tasks_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles: {
        Row: {
          id: string;
          user_id: string;
          username: string | null;
          age: number | null;
          bio: string | null;
          date_of_birth: string | null;
          avatar_url: string | null;
          social_links: Record<string, string>;
          status: string;
          created_at: string;
          updated_at: string;
          email_notifications: boolean;
          daily_digest: boolean;
          task_reminders: boolean;
          reminder_hours: number;
        };
        Insert: {
          id?: string;
          user_id: string;
          username?: string | null;
          age?: number | null;
          bio?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          social_links?: Record<string, string>;
          status?: string;
          created_at?: string;
          updated_at?: string;
          email_notifications?: boolean;
          daily_digest?: boolean;
          task_reminders?: boolean;
          reminder_hours?: number;
        };
        Update: {
          id?: string;
          user_id?: string;
          username?: string | null;
          age?: number | null;
          bio?: string | null;
          date_of_birth?: string | null;
          avatar_url?: string | null;
          social_links?: Record<string, string>;
          status?: string;
          created_at?: string;
          updated_at?: string;
          email_notifications?: boolean;
          daily_digest?: boolean;
          task_reminders?: boolean;
          reminder_hours?: number;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: true;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never
    };
    Functions: {
      create_default_categories_for_user: {
        Args: {
          user_uuid: string;
        };
        Returns: undefined;
      };
      get_user_task_stats: {
        Args: {
          user_uuid: string;
        };
        Returns: {
          total_tasks: number;
          completed_tasks: number;
          pending_tasks: number;
          overdue_tasks: number;
          today_tasks: number;
        }[];
      };
    };
    Enums: {
      category_color: "blue" | "green" | "yellow" | "red" | "purple" | "pink" | "indigo" | "gray" | "orange" | "teal";
      task_priority: "low" | "medium" | "high";
      task_status: "todo" | "in_progress" | "completed" | "archived";
    };
    CompositeTypes: {
      [_ in never]: never
    };
  };
};

export type Tables<
  PublicTableNameOrOptions extends
  | keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  | { schema: keyof Database; },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database; }
  ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database; }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
    Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
  ? R
  : never
  : PublicTableNameOrOptions extends keyof (Database["public"]["Tables"] & Database["public"]["Views"])
  ? (Database["public"]["Tables"] & Database["public"]["Views"])[PublicTableNameOrOptions] extends {
    Row: infer R;
  }
  ? R
  : never
  : never;

export type TablesInsert<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database; },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database; }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database; }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I;
  }
  ? I
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Insert: infer I;
  }
  ? I
  : never
  : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends keyof Database["public"]["Tables"] | { schema: keyof Database; },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database; }
  ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database; }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U;
  }
  ? U
  : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
    Update: infer U;
  }
  ? U
  : never
  : never;

export type Enums<
  PublicEnumNameOrOptions extends keyof Database["public"]["Enums"] | { schema: keyof Database; },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database; }
  ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database; }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
  ? Database["public"]["Enums"][PublicEnumNameOrOptions]
  : never;

// ✅ Base types from database
export type Task = Tables<"tasks">;
export type TaskInsert = TablesInsert<"tasks">;
export type TaskUpdate = TablesUpdate<"tasks">;

export type Category = Tables<"categories">;
export type CategoryInsert = TablesInsert<"categories">;
export type CategoryUpdate = TablesUpdate<"categories">;

export type Subtask = Tables<"subtasks">;
export type SubtaskInsert = TablesInsert<"subtasks">;
export type SubtaskUpdate = TablesUpdate<"subtasks">;

export type TaskActivity = Tables<"task_activities">;
export type TaskPriority = Enums<"task_priority">;
export type CategoryColor = Enums<"category_color">;

export type EmailLog = Tables<"email_logs">;
export type EmailLogInsert = TablesInsert<"email_logs">;
export type EmailLogUpdate = TablesUpdate<"email_logs">;

export type UserProfile = Tables<"user_profiles">;
export type UserProfileInsert = TablesInsert<"user_profiles">;
export type UserProfileUpdate = TablesUpdate<"user_profiles">;


export interface TaskWithCategory extends Task {
  category: Category | null;
  subtasks?: Subtask[];
}

// ✅ Additional utility types for better type safety
export interface TaskFilters {
  completed?: boolean;
  priority?: TaskPriority;
  dueDate?: "today" | "upcoming" | "overdue" | string;
  categoryId?: string;
  search?: string;
  userId?: string;
  category?: string;
  due_date?: string;
}

