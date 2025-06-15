
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { 
  getFirestore, 
  Firestore, 
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  orderBy, 
  limit, 
  startAfter, 
  documentId, 
  arrayUnion, 
  arrayRemove, 
  increment, 
  writeBatch,
  Timestamp,
  onSnapshot // Added onSnapshot import
} from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import {
  getMessaging,
  getToken as getFCMToken,
  onMessage as onFCMMessage, // Renamed to avoid conflict if 'onMessage' is used locally
  isSupported as isFcmSupported
} from 'firebase/messaging';

if (typeof window !== 'undefined') {
  console.log('[NExVERSE Firebase Client] Reading Firebase config from process.env:');
  console.log(`[NExVERSE Firebase Client] API Key Loaded (NEXT_PUBLIC_FIREBASE_API_KEY): ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'YES' : 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN): ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT LOADED - CRITICAL FOR AUTH!'}`);
  console.log(`[NExVERSE Firebase Client] Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID): ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT LOADED - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Storage Bucket from ENV (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET): ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'NOT LOADED - CHECK BUCKET NAME!'}`);
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

if (typeof window === 'undefined') {
  console.log('[NExVERSE Firebase Server] Initializing Firebase. Checking environment variables:');
  console.log(`[NExVERSE Firebase Server] API Key from env: ${firebaseConfig.apiKey ? 'Exists' : 'MISSING - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] Auth Domain from env: ${firebaseConfig.authDomain || 'MISSING - CRITICAL FOR AUTH!'}`);
  console.log(`[NExVERSE Firebase Server] Project ID from env: ${firebaseConfig.projectId || 'MISSING - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] Storage Bucket from env: ${firebaseConfig.storageBucket || 'MISSING - CHECK BUCKET NAME!'}`);
  console.log(`[NExVERSE Firebase Server] Messaging Sender ID from env: ${firebaseConfig.messagingSenderId || 'MISSING - NEEDED FOR FCM'}`);
  console.log(`[NExVERSE Firebase Server] App ID from env: ${firebaseConfig.appId || 'MISSING'}`);
  console.log(`[NExVERSE Firebase Server] Measurement ID from env: ${firebaseConfig.measurementId || 'MISSING (optional)'}`);

  if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain || !firebaseConfig.messagingSenderId || !firebaseConfig.storageBucket) {
    console.error('[NExVERSE Firebase Server] CRITICAL: Core Firebase config environment variables (including messagingSenderId and storageBucket) are missing server-side. Ensure secrets are correctly defined in Google Secret Manager, referenced in apphosting.yaml, and that the App Hosting service account has Secret Manager Secret Accessor permissions.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storageInstance: FirebaseStorage;
let messaging: any = null; // Can be Firebase Messaging or null if not supported/initialized

if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.messagingSenderId || !firebaseConfig.storageBucket) {
      const errorMsg = '[Firebase Init Error] Firebase API Key, Project ID, Storage Bucket, or Messaging Sender ID is missing from environment variables. Cannot initialize Firebase fully. This usually means the corresponding secrets were not found or accessible by App Hosting. Please check Google Secret Manager for your project and ensure the secrets exist, have values, and that the App Hosting service account has "Secret Manager Secret Accessor" permissions.';
      console.error(errorMsg);
      // Depending on severity, you might throw or handle gracefully
      // For now, it will try to initialize anyway, and specific services might fail later.
    }
    app = initializeApp(firebaseConfig);
    storageInstance = getStorage(app); // Initialize storage here
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
    // Handle the error appropriately, e.g., by setting app to a state that indicates failure
    // For now, code below might fail if 'app' is not initialized.
  }
} else {
  app = getApps()[0];
  storageInstance = getStorage(app); // Ensure storage is initialized if app already exists
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("[Firebase Analytics Re-Init] Failed to re-initialize Analytics:", e);
    }
  }
}

// @ts-ignore - app might not be initialized if config is missing above
const auth: Auth = getAuth(app);
// @ts-ignore - app might not be initialized
const db: Firestore = getFirestore(app);

// Actual VAPID key
const VAPID_KEY = "BB99WyUz39vmARSo961L5lkLJY9mCGakOBb8YdRQrinuSj65XBffX_rByPZyJltNBIZnHA1qJFY1CtJcwk7vKEw";
const VAPID_KEY_PLACEHOLDER_TEXT = "YOUR_PUBLIC_VAPID_KEY_FROM_FIREBASE_CONSOLE"; // For check

