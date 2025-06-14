
'use client';

import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useState, useEffect } from 'react';
import { updateProfile, updateEmail, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, doc, updateDoc, getDoc } from '@/lib/firebase';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

export default function ProfilePage() {
  const { user, signOut, loading: authLoading } = useAuth();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || '');
      setEmail(user.email || '');
    }
  }, [user]);

  const getInitials = (name?: string | null) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').toUpperCase() || 'U';
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsLoading(true);

    try {
      // Update display name in Firebase Auth
      if (displayName !== user.displayName) {
        await updateProfile(user, { displayName });
        // Also update in Firestore 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        // Check if the document exists before attempting to update
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            await updateDoc(userDocRef, { displayName: displayName });
        } else {
            console.warn(`User document for UID ${user.uid} not found in Firestore. DisplayName not updated there.`);
        }
      }

      // Update email if changed - requires re-authentication
      if (email !== user.email && currentPassword) {
        const credential = EmailAuthProvider.credential(user.email!, currentPassword);
        await reauthenticateWithCredential(user, credential);
        await updateEmail(user, email);

        // Also update email in Firestore 'users' collection
        const userDocRef = doc(db, 'users', user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
            await updateDoc(userDocRef, { email: email });
        } else {
             console.warn(`User document for UID ${user.uid} not found in Firestore. Email not updated there.`);
        }
        setCurrentPassword(''); 
      } else if (email !== user.email && !currentPassword) {
         toast({
          title: 'Password Required',
          description: 'Please enter your current password to change your email address.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }
      
      toast({ title: 'Profile Updated', description: 'Your profile has been successfully updated.' });
      setIsEditing(false);
    } catch (error: any) {
      console.error("Profile update error: ", error);
      let errorMessage = 'Failed to update profile. Please try again.';
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = 'This operation is sensitive and requires recent authentication. Please log out and log back in.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please verify your current password.';
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email address is already in use by another account.';
      }
      toast({ title: 'Update Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading || !user) {
    return <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline text-3xl">My Profile</CardTitle>
          <CardDescription>View and update your personal information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'User'} />
              <AvatarFallback className="text-3xl">{getInitials(user.displayName)}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold">{displayName || user.displayName || 'N/A'}</h2>
              <p className="text-sm text-muted-foreground">{email || user.email}</p>
            </div>
          </div>

          <Separator />

          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div>
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                disabled={!isEditing || isLoading}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={!isEditing || isLoading}
              />
            </div>

            {isEditing && email !== user.email && (
              <div>
                <Label htmlFor="currentPassword">Current Password (to change email)</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  disabled={isLoading}
                  placeholder="Enter current password"
                />
                 <p className="text-xs text-muted-foreground mt-1">Required to update your email address.</p>
              </div>
            )}


            {isEditing ? (
              <div className="flex space-x-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
                <Button variant="outline" onClick={() => {
                  setIsEditing(false);
                  setDisplayName(user.displayName || '');
                  setEmail(user.email || '');
                  setCurrentPassword('');
                }} disabled={isLoading}>
                  Cancel
                </Button>
              </div>
            ) : (
              <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
            )}
          </form>

          <Separator />

          <div>
            <h3 className="text-lg font-semibold mb-2">Account Actions</h3>
            <Button variant="destructive" onClick={signOut} disabled={isLoading}>
              Log Out
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

