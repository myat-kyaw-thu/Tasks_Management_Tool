"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Task } from "@/lib/supabase/types";
import { Calendar, Clock, Star } from "lucide-react";
import React from "react";

interface TaskCardProps {
  task: Task;
  isDragging?: boolean;
}

export const TaskCard = React.memo(function TaskCard({ task, isDragging = false }: TaskCardProps) {
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData("text/plain", task.id);
    e.dataTransfer.effectAllowed = "move";
  };



  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) {
      return "Today";
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return "Tomorrow";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <Card
      draggable
      onDragStart={handleDragStart}
      className={`
        cursor-move transition-all duration-200 hover:shadow-md hover:scale-[1.02]
        ${isDragging ? "opacity-50 rotate-1 scale-105 shadow-lg" : ""}
        border-l-4 ${task.priority === "high" ? "border-l-red-400" : task.priority === "medium" ? "border-l-yellow-400" : "border-l-green-400"}
      `}
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          {/* Title */}
          <h4 className="font-medium text-sm leading-tight text-foreground">
            {task.title.length > 45 ? `${task.title.substring(0, 45)}...` : task.title}
          </h4>

          {/* Description - Only show if short */}
          {task.description && task.description.length <= 60 && (
            <p className="text-xs text-muted-foreground leading-relaxed">
              {task.description}
            </p>
          )}

          {/* Metadata Row */}
          <div className="flex items-center justify-between pt-1">
            {/* Priority Indicator */}
            <div className="flex items-center gap-1">
              {task.priority === "high" && (
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3 text-red-500 fill-red-500" />
                  <span className="text-xs font-medium text-red-600">High</span>
                </div>
              )}
              {task.priority === "medium" && (
                <span className="text-xs font-medium text-yellow-600">Medium</span>
              )}
              {task.priority === "low" && (
                <span className="text-xs font-medium text-green-600">Low</span>
              )}
            </div>

            {/* Due Date */}
            {task.due_date && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                {task.due_date === new Date().toISOString().split("T")[0] ? (
                  <Clock className="w-3 h-3 text-orange-500" />
                ) : (
                  <Calendar className="w-3 h-3" />
                )}
                <span className="font-medium">{formatDate(task.due_date)}</span>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