export const initializeFirebaseMessaging = async (showToast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void) => {
  console.log("[NExVERSE FCM] Attempting to initialize Firebase Messaging...");
  const supported = await isFcmSupported();
  if (!supported || typeof window === 'undefined') {
    console.log("[NExVERSE FCM] Firebase Messaging is not supported in this browser/environment.");
    return null;
  }

  if (!messaging) {
     // @ts-ignore
    messaging = getMessaging(app);
     console.log("[NExVERSE FCM] Messaging service initialized.");
  }

  try {
    if (VAPID_KEY === VAPID_KEY_PLACEHOLDER_TEXT || !VAPID_KEY || VAPID_KEY.length < 50) { // Added length check
        const warningMessage = "[NExVERSE FCM] CRITICAL: VAPID Key for FCM is not set or seems invalid in src/lib/firebase.ts. Push notifications WILL NOT WORK. Please generate/find your VAPID key in Firebase Console (Project Settings > Cloud Messaging > Web Push certificates) and set it correctly in the code. Current key: " + VAPID_KEY;
        console.warn(warningMessage);
        
        // Only show toast to admin users to avoid bothering regular users
        if (auth.currentUser) {
            const userDocRef = doc(db, 'users', auth.currentUser.uid);
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists() && userDocSnap.data().role === 'admin') {
                showToast({
                    title: "Push Notification Setup Incomplete (Admin Action Required)",
                    description: "The VAPID key for push notifications is missing or invalid in the configuration. Please contact the site administrator or check it in src/lib/firebase.ts to enable notifications.",
                    variant: "destructive",
                });
            }
        }
        return null; // Stop here if VAPID key is bad
    }

    console.log("[NExVERSE FCM] Requesting notification permission...");
    const permission = await Notification.requestPermission();
    console.log("[NExVERSE FCM] Notification.requestPermission() result:", permission);

    if (permission === 'granted') {
      console.log('[NExVERSE FCM] Notification permission granted by user.');
      
      console.log("[NExVERSE FCM] Attempting to get FCM token with VAPID key set.");
      const currentToken = await getFCMToken(messaging, { vapidKey: VAPID_KEY });
      if (currentToken) {
        console.log('[NExVERSE FCM] FCM Token retrieved successfully:', currentToken);
        showToast({ title: "Notifications Active", description: "You can now receive push notifications on this device." });
        
        console.log(`[NExVERSE FCM] User ${auth.currentUser?.uid} is logged in. Attempting to save FCM token to Firestore.`);
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          try {
            const userDocSnap = await getDoc(userDocRef);
            if (userDocSnap.exists()) {
                console.log(`[NExVERSE FCM] User document for UID ${auth.currentUser.uid} found. Updating with FCM token.`);
                await updateDoc(userDocRef, { 
                    fcmTokens: arrayUnion(currentToken),
                    lastFcmTokenUpdate: serverTimestamp()
                });
                console.log(`[NExVERSE FCM] Successfully updated user document with FCM token for UID: ${auth.currentUser.uid}`);
            } else {
                console.log(`[NExVERSE FCM] User document for UID ${auth.currentUser.uid} not found. Creating document with FCM token.`);
                await setDoc(userDocRef, {
                    uid: auth.currentUser.uid,
                    email: auth.currentUser.email,
                    displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || "Anonymous User",
                    photoURL: auth.currentUser.photoURL || null,
                    role: 'user', 
                    fcmTokens: [currentToken],
                    createdAt: serverTimestamp(),
                    lastFcmTokenUpdate: serverTimestamp()
                }, { merge: true });
                console.log(`[NExVERSE FCM] Successfully created user document with FCM token for UID: ${auth.currentUser.uid}`);
            }
          } catch (firestoreError: any) {
            console.error("[NExVERSE FCM] Error saving/updating FCM token to Firestore:", firestoreError.message, firestoreError.code, firestoreError.stack);
            showToast({ title: "FCM Sync Error", description: `Could not save notification token: ${firestoreError.message}`, variant: "destructive"});
          }
        }
        return currentToken;
      } else {
        console.warn('[NExVERSE FCM] No registration token available. Request permission to generate one, or check VAPID key & service worker.');
        showToast({ title: "FCM Token Error", description: "Could not retrieve FCM token. Ensure push notifications are allowed and service worker is registered correctly. Check VAPID key.", variant: "destructive" });
        return null;
      }
    } else {
      console.log('[NExVERSE FCM] Unable to get permission to notify.');
      showToast({ title: "Notifications Disabled", description: "Push notification permission not granted by user."});
      return null;
    }
  } catch (err: any) {
    console.error('[NExVERSE FCM] An error occurred while initializing Firebase Messaging or retrieving token: ', err.message, err.code, err.stack);
    let errorDesc = "Could not set up push notifications.";
    if (err.name === 'FirebaseError') {
        if (err.code === 'messaging/failed-serviceworker-registration') {
            errorDesc = "Push notification service worker registration failed. Ensure 'firebase-messaging-sw.js' is in your public directory and correctly configured.";
        } else if (err.code === 'messaging/invalid-vapid-key' || err.code === 'messaging/invalid-app-server-key' || (err.message && err.message.toLowerCase().includes("applicationserverkey")) ) {
            errorDesc = "The VAPID key for push notifications is invalid or missing. Please check it in src/lib/firebase.ts.";
        } else if (err.message && err.message.toLowerCase().includes("permission")) {
            errorDesc = "Permission denied for notifications or an issue with service worker registration. Check browser console."
        }
    } else if (err instanceof Error && err.message.toLowerCase().includes("permission")) {
        errorDesc = "Permission denied for notifications or an issue with service worker registration. Check browser console."
    }
    showToast({ title: "Messaging Setup Error", description: errorDesc, variant: "destructive" });
    return null;
  }
};

export const setupForegroundMessageHandler = (showToast: (options: { title: string; description: string; variant?: "default" | "destructive" }) => void) => {
  isFcmSupported().then(supported => {
    if (supported && messaging) {
      onFCMMessage(messaging, (payload) => { // Use renamed onFCMMessage
        console.log('[NExVERSE FCM] Message received in foreground: ', payload);
        showToast({
          title: payload.notification?.title || "NExVERSE Notification",
          description: payload.notification?.body || "You have a new message.",
        });
      });
      console.log("[NExVERSE FCM] Foreground message handler set up.");
    }
  });
};

export { 
  app, 
  auth, 
  db, 
  analytics, 
  storageInstance as storage, // Export storageInstance as storage
  messaging, // Export messaging
  // Firestore functions
  collection, 
  addDoc, 
  serverTimestamp, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  orderBy, 
  limit, 
  startAfter, 
  documentId,
  arrayUnion, 
  arrayRemove, 
  increment, 
  writeBatch,
  Timestamp,
  onSnapshot // Ensure onSnapshot is exported
};
    

    

    