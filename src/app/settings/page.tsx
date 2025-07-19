"use client";

import { UserProfileCard } from "@/components/profile/user-profile-card";
import { UserProfileEditor } from "@/components/profile/user-profile-editor";
import { ThemeToggle } from "@/components/theme-toggle";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/hooks/use-auth";
import { useNotifications } from "@/hooks/use-notifications";
import { toast } from "@/hooks/use-toast";
import { useUserProfile } from "@/hooks/use-user-profile";
import { performanceMonitoring } from "@/lib/performance/bundle-optimization";
import {
  ArrowLeft,
  Bell,
  Download,
  Key,
  Lock,
  LogOut,
  Mail,
  Palette,
  SettingsIcon,
  Shield,
  Trash2,
  Upload,
  User,
} from "lucide-react";
import React, { useEffect, useState } from "react";


import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function SettingsPage() {
  const { user, signOut, resetPassword } = useAuth();
  const { profile, updateProfile, loading: profileLoading, refetch } = useUserProfile();
  const { preferences, updatePreferences } = useNotifications();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || "");
  const [isExporting, setIsExporting] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // Sync notification settings with profile data
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: profile?.email_notifications ?? true,
    pushNotifications: preferences.browserNotifications,
    taskReminders: profile?.task_reminders ?? true,
    weeklyReports: profile?.daily_digest ?? false,
  });

  // Update notification settings when profile or preferences change
  useEffect(() => {
    setNotificationSettings({
      emailNotifications: profile?.email_notifications ?? true,
      pushNotifications: preferences.browserNotifications,
      taskReminders: profile?.task_reminders ?? true,
      weeklyReports: profile?.daily_digest ?? false,
    });
  }, [profile, preferences]);

  // Update reset email when user changes
  useEffect(() => {
    setResetEmail(user?.email || "");
  }, [user?.email]);

  // Force fetch profile when settings page loads and user is available
  useEffect(() => {
    if (user && !profile && !profileLoading) {
      console.log("Settings page: Force fetching profile for user:", user.id);
      refetch();
    }
  }, [user, profile, profileLoading, refetch]);

  // Track page performance
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const endMeasure = performanceMonitoring.measureRenderTime("SettingsPage");
      return endMeasure;
    }
  });

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast({
        title: "Error",
        description: "Please enter your email address",

      });
      return;
    }

    setIsResettingPassword(true);
    try {
      const result = await resetPassword(resetEmail);
      if (result.success) {
        toast({
          title: "Success",
          description: "Password reset email sent! Check your inbox.",
        });
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to send password reset email",

        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email",
      });
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSignOut = async () => {
    const startTime = performance.now();
    await signOut();
    const endTime = performance.now();
    performanceMonitoring.trackInteraction("signout", "settings", endTime - startTime);
  };

  const handleExportData = async () => {
    if (isExporting) return;

    setIsExporting(true);
    try {
      // TODO: Implement actual data export functionality
      // This would typically generate a JSON/CSV file with user's tasks, categories, etc.
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
      toast({
        title: "Success",
        description: "Data export started. You'll receive an email when ready.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start data export",

      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (isDeletingAccount) return;

    // Show confirmation dialog
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will permanently delete all your data."
    );

    if (!confirmed) return;

    setIsDeletingAccount(true);
    try {
      // TODO: Implement actual account deletion
      // This would typically delete user data and sign them out
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast({
        title: "Error",
        description: "Account deletion is not available in this demo",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete account",
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const updateNotificationSetting = async (key: string, value: boolean) => {
    // Optimistically update UI
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));

    try {
      // Update different settings based on the key
      switch (key) {
        case "emailNotifications":
          if (profile) {
            await updateProfile({ email_notifications: value });
          }
          break;
        case "taskReminders":
          if (profile) {
            await updateProfile({ task_reminders: value });
          }
          break;
        case "weeklyReports":
          if (profile) {
            await updateProfile({ daily_digest: value });
          }
          break;
        case "pushNotifications":
          updatePreferences({ browserNotifications: value });
          break;
        default:
          break;
      }

      toast({
        title: "Success",
        description: "Notification settings updated",
      });
    } catch (error) {
      // Revert optimistic update on error
      setNotificationSettings((prev) => ({
        ...prev,
        [key]: !value,
      }));
      toast({
        title: "Error",
        description: "Failed to update notification settings",

      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              <h1 className="text-2xl font-bold">Settings</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="grid gap-8">
          {/* Profile Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <User className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Profile</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                {isEditingProfile ? (
                  <UserProfileEditor profile={profile} onClose={() => setIsEditingProfile(false)} />
                ) : (
                  <UserProfileCard />
                )}
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Profile Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button
                    onClick={() => setIsEditingProfile(!isEditingProfile)}
                    className="w-full justify-start"
                    variant="outline"
                  >
                    <User className="h-4 w-4 mr-2" />
                    {isEditingProfile ? "View Profile" : "Edit Profile"}
                  </Button>

                  <Button
                    onClick={handleExportData}
                    className="w-full justify-start"
                    variant="outline"
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Export Data"}
                  </Button>

                  <Button
                    onClick={handleDeleteAccount}
                    className="w-full justify-start"
                    variant="destructive"
                    disabled={isDeletingAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeletingAccount ? "Deleting..." : "Delete Account"}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Appearance Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Appearance</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Theme Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Theme</Label>
                    <p className="text-sm text-muted-foreground">Choose your preferred theme</p>
                  </div>
                  <ThemeToggle />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Security Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Security</h2>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Account Security</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-email">Current Email</Label>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{user?.email}</span>
                      <Badge variant="secondary">Verified</Badge>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="reset-email">Reset Password</Label>
                    <div className="flex gap-2">
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="Enter email for password reset"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                      <Button onClick={handlePasswordReset} disabled={isResettingPassword} size="sm">
                        <Key className="h-4 w-4 mr-2" />
                        {isResettingPassword ? "Sending..." : "Reset"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Session Management</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Session</Label>
                    <p className="text-sm text-muted-foreground">Signed in since {new Date().toLocaleDateString()}</p>
                  </div>

                  <Button onClick={handleSignOut} variant="outline" className="w-full justify-start">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>

          <Separator />

          {/* Notifications Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Notifications</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive notifications via email</p>
                  </div>
                  <Switch
                    checked={notificationSettings.emailNotifications}
                    onCheckedChange={(checked) => updateNotificationSetting("emailNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
                  </div>
                  <Switch
                    checked={notificationSettings.pushNotifications}
                    onCheckedChange={(checked) => updateNotificationSetting("pushNotifications", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Task Reminders</Label>
                    <p className="text-sm text-muted-foreground">Get reminded about upcoming tasks</p>
                  </div>
                  <Switch
                    checked={notificationSettings.taskReminders}
                    onCheckedChange={(checked) => updateNotificationSetting("taskReminders", checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base">Weekly Reports</Label>
                    <p className="text-sm text-muted-foreground">Receive weekly productivity reports</p>
                  </div>
                  <Switch
                    checked={notificationSettings.weeklyReports}
                    onCheckedChange={(checked) => updateNotificationSetting("weeklyReports", checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </section>

          <Separator />

          {/* Email Notifications Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Email Management</h2>
            </div>

            <Tabs defaultValue="settings" className="space-y-6">
              <TabsList>
                <TabsTrigger value="settings">Email Settings</TabsTrigger>
                <TabsTrigger value="history">Email History</TabsTrigger>
              </TabsList>

              {/* <TabsContent value="settings">
                <EmailSettingsContainer userId={user?.id || ""} />
              </TabsContent>

              <TabsContent value="history">
                <EmailLogs userId={user?.id || ""} />
              </TabsContent> */}
            </Tabs>
          </section>

          <Separator />

          {/* Data & Privacy Section */}
          <section>
            <div className="flex items-center gap-2 mb-6">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-xl font-semibold">Data & Privacy</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Data Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleExportData}
                    disabled={isExporting}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    {isExporting ? "Exporting..." : "Download My Data"}
                  </Button>

                  <Button
                    variant="outline"
                    className="justify-start"
                    disabled={true}
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your data is encrypted and stored securely. We never share your personal information with third
                    parties.
                  </p>

                  <Button
                    variant="destructive"
                    className="justify-start"
                    onClick={handleDeleteAccount}
                    disabled={isDeletingAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {isDeletingAccount ? "Deleting..." : "Delete All Data"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </div>
    </div>
  );
}
