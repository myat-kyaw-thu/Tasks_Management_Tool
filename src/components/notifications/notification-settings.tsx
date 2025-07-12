"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useNotifications } from "@/hooks/use-notifications";
import { AlertTriangle, ArrowLeft, Bell, CheckCircle, Clock, FileText } from "lucide-react";
import { useState } from "react";

interface NotificationSettingsProps {
  onClose: () => void;
}

export function NotificationSettings({ onClose }: NotificationSettingsProps) {
  const { preferences, updatePreferences, requestPermission, permissionGranted } = useNotifications();
  const [localPreferences, setLocalPreferences] = useState(preferences);

  const handleSave = () => {
    updatePreferences(localPreferences);
    onClose();
  };

  const handlePermissionRequest = async () => {
    await requestPermission();
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">Notification Settings</h3>
      </div>

      <Separator />

      {/* Browser Permission */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Bell className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Browser Notifications</Label>
        </div>

        {!permissionGranted ? (
          <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 dark:border-orange-800 dark:bg-orange-900/20">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-600 dark:text-orange-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-xs text-orange-800 dark:text-orange-200">
                  Browser notifications are disabled. Enable them to receive task reminders.
                </p>
                <Button size="sm" onClick={handlePermissionRequest} className="h-7 text-xs">
                  Enable Notifications
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-green-200 bg-green-50 p-3 dark:border-green-800 dark:bg-green-900/20">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
              <p className="text-xs text-green-800 dark:text-green-200">Browser notifications are enabled</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between">
          <Label htmlFor="browser-notifications" className="text-sm">
            Show browser notifications
          </Label>
          <Switch
            id="browser-notifications"
            checked={localPreferences.browserNotifications}
            onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, browserNotifications: checked }))}
            disabled={!permissionGranted}
          />
        </div>
      </div>

      <Separator />

      {/* Task Notifications */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Task Notifications</Label>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-reminders" className="text-sm">
                Task reminders
              </Label>
              <p className="text-xs text-muted-foreground">Get notified about upcoming and overdue tasks</p>
            </div>
            <Switch
              id="task-reminders"
              checked={localPreferences.taskReminders}
              onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, taskReminders: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="due-date-alerts" className="text-sm">
                Due date alerts
              </Label>
              <p className="text-xs text-muted-foreground">Get alerted when tasks are due or overdue</p>
            </div>
            <Switch
              id="due-date-alerts"
              checked={localPreferences.dueDateAlerts}
              onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, dueDateAlerts: checked }))}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="task-completions" className="text-sm">
                Task completions
              </Label>
              <p className="text-xs text-muted-foreground">Get notified when tasks are completed</p>
            </div>
            <Switch
              id="task-completions"
              checked={localPreferences.taskCompletions}
              onCheckedChange={(checked) => setLocalPreferences((prev) => ({ ...prev, taskCompletions: checked }))}
            />
          </div>
        </div>
      </div>

      <Separator />

      {/* Reminder Timing */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-muted-foreground" />
          <Label className="text-sm font-medium">Reminder Timing</Label>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm">Remind me before due date</Label>
              <span className="text-sm font-medium text-muted-foreground">
                {localPreferences.reminderMinutes === 0
                  ? "At due time"
                  : localPreferences.reminderMinutes < 60
                    ? `${localPreferences.reminderMinutes} min`
                    : localPreferences.reminderMinutes === 60
                      ? "1 hour"
                      : `${Math.floor(localPreferences.reminderMinutes / 60)} hours`}
              </span>
            </div>
            <Slider
              value={[localPreferences.reminderMinutes]}
              onValueChange={([value]) => setLocalPreferences((prev) => ({ ...prev, reminderMinutes: value }))}
              max={1440}
              min={0}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Now</span>
              <span>15 min</span>
              <span>1 hour</span>
              <span>1 day</span>
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Actions */}
      <div className="flex items-center gap-2 pt-2">
        <Button onClick={handleSave} className="flex-1">
          Save Settings
        </Button>
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
