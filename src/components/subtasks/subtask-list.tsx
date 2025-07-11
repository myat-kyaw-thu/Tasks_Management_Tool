"use client";

import type React from "react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import type { Subtask } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { Edit, GripVertical, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { LoadingSpinner } from '../layout/loading-spinner';

interface SubtaskListProps {
  taskId: string;
  subtasks: Subtask[];
  loading?: boolean;
  onToggleComplete?: (subtaskId: string) => Promise<{ success: boolean; error?: any; }>;
  onEdit?: (subtask: Subtask) => Promise<{ success: boolean; error?: any; }>;
  onDelete?: (subtaskId: string) => Promise<{ success: boolean; error?: any; }>;
  onCreate?: (title: string) => Promise<{ success: boolean; error?: any; }>;
  embedded?: boolean; // Add this prop to handle embedded mode
  className?: string;
}

export function SubtaskList({
  taskId,
  subtasks,
  loading = false,
  onToggleComplete,
  onEdit,
  onDelete,
  onCreate,
  embedded = false, // Default to false
  className,
}: SubtaskListProps) {
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const handleCreateSubtask = async () => {
    if (!newSubtaskTitle.trim() || creating || !onCreate) return;

    setCreating(true);
    try {
      const result = await onCreate(newSubtaskTitle.trim());
      if (result.success) {
        setNewSubtaskTitle("");
      }
    } finally {
      setCreating(false);
    }
  };

  const handleToggleComplete = async (subtaskId: string) => {
    if (onToggleComplete) {
      await onToggleComplete(subtaskId);
    }
  };

  const handleStartEdit = (subtask: Subtask) => {
    setEditingId(subtask.id);
    setEditTitle(subtask.title);
  };

  const handleSaveEdit = async (subtask: Subtask) => {
    if (!editTitle.trim() || !onEdit) return;

    const result = await onEdit({ ...subtask, title: editTitle.trim() });
    if (result.success) {
      setEditingId(null);
      setEditTitle("");
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle("");
  };

  const handleDelete = async (subtaskId: string) => {
    if (onDelete) {
      await onDelete(subtaskId);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  if (loading) {
    return (
      <div className={cn("py-4", className)}>
        <LoadingSpinner size="sm" text="Loading subtasks..." />
      </div>
    );
  }

  const completedCount = subtasks.filter((s) => s.is_completed).length;
  const totalCount = subtasks.length;

  return (
    <div className={cn("space-y-3", className)}>
      {/* Progress indicator */}
      {totalCount > 0 && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>
            Subtasks: {completedCount}/{totalCount}
          </span>
          <div className="flex-1 bg-muted rounded-full h-2">
            <div
              className="bg-primary rounded-full h-2 transition-all"
              style={{ width: `${(completedCount / totalCount) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtask list */}
      <div className="space-y-2">
        {subtasks.map((subtask) => (
          <div
            key={subtask.id}
            className={cn(
              "flex items-center gap-2 p-2 rounded-md border bg-card hover:bg-muted/50 transition-colors group",
              subtask.is_completed && "opacity-60",
            )}
          >
            <div className="cursor-grab text-muted-foreground hover:text-foreground">
              <GripVertical className="h-4 w-4" />
            </div>

            <Checkbox
              checked={subtask.is_completed}
              onCheckedChange={() => handleToggleComplete(subtask.id)}
              className="data-[state=checked]:bg-success data-[state=checked]:border-success"
            />

            <div className="flex-1 min-w-0">
              {editingId === subtask.id ? (
                <div className="flex gap-2">
                  <Input
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    className="h-8"
                    autoFocus
                    onBlur={() => handleSaveEdit(subtask)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSaveEdit(subtask);
                      } else if (e.key === "Escape") {
                        handleCancelEdit();
                      }
                    }}
                  />
                </div>
              ) : (
                <span
                  className={cn("text-sm cursor-pointer", subtask.is_completed && "line-through text-muted-foreground")}
                  onClick={() => handleStartEdit(subtask)}
                >
                  {subtask.title}
                </span>
              )}
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreHorizontal className="h-4 w-4" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleStartEdit(subtask)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleDelete(subtask.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}
      </div>

      {/* Add new subtask - NO FORM WRAPPER when embedded */}
      <div className="flex gap-2">
        <Input
          placeholder="Add a subtask..."
          value={newSubtaskTitle}
          onChange={(e) => setNewSubtaskTitle(e.target.value)}
          className="h-9"
          disabled={creating}
          onKeyDown={(e) => handleKeyDown(e, handleCreateSubtask)}
        />
        <Button size="sm" disabled={!newSubtaskTitle.trim() || creating} onClick={handleCreateSubtask}>
          {creating ? <LoadingSpinner size="sm" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
