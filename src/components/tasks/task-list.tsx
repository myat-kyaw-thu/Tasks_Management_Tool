"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { TaskWithCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { CheckCircle, Plus } from 'lucide-react';
import { useMemo, useState } from "react";
import { InlineErrorFallback } from "../layout/error-boundary";
import { TaskDeleteDialog } from "./task-delete-dialog";
import { TaskItem } from "./task-item";

interface TaskListProps {
  tasks: TaskWithCategory[];
  loading?: boolean;
  error?: Error | null;
  onToggleComplete?: (taskId: string) => Promise<{ success: boolean; error?: any; }>;
  onEdit?: (task: TaskWithCategory) => void;
  onDelete?: (taskId: string, permanent: boolean) => Promise<{ success: boolean; error?: any; }>;
  onDuplicate?: (taskId: string) => Promise<{ success: boolean; error?: any; }>;
  onRetry?: () => void;
  emptyState?: {
    title: string;
    description: string;
    action?: {
      label: string;
      onClick: () => void;
    };
  };
  className?: string;
}

export function TaskList({
  tasks,
  loading = false,
  error = null,
  onToggleComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onRetry,
  emptyState,
  className,
}: TaskListProps) {
  const [deleteTask, setDeleteTask] = useState<TaskWithCategory | null>(null);

  // Deduplicate tasks and ensure unique keys
  const uniqueTasks = useMemo(() => {
    const seen = new Set<string>();
    const deduplicatedTasks: { task: TaskWithCategory; uniqueKey: string; }[] = [];

    tasks.forEach((task, index) => {
      // Create a unique identifier combining id and index to handle duplicates
      const uniqueKey = `${task.id}-${index}`;

      if (!seen.has(task.id)) {
        seen.add(task.id);
        deduplicatedTasks.push({ task, uniqueKey });
      } else {
        // If duplicate ID found, log warning and create unique version
        console.warn(`Duplicate task ID found: ${task.id}. This may indicate a data issue.`);
        deduplicatedTasks.push({ task, uniqueKey });
      }
    });

    return deduplicatedTasks;
  }, [tasks]);

  const handleToggleComplete = async (taskId: string) => {
    if (onToggleComplete) {
      await onToggleComplete(taskId);
    }
  };

  const handleEdit = (task: TaskWithCategory) => {
    onEdit?.(task);
  };

  const handleDelete = (task: TaskWithCategory) => {
    setDeleteTask(task);
  };

  const handleDeleteConfirm = async (taskId: string, permanent: boolean) => {
    if (onDelete) {
      const result = await onDelete(taskId, permanent);
      return result;
    }
    return { success: false };
  };

  const handleDuplicate = async (task: TaskWithCategory) => {
    if (onDuplicate) {
      await onDuplicate(task.id);
    }
  };

  if (loading) {
    return (
      <div className={cn("space-y-3", className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <Card
            key={i}
            className="border-0 bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm animate-pulse"
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="h-4 w-4 bg-muted/50 rounded mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted/50 rounded w-3/4" />
                  <div className="h-3 bg-muted/30 rounded w-1/2" />
                  <div className="flex gap-2 mt-2">
                    <div className="h-5 bg-muted/40 rounded-full w-16" />
                    <div className="h-5 bg-muted/40 rounded-full w-12" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
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

  if (uniqueTasks.length === 0) {
    return (
      <div className={cn("space-y-4", className)}>
        <EmptyState
          title={emptyState?.title || "No tasks found"}
          description={emptyState?.description || "Create your first task to get started."}
          action={emptyState?.action}
        />
      </div>
    );
  }

  return (
    <>
      <div className={cn("space-y-2", className)}>
        {uniqueTasks.map(({ task, uniqueKey }, index) => (
          <TaskItem
            key={uniqueKey}
            task={task}
            onToggleComplete={() => handleToggleComplete(task.id)}
            onEdit={() => handleEdit(task)}
            onDelete={() => handleDelete(task)}
            onDuplicate={() => handleDuplicate(task)}
          />
        ))}
      </div>

      <TaskDeleteDialog
        task={deleteTask}
        open={!!deleteTask}
        onOpenChange={(open) => !open && setDeleteTask(null)}
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}

interface EmptyStateProps {
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
}

function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="border-0 bg-gradient-to-br from-muted/30 to-muted/10 backdrop-blur-sm">
      <CardContent className="flex flex-col items-center justify-center py-16 text-center">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-full blur-md" />
          <div className="relative mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm ring-1 ring-border/50">
            <CheckCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <div className="absolute -top-1 -right-1">
            <div className="h-4 w-4 rounded-full bg-primary/20 animate-pulse" />
          </div>
        </div>

        <div className="space-y-3 max-w-sm">
          <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
            {title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
        </div>

        {action && (
          <Button
            onClick={action.onClick}
            className="mt-6 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <Plus className="mr-2 h-4 w-4" />
            {action.label}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
