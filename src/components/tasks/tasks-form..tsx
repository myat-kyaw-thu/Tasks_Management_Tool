"use client";

import type React from "react";

import { SubtaskList } from "@/components/subtasks/subtask-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { useCategories } from "@/hooks/use-categories";
import { useSubtasks } from "@/hooks/use-subtasks";
import { taskValidation } from "@/lib/controllers/task.controller";
import type { TaskInsert, TaskUpdate, TaskWithCategory } from "@/lib/supabase/types";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { Calendar, FileText, Flag, Plus, Save, Tag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { InlineLoadingSpinner } from '../layout/loading-spinner';

interface TaskFormProps {
  task?: TaskWithCategory | null;
  onSubmit: (data: Omit<TaskInsert, "user_id"> | TaskUpdate) => Promise<{ success: boolean; error?: any; }>;
  onCancel: () => void;
  loading?: boolean;
  className?: string;
}

export function TaskForm({ task, onSubmit, onCancel, loading = false, className }: TaskFormProps) {
  const isEditing = !!task;
  const { categories } = useCategories();
  const { subtasks, createSubtask, updateSubtask, deleteSubtask, toggleSubtaskCompletion } = useSubtasks(
    task?.id || null,
  );

  const [formData, setFormData] = useState({
    title: task?.title || "",
    description: task?.description || "",
    category_id: task?.category_id || "none", // Updated default value to "none"
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Reset form when task changes
  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || "",
        category_id: task.category_id || "none", // Updated default value to "none"
        priority: task.priority,
        due_date: task.due_date || "",
      });
    }
  }, [task]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    const validation = taskValidation.validateTask(formData);
    if (!validation.isValid) {
      validation.errors.forEach((error, index) => {
        if (error.includes("Title")) {
          newErrors.title = error;
        } else if (error.includes("Description")) {
          newErrors.description = error;
        } else if (error.includes("due date")) {
          newErrors.due_date = error;
        } else if (error.includes("priority")) {
          newErrors.priority = error;
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (saving) return;

    if (!validateForm()) {
      return;
    }

    setSaving(true);
    try {
      const submitData = {
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        category_id: formData.category_id === "none" ? null : formData.category_id, // Updated to handle "none" value
        priority: formData.priority as "low" | "medium" | "high",
        due_date: formData.due_date || null,
      };

      const result = await onSubmit(submitData);
      if (result.success) {
        if (!isEditing) {
          // Reset form for new tasks
          setFormData({
            title: "",
            description: "",
            category_id: "none", // Updated default value to "none"
            priority: "medium",
            due_date: "",
          });
        }
      }
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const getTodayDate = () => {
    return format(new Date(), "yyyy-MM-dd");
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return format(tomorrow, "yyyy-MM-dd");
  };

  const getNextWeekDate = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return format(nextWeek, "yyyy-MM-dd");
  };

  // Add subtask handlers
  const handleCreateSubtask = async (title: string) => {
    if (!task?.id) return { success: false, error: "Task not found" };
    return await createSubtask({ task_id: task.id, title });
  };

  const handleUpdateSubtask = async (subtask: any) => {
    return await updateSubtask(subtask.id, { title: subtask.title });
  };

  const handleDeleteSubtask = async (subtaskId: string) => {
    return await deleteSubtask(subtaskId);
  };

  const handleToggleSubtask = async (subtaskId: string) => {
    return await toggleSubtaskCompletion(subtaskId);
  };

  return (
    <Card className={cn("w-full max-w-2xl", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{isEditing ? "Edit Task" : "Create New Task"}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">Title *</Label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="title"
                placeholder="Enter task title..."
                value={formData.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className={cn("pl-10", errors.title && "border-destructive")}
                disabled={saving}
                maxLength={255}
              />
            </div>
            {errors.title && <p className="text-sm text-destructive">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder="Add a description..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={cn("min-h-[100px] resize-none", errors.description && "border-destructive")}
              disabled={saving}
              maxLength={1000}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              {errors.description && <span className="text-destructive">{errors.description}</span>}
              <span className="ml-auto">{formData.description.length}/1000</span>
            </div>
          </div>

          <Separator />

          {/* Task Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <div className="relative">
                <Tag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.category_id}
                  onValueChange={(value) => handleInputChange("category_id", value)}
                  disabled={saving}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No category</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <div className={cn("w-3 h-3 rounded-full", `category-${category.color}`)} />
                          <span>{category.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <div className="relative">
                <Flag className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                <Select
                  value={formData.priority}
                  onValueChange={(value) => handleInputChange("priority", value)}
                  disabled={saving}
                >
                  <SelectTrigger className="pl-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-success" />
                        <span>Low</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="medium">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-warning" />
                        <span>Medium</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="high">
                      <div className="flex items-center gap-2">
                        <Flag className="h-3 w-3 text-destructive" />
                        <span>High</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {errors.priority && <p className="text-sm text-destructive">{errors.priority}</p>}
            </div>
          </div>

          {/* Due Date */}
          <div className="space-y-2">
            <Label htmlFor="due_date">Due Date</Label>
            <div className="space-y-2">
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="due_date"
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange("due_date", e.target.value)}
                  className={cn("pl-10", errors.due_date && "border-destructive")}
                  disabled={saving}
                  min={getTodayDate()}
                />
              </div>

              {/* Quick Date Buttons */}
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange("due_date", getTodayDate())}
                  disabled={saving}
                >
                  Today
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange("due_date", getTomorrowDate())}
                  disabled={saving}
                >
                  Tomorrow
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange("due_date", getNextWeekDate())}
                  disabled={saving}
                >
                  Next Week
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleInputChange("due_date", "")}
                  disabled={saving}
                >
                  Clear
                </Button>
              </div>
            </div>
            {errors.due_date && <p className="text-sm text-destructive">{errors.due_date}</p>}
          </div>

          {isEditing && (
            <>
              <Separator />
              <div className="space-y-2">
                <Label>Subtasks</Label>
                <SubtaskList
                  taskId={task.id}
                  subtasks={subtasks}
                  onToggleComplete={handleToggleSubtask}
                  onEdit={handleUpdateSubtask}
                  onDelete={handleDeleteSubtask}
                  onCreate={handleCreateSubtask}
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={saving} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={saving || !formData.title.trim()} className="flex-1">
              {saving ? (
                <>
                  <InlineLoadingSpinner className="mr-2" />
                  {isEditing ? "Updating..." : "Creating..."}
                </>
              ) : (
                <>
                  {isEditing ? <Save className="h-4 w-4 mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                  {isEditing ? "Update Task" : "Create Task"}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
