"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TaskWithCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { format, isPast, isToday, isTomorrow } from "date-fns";
import { Calendar, CheckCircle2, Copy, Edit, Flag, MoreHorizontal, Tag, Trash2 } from "lucide-react";
import { useState } from "react";

interface TaskItemProps {
  task: TaskWithCategory;
  onToggleComplete?: (taskId: string, completed: boolean) => void;
  onEdit?: (task: TaskWithCategory) => void;
  onDelete?: (taskId: string) => void;
  onDuplicate?: (task: TaskWithCategory) => void;
  className?: string;
}

export function TaskItem({ task, onToggleComplete, onEdit, onDelete, onDuplicate, className }: TaskItemProps) {
  const [isCompleting, setIsCompleting] = useState(false);

  const handleToggleComplete = async () => {
    if (isCompleting) return;

    setIsCompleting(true);
    try {
      await onToggleComplete?.(task.id, !task.is_completed);
    } finally {
      setIsCompleting(false);
    }
  };

  const formatDueDate = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    return format(date, "MMM d");
  };

  const getDueDateColor = (dueDate: string) => {
    const date = new Date(dueDate);
    if (isPast(date) && !isToday(date)) return "text-rose-600 dark:text-rose-400";
    if (isToday(date)) return "text-amber-600 dark:text-amber-400";
    return "text-muted-foreground";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "text-rose-600 dark:text-rose-400";
      case "medium":
        return "text-amber-600 dark:text-amber-400";
      case "low":
        return "text-emerald-600 dark:text-emerald-400";
      default:
        return "text-muted-foreground";
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800";
      case "medium":
        return "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800";
      case "low":
        return "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800";
      default:
        return "bg-muted text-muted-foreground border-muted-foreground/20";
    }
  };

  const getPriorityIcon = (priority: string) => {
    return <Flag className={cn("h-3 w-3", getPriorityColor(priority))} />;
  };

  const isOverdue = task.due_date && isPast(new Date(task.due_date)) && !task.is_completed;

  return (
    <Card
      className={cn(
        "group transition-all duration-300 hover:shadow-lg",
        "border-0 bg-gradient-to-br from-background via-background to-muted/20 backdrop-blur-sm",
        "ring-1 ring-border/50 hover:ring-border/80",
        task.is_completed && "opacity-70 hover:opacity-80",
        isOverdue &&
        "ring-rose-200 dark:ring-rose-800 bg-gradient-to-br from-rose-50/50 to-background dark:from-rose-950/20",
        className,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Enhanced Checkbox */}
          <div className="flex items-center pt-0.5">
            <div className="relative">
              <Checkbox
                checked={task.is_completed}
                onCheckedChange={handleToggleComplete}
                disabled={isCompleting}
                className={cn(
                  "transition-all duration-200 hover:scale-110",
                  "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500",
                  "data-[state=checked]:text-white shadow-sm",
                  isCompleting && "animate-pulse",
                )}
              />
              {isCompleting && <div className="absolute inset-0 rounded-sm bg-primary/20 animate-pulse" />}
            </div>
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    "font-semibold text-sm leading-5 break-words transition-all duration-200",
                    task.is_completed
                      ? "line-through text-muted-foreground"
                      : "text-foreground group-hover:text-foreground/90",
                  )}
                >
                  {task.title}
                </h3>

                {task.description && (
                  <p
                    className={cn(
                      "text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed transition-all duration-200",
                      task.is_completed && "line-through opacity-70",
                    )}
                  >
                    {task.description}
                  </p>
                )}
              </div>

              {/* Enhanced Actions Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "h-8 w-8 p-0 transition-all duration-200",
                      "opacity-0 group-hover:opacity-100 hover:bg-primary/10 hover:scale-110",
                      "backdrop-blur-sm",
                    )}
                  >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="bg-background/95 backdrop-blur-md border-border/50 shadow-xl"
                >
                  <DropdownMenuItem onClick={() => onEdit?.(task)} className="focus:bg-primary/10 cursor-pointer">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => onDuplicate?.(task)} className="focus:bg-primary/10 cursor-pointer">
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border/50" />
                  <DropdownMenuItem
                    onClick={() => onDelete?.(task.id)}
                    className="text-rose-600 focus:text-rose-600 focus:bg-rose-50 dark:focus:bg-rose-950/50 cursor-pointer"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Enhanced Task Meta */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {/* Category Badge */}
              {task.category && (
                <Badge
                  variant="outline"
                  className="text-xs bg-background/50 backdrop-blur-sm border-border/50 hover:bg-primary/10 transition-colors duration-200"
                >
                  <Tag className="h-3 w-3 mr-1.5" />
                  {task.category.name}
                </Badge>
              )}

              {/* Priority Badge */}
              {task.priority !== "low" && (
                <Badge
                  variant="outline"
                  className={cn("text-xs transition-colors duration-200", getPriorityBadgeColor(task.priority))}
                >
                  {getPriorityIcon(task.priority)}
                  <span className="ml-1.5 capitalize font-medium">{task.priority}</span>
                </Badge>
              )}

              {/* Due Date */}
              {task.due_date && (
                <div
                  className={cn(
                    "flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors duration-200",
                    "bg-background/50 backdrop-blur-sm border border-border/30",
                    isOverdue && "bg-rose-50/50 border-rose-200/50 dark:bg-rose-950/30 dark:border-rose-800/50",
                  )}
                >
                  <Calendar className={cn("h-3 w-3", getDueDateColor(task.due_date))} />
                  <span className={cn("text-xs font-medium", getDueDateColor(task.due_date))}>
                    {formatDueDate(task.due_date)}
                  </span>
                </div>
              )}

              {/* Subtasks Progress */}
              {task.subtasks && task.subtasks.length > 0 && (
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 backdrop-blur-sm border border-border/30">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {task.subtasks.filter((st) => st.is_completed).length}/{task.subtasks.length}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
