"use client";

import { useTasks } from "@/hooks/use-tasks";
import type { Task } from "@/lib/supabase/types";
import { AlertCircle, CheckCircle, Clock, ListTodo, Loader2, Star } from 'lucide-react';
import React, { useCallback, useMemo } from "react";
import { KanbanColumn } from "./KanbanColumn";

export const KanbanBoard = React.memo(function KanbanBoard() {
  const { tasks, updateTask, loading, error } = useTasks({
    autoFetch: true,
    enableRealtime: true,
  });

  // Categorize tasks into columns based on existing properties
  const categorizedTasks = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];

    // First, separate completed from non-completed
    const completedTasks = tasks.filter((task) => task.is_completed);
    const activeTasks = tasks.filter((task) => !task.is_completed);

    // Then categorize active tasks with clear priority
    const importantTasks = activeTasks.filter((task) => task.priority === "high");
    const inProgressTasks = activeTasks.filter(
      (task) =>
        task.priority !== "high" &&
        task.due_date &&
        (task.due_date === today || task.due_date < today)
    );
    const todoTasks = activeTasks.filter(
      (task) =>
        task.priority !== "high" &&
        (!task.due_date || task.due_date > today)
    );

    return {
      todo: todoTasks,
      important: importantTasks,
      inProgress: inProgressTasks,
      completed: completedTasks,
    };
  }, [tasks]);

  // Handle task drop with optimistic updates using existing updateTask
  const handleTaskDrop = useCallback(
    async (taskId: string, columnId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return;

      let updates: Partial<Task> = {};

      switch (columnId) {
        case "todo":
          updates = {
            is_completed: false,
            priority: task.priority === "high" ? "medium" : task.priority,
            completed_at: null,
            // Clear due_date to ensure it goes to todo, not inProgress
            due_date: null,
          };
          break;
        case "important":
          updates = {
            is_completed: false,
            priority: "high",
            completed_at: null,
          };
          break;
        case "inProgress":
          updates = {
            is_completed: false,
            completed_at: null,
            // Keep existing priority and due_date
          };
          break;
        case "completed":
          updates = {
            is_completed: true,
            completed_at: new Date().toISOString(),
          };
          break;
        default:
          return;
      }

      try {
        await updateTask(taskId, updates);
      } catch (error) {
        console.error("Failed to update task:", error);
        // Error handling is managed by the useTasks hook
      }
    },
    [tasks, updateTask]
  );

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8">
          <div className="relative">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <div className="absolute inset-0 w-8 h-8 border-2 border-primary/20 rounded-full animate-pulse" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="font-medium text-foreground">Loading your tasks</h3>
            <p className="text-sm text-muted-foreground">Organizing your workflow...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 p-8 max-w-md text-center">
          <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-destructive" />
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold text-foreground">Unable to load tasks</h3>
            <p className="text-sm text-muted-foreground">
              We encountered an issue while fetching your tasks. Please try refreshing the page.
            </p>
            <p className="text-xs text-muted-foreground/80 font-mono bg-muted px-2 py-1 rounded">
              {error}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      {/* Header Section */}
      <div className="px-4 sm:px-6 lg:px-8 py-6 border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Task Board</h1>
            <p className="text-sm text-muted-foreground">
              Manage and track your tasks across different stages
            </p>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="hidden sm:inline">To Do</span>
              <span className="font-medium">{categorizedTasks.todo.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="hidden sm:inline">Important</span>
              <span className="font-medium">{categorizedTasks.important.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="hidden sm:inline">In Progress</span>
              <span className="font-medium">{categorizedTasks.inProgress.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="hidden sm:inline">Completed</span>
              <span className="font-medium">{categorizedTasks.completed.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="p-4 sm:p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 min-h-[600px]">
          <KanbanColumn
            title="To Do"
            tasks={categorizedTasks.todo}
            onTaskDrop={handleTaskDrop}
            columnId="todo"
            icon={<ListTodo className="w-4 h-4" />}
            color="bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30"
            accentColor="border-blue-200 dark:border-blue-800"
            iconColor="text-blue-600 dark:text-blue-400"
          />

          <KanbanColumn
            title="Important"
            tasks={categorizedTasks.important}
            onTaskDrop={handleTaskDrop}
            columnId="important"
            icon={<Star className="w-4 h-4" />}
            color="bg-gradient-to-br from-amber-50 to-amber-100/50 dark:from-amber-950/50 dark:to-amber-900/30"
            accentColor="border-amber-200 dark:border-amber-800"
            iconColor="text-amber-600 dark:text-amber-400"
          />

          <KanbanColumn
            title="In Progress"
            tasks={categorizedTasks.inProgress}
            onTaskDrop={handleTaskDrop}
            columnId="inProgress"
            icon={<Clock className="w-4 h-4" />}
            color="bg-gradient-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/50 dark:to-orange-900/30"
            accentColor="border-orange-200 dark:border-orange-800"
            iconColor="text-orange-600 dark:text-orange-400"
          />

          <KanbanColumn
            title="Completed"
            tasks={categorizedTasks.completed}
            onTaskDrop={handleTaskDrop}
            columnId="completed"
            icon={<CheckCircle className="w-4 h-4" />}
            color="bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950/50 dark:to-green-900/30"
            accentColor="border-green-200 dark:border-green-800"
            iconColor="text-green-600 dark:text-green-400"
          />
        </div>
      </div>
    </div>
  );
});
