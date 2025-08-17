"use client";

import type { Task } from "@/lib/supabase/types";
import React from "react";
import { TaskCard } from "./TaskCard";

interface KanbanColumnProps {
  title: string;
  tasks: Task[];
  onTaskDrop: (taskId: string, columnId: string) => void;
  columnId: string;
  icon: React.ReactNode;
  color: string;
  accentColor?: string;
  iconColor?: string;
}

export const KanbanColumn = React.memo(function KanbanColumn({
  title,
  tasks,
  onTaskDrop,
  columnId,
  icon,
  color,
  accentColor = "border-border",
  iconColor = "text-muted-foreground",
}: KanbanColumnProps) {
  const [isDragOver, setIsDragOver] = React.useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const taskId = e.dataTransfer.getData("text/plain");
    if (taskId) {
      onTaskDrop(taskId, columnId);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Column Header */}
      <div
        className={`
        rounded-t-xl border-2 ${accentColor} p-4 ${color}
        backdrop-blur-sm transition-all duration-200
      `}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`${iconColor} transition-colors`}>{icon}</div>
            <h3 className="font-semibold text-foreground tracking-tight">{title}</h3>
          </div>
          <span className="text-xs font-medium text-muted-foreground bg-background/60 px-2 py-1 rounded-full">
            {tasks.length}
          </span>
        </div>
      </div>

      {/* Tasks Container */}
      <div
        className={`
          flex-1 border-2 border-t-0 ${accentColor} rounded-b-xl p-4
          bg-background/50 backdrop-blur-sm transition-all duration-200
          ${isDragOver ? "bg-primary/5 border-primary/30 shadow-lg" : ""}
          max-h-[480px] overflow-y-auto
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          maxHeight: tasks.length > 4 ? '480px' : 'auto',
          minHeight: '200px'
        }}
      >
        {tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mb-2`}>
              <div className={iconColor}>{icon}</div>
            </div>
            <p className="text-sm text-muted-foreground font-medium">
              {columnId === "completed"
                ? "No completed tasks"
                : columnId === "important"
                  ? "No urgent tasks"
                  : columnId === "inProgress"
                    ? "No active tasks"
                    : "No pending tasks"}
            </p>
            <p className="text-xs text-muted-foreground/70 mt-1">
              {columnId === "completed" ? "Complete tasks to see them here" : "Drag tasks here to organize"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
          </div>
        )}

        {/* Drop Zone Indicator */}
        {isDragOver && tasks.length > 0 && (
          <div className="border-2 border-dashed border-primary/40 rounded-lg p-3 bg-primary/5 flex items-center justify-center animate-pulse">
            <p className="text-sm text-primary font-medium">Drop here</p>
          </div>
        )}
      </div>
    </div>
  );
});
