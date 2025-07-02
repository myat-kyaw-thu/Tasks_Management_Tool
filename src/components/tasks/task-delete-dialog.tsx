"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { TaskWithCategory } from "@/lib/supabase/types";
import { AlertTriangle, Trash2 } from "lucide-react";
import { useState } from "react";
import { InlineLoadingSpinner } from '../layout/loading-spinner';

interface TaskDeleteDialogProps {
  task: TaskWithCategory | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (taskId: string, permanent: boolean) => Promise<{ success: boolean; error?: any; }>;
}

export function TaskDeleteDialog({ task, open, onOpenChange, onConfirm }: TaskDeleteDialogProps) {
  const [permanent, setPermanent] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (!task || deleting) return;

    setDeleting(true);
    try {
      const result = await onConfirm(task.id, permanent);
      if (result.success) {
        onOpenChange(false);
        setPermanent(false);
      }
    } finally {
      setDeleting(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!deleting) {
      onOpenChange(newOpen);
      if (!newOpen) {
        setPermanent(false);
      }
    }
  };

  if (!task) return null;

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
            <div>
              <AlertDialogTitle>Delete Task</AlertDialogTitle>
              <AlertDialogDescription className="text-left">
                Are you sure you want to delete "{task.title}"?
              </AlertDialogDescription>
            </div>
          </div>
        </AlertDialogHeader>

        <div className="py-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="permanent"
              checked={permanent}
              onCheckedChange={(checked) => setPermanent(checked as boolean)}
              disabled={deleting}
            />
            <label
              htmlFor="permanent"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Delete permanently
            </label>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {permanent
              ? "This action cannot be undone. The task will be permanently deleted."
              : "The task will be moved to trash and can be restored later."}
          </p>
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={deleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {deleting ? (
              <>
                <InlineLoadingSpinner className="mr-2" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                {permanent ? "Delete Permanently" : "Delete"}
              </>
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
