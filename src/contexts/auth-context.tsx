
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { auth, db, doc, getDoc, initializeFirebaseMessaging, setupForegroundMessageHandler } from '@/lib/firebase'; // Added initializeFirebaseMessaging
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast'; // Import useToast

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const router = useRouter();
  const { toast } = useToast(); // Get toast function

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        try {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
            setIsAdmin(true);
            console.log(`User ${firebaseUser.uid} is an admin.`);
          } else {
            setIsAdmin(false);
            if (userDocSnap.exists()) {
              console.log(`User ${firebaseUser.uid} is not an admin. Role: ${userDocSnap.data().role}`);
            } else {
              console.warn(`User document not found in Firestore for UID: ${firebaseUser.uid}. Defaulting to non-admin.`);
            }
          }
        } catch (error) {
            console.error("Error fetching user role from Firestore:", error);
            setIsAdmin(false); 
        }
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const setupMessaging = async () => {
      if (user && typeof window !== 'undefined') {
        // Pass the toast function to initializeFirebaseMessaging and setupForegroundMessageHandler
        try {
          const token = await initializeFirebaseMessaging(toast);
          if (token) {
            setupForegroundMessageHandler(toast); // Setup foreground listener after successful token retrieval
          }
        } catch (error) {
          console.error("Failed to initialize Firebase Messaging on auth:", error);
          toast({
            title: "Notification Setup Failed",
            description: "Could not initialize push notifications for this session.",
            variant: "destructive",
          });
        }
      }
    };
    if (!loading && user) { // Ensure auth state is resolved and user is present
      setupMessaging();
    }
  }, [user, loading, toast]); // Rerun when user logs in/out, loading state changes, or toast function instance changes

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/auth/login'); 
    } catch (error) {
      console.error("Error signing out: ", error);
      toast({ title: "Sign Out Error", description: "Could not sign out. Please try again.", variant: "destructive" });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
