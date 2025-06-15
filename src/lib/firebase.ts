
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId, arrayUnion } from 'firebase/firestore'; // Added arrayUnion
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  getMessaging,
  getToken as getFCMToken,
  onMessage,
  isSupported as isFcmSupported
} from 'firebase/messaging'; // Firebase v9+ modular SDK

// Your web app's Firebase configuration is read from environment variables
// These environment variables are populated by Firebase App Hosting from Google Secret Manager secrets.

// Client-side logging to verify if environment variables are loaded
if (typeof window !== 'undefined') {
  console.log('[NExVERSE Firebase Client] Reading Firebase config from process.env:');
  console.log(`[NExVERSE Firebase Client] API Key Loaded (NEXT_PUBLIC_FIREBASE_API_KEY): ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'YES' : 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN): ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT LOADED - CRITICAL FOR AUTH!'}`);
  console.log(`[NExVERSE Firebase Client] Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID): ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT LOADED - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Storage Bucket (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET): ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'NOT LOADED'}`);
  console.log(`[NExVERSE Firebase Client] Messaging Sender ID (NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID): ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'NOT LOADED - NEEDED FOR FCM'}`);
  console.log(`[NExVERSE Firebase Client] App ID (NEXT_PUBLIC_FIREBASE_APP_ID): ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID || 'NOT LOADED'}`);
  console.log(`[NExVERSE Firebase Client] Measurement ID (NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID): ${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'NOT LOADED (optional)'}`);
}

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Server-side logging for build/runtime in App Hosting
if (typeof window === 'undefined') {
  console.log('[NExVERSE Firebase Server] Initializing Firebase. Checking environment variables:');
  console.log(`[NExVERSE Firebase Server] API Key from env: ${firebaseConfig.apiKey ? 'Exists' : 'MISSING - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] Auth Domain from env: ${firebaseConfig.authDomain || 'MISSING - CRITICAL FOR AUTH!'}`);
  console.log(`[NExVERSE Firebase Server] Project ID from env: ${firebaseConfig.projectId || 'MISSING - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] Storage Bucket from env: ${firebaseConfig.storageBucket || 'MISSING'}`);
  console.log(`[NExVERSE Firebase Server] Messaging Sender ID from env: ${firebaseConfig.messagingSenderId || 'MISSING - NEEDED FOR FCM'}`);
  console.log(`[NExVERSE Firebase Server] App ID from env: ${firebaseConfig.appId || 'MISSING'}`);
  console.log(`[NExVERSE Firebase Server] Measurement ID from env: ${firebaseConfig.measurementId || 'MISSING (optional)'}`);

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain || !firebaseConfig.messagingSenderId) {
    console.error('[NExVERSE Firebase Server] CRITICAL: Core Firebase config environment variables (including messagingSenderId) are missing server-side. Ensure secrets are correctly defined in Google Secret Manager, referenced in apphosting.yaml, and that the App Hosting service account has Secret Manager Secret Accessor permissions.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storageInstance: FirebaseStorage;
let messaging: any = null; // Firebase Messaging instance, use 'any' to avoid type conflict before assignment

if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId) {
      const errorMsg = '[Firebase Init Error] Firebase API Key, Project ID, or Messaging Sender ID is missing from environment variables. Cannot initialize Firebase fully. This usually means the corresponding secrets were not found or accessible by App Hosting. Please check Google Secret Manager for your project and ensure the secrets exist, have values, and that the App Hosting service account has "Secret Manager Secret Accessor" permissions.';
      console.error(errorMsg);
    }
    app = initializeApp(firebaseConfig);
    storageInstance = getStorage(app);
    if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
      try {
        analytics = getAnalytics(app);
      } catch (e) {
        console.warn("[Firebase Analytics Init] Failed to initialize Analytics:", e);
      }
    }
  } catch (error) {
    console.error('[Firebase Init] CRITICAL: Failed to initialize Firebase app. This is likely due to missing or incorrect Firebase config environment variables, which are populated from secrets.', error);
    if (typeof window === 'undefined') {
        throw new Error(`Server-side Firebase initialization failed: ${error}. Check Secret Manager configuration and IAM permissions for App Hosting service account.`);
    }
  }
} else {
  app = getApps()[0];
  storageInstance = getStorage(app);
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("[Firebase Analytics Re-Init] Failed to re-initialize Analytics:", e);
    }
  }
}

