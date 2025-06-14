
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/auth-context';
import { Settings as SettingsIcon, Bell, Palette, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { user } = useAuth();
  // TODO: Fetch user settings from Firestore or use local state with persistence
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled, setDarkModeEnabled] = useState(false); // Example: manage theme

  const handleSaveChanges = () => {
    // TODO: Implement logic to save settings to Firestore or localStorage
    console.log('Settings saved:', { notificationsEnabled, darkModeEnabled });
    toast({ title: 'Settings Saved', description: 'Your preferences have been updated.' });
  };

  if (!user) {
    return <p>Loading user settings...</p>; // Or redirect
  }

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
             {/* TODO: Implement actual dark mode toggle logic that updates theme */}
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="dark-mode-switch" className="flex flex-col space-y-1">
                <span>Dark Mode</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Toggle between light and dark themes for the application.
                </span>
              </Label>
              <Switch
                id="dark-mode-switch"
                checked={darkModeEnabled}
                onCheckedChange={(checked) => {
                    setDarkModeEnabled(checked);
                    // document.documentElement.classList.toggle('dark', checked); // Basic example
                    toast({ title: 'Theme Updated', description: `Dark mode ${checked ? 'enabled' : 'disabled'}. (UI may need refresh for full effect)`});
                }}
              />
            </div>
          </div>

          {/* Account Settings (Placeholder for more complex settings like password change) */}
           <div className="space-y-4 p-4 border rounded-lg">
            <div className="flex items-center gap-3">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <h3 className="text-lg font-semibold">Account & Security</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              For password changes and other account modifications, please visit your <Button variant="link" asChild className="p-0 h-auto"><a href="/profile">Profile Page</a></Button>.
            </p>
            {/* Future settings like Two-Factor Authentication could go here */}
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
