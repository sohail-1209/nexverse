
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { Settings as SettingsIcon, Bell, Palette, ShieldCheck, Moon, Sun } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils'; // Import cn utility

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  
  // Ensure component is mounted before rendering theme-dependent UI
  useEffect(() => setMounted(true), []);

  // TODO: Fetch user notification settings from Firestore or use local state with persistence
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  const handleSaveChanges = () => {
    // TODO: Implement logic to save notification settings to Firestore or localStorage
    console.log('Settings saved:', { notificationsEnabled, currentTheme: theme });
    toast({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
  };

  if (!user || !mounted) {
    // Show a loader or placeholder until user and theme are ready
    // This also prevents hydration mismatch for theme-dependent UI
    return <div className="max-w-2xl mx-auto"><p>Loading settings...</p></div>; 
  }

  const isDarkMode = theme === 'dark';

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <CardTitle className="font-headline text-3xl">Settings</CardTitle>
          </div>
          <CardDescription>Manage your application preferences and account settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Notification Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Notifications</h3>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="notifications-switch" className="flex flex-col space-y-1">
                <span>Email Notifications</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Receive updates about new answers and important announcements.
                </span>
              </Label>
              <Switch
                id="notifications-switch"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
            </div>
          </div>
          
          {/* Appearance Settings */}
          <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Appearance</h3>
            </div>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="dark-mode-switch" className="flex flex-col space-y-1">
                <span>Dark Mode</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Toggle between light and dark themes for the application.
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Sun className={cn("h-5 w-5", !isDarkMode ? "text-primary" : "text-muted-foreground")} />
                <Switch
                  id="dark-mode-switch"
                  checked={isDarkMode}
                  onCheckedChange={(checked) => {
                      setTheme(checked ? 'dark' : 'light');
                      toast({ title: 'Theme Updated', description: `Switched to ${checked ? 'dark' : 'light'} mode.`});
                  }}
                />
                <Moon className={cn("h-5 w-5", isDarkMode ? "text-primary" : "text-muted-foreground")} />
              </div>
            </div>
          </div>

          {/* Account Settings */}
           <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Account & Security</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              For password changes and other account modifications, please visit your <Button variant="link" asChild className="p-0 h-auto"><a href="/profile">Profile Page</a></Button>.
            </p>
          </div>

          <Separator />

          <div className="flex justify-end">
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
