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
import React, { useState } from "react";
import { toast } from "sonner";

import { EmailLogs } from "@/components/email/email-logs";
import { EmailSettings } from "@/components/email/email-settings";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const { profile } = useUserProfile();
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState(user?.email || "");
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    taskReminders: true,
    weeklyReports: false,
  });

  // Track page performance
  React.useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      const endMeasure = performanceMonitoring.measureRenderTime("SettingsPage");
      return endMeasure;
    }
  });

  const handlePasswordReset = async () => {
    if (!resetEmail) {
      toast.error("Please enter your email address");
      return;
    }

    setIsResettingPassword(true);
    try {
      // This would typically call your auth service
      // await resetPassword(resetEmail)
      toast.success("Password reset email sent! Check your inbox.");
    } catch (error) {
      toast.error("Failed to send password reset email");
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

  const handleExportData = () => {
    toast.success("Data export started. You'll receive an email when ready.");
  };

  const handleDeleteAccount = () => {
    toast.error("Account deletion is not available in this demo");
  };

  const updateNotificationSetting = (key: string, value: boolean) => {
    setNotificationSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    toast.success("Notification settings updated");
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

                  <Button onClick={handleExportData} className="w-full justify-start" variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Export Data
                  </Button>

                  <Button onClick={handleDeleteAccount} className="w-full justify-start" variant="destructive">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
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

              <TabsContent value="settings">
                <EmailSettings
                  userId={user?.id || ""}
                  initialPreferences={{
                    email_notifications: notificationSettings.emailNotifications,
                    daily_digest: notificationSettings.weeklyReports,
                    reminder_hours: 24,
                  }}
                />
              </TabsContent>

              <TabsContent value="history">
                <EmailLogs userId={user?.id || ""} />
              </TabsContent>
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
                  <Button variant="outline" className="justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>

                  <Button variant="outline" className="justify-start">
                    <Upload className="h-4 w-4 mr-2" />
                    Import Data
                  </Button>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground mb-4">
                    Your data is encrypted and stored securely. We never share your personal information with third
                    parties.
                  </p>

                  <Button variant="destructive" className="justify-start">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All Data
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