// @ts-ignore - app might not be initialized if config is missing
const auth: Auth = getAuth(app);
// @ts-ignore - app might not be initialized
const db: Firestore = getFirestore(app);


export const initializeFirebaseMessaging = async (showToast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void) => {
  const supported = await isFcmSupported();
  if (!supported || typeof window === 'undefined') {
    console.log("Firebase Messaging is not supported in this browser/environment.");
    return null;
  }

  if (!messaging) { // Initialize only once
     // @ts-ignore
    messaging = getMessaging(app);
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');

      // IMPORTANT: Replace with your VAPID key from Firebase Console
      // Project settings > Cloud Messaging > Web Push certificates > Generate Key pair
      // The VAPID key is a public key and is safe to include in client-side code.
      const VAPID_KEY = "YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE"; // REPLACE THIS
      if (VAPID_KEY === "YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE") {
        console.warn("VAPID Key for FCM is not set in firebase.ts. Push notifications might not work correctly. Please generate one in Firebase Console > Project Settings > Cloud Messaging > Web Push certificates and add it here.");
        showToast({ title: "FCM Setup Incomplete", description: "Push notifications may not work. Administrator: Please set the VAPID key in src/lib/firebase.ts.", variant: "destructive"});
      }

      const currentToken = await getFCMToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        showToast({ title: "Notifications Active", description: "You can now receive push notifications on this device." });
        
        // Store token in Firestore for the current user
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          try {
            await updateDoc(userDocRef, { 
              fcmTokens: arrayUnion(currentToken),
              lastFcmTokenUpdate: serverTimestamp()
            });
            console.log("FCM token saved to user's document.");
          } catch (firestoreError) {
            console.error("Error saving FCM token to Firestore:", firestoreError);
             // If user doc doesn't exist, create it with the token
            if ((firestoreError as any).code === 'not-found') {
                try {
                    await setDoc(userDocRef, {
                        fcmTokens: [currentToken],
                        createdAt: serverTimestamp(), // Assuming this is a new user doc
                        // Add other essential user fields if creating for the first time
                        uid: auth.currentUser.uid,
                        email: auth.currentUser.email,
                        displayName: auth.currentUser.displayName,
                        role: 'user' // Default role
                    }, { merge: true });
                    console.log("User document created with FCM token.");
                } catch (setDocError) {
                    console.error("Error creating user document with FCM token:", setDocError);
                }
            }
          }
        }
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        showToast({ title: "FCM Token Error", description: "Could not retrieve FCM token. Ensure push notifications are allowed for this site.", variant: "destructive" });
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      showToast({ title: "Notifications Disabled", description: "Push notification permission not granted by user."});
      return null;
    }
  } catch (err) {
    console.error('An error occurred while initializing Firebase Messaging or retrieving token: ', err);
    let errorDesc = "Could not set up push notifications.";
    if (err instanceof Error && err.message.includes("permission")) {
        errorDesc = "Permission denied for notifications or an issue with service worker registration. Check browser console."
    } else if (err instanceof Error && err.message.includes("VAPID")) {
        errorDesc = "VAPID key is invalid or missing. Notifications will not work."
    }
    showToast({ title: "Messaging Error", description: errorDesc, variant: "destructive" });
    return null;
  }
};

// Handle messages when the app is in the foreground
// This needs to be called after messaging is initialized.
export const setupForegroundMessageHandler = (showToast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void) => {
  isFcmSupported().then(supported => {
    if (supported && messaging) { // Ensure messaging is initialized
      onMessage(messaging, (payload) => {
        console.log('Message received in foreground: ', payload);
        showToast({
          title: payload.notification?.title || "NExVERSE",
          description: payload.notification?.body || "You have a new message.",
        });
        // Optionally, you can also display a browser notification if desired,
        // but typically for foreground, a toast or in-app UI update is preferred.
        // if (payload.notification) {
        //   new Notification(payload.notification.title, { body: payload.notification.body, icon: payload.notification.icon });
        // }
      });
    }
  });
};

export { app, auth, db, analytics, storageInstance as storage, messaging, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId, arrayUnion };
