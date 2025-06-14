
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Your web app's Firebase configuration is read from environment variables
// These environment variables are populated by Firebase App Hosting from Google Secret Manager secrets.

// Client-side logging to verify if environment variables are loaded
if (typeof window !== 'undefined') {
  console.log('[NExVERSE Firebase Client] Reading Firebase config from process.env:');
  console.log(`[NExVERSE Firebase Client] API Key Loaded (NEXT_PUBLIC_FIREBASE_API_KEY): ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'YES' : 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN): ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NOT LOADED - CRITICAL FOR AUTH!'}`);
  console.log(`[NExVERSE Firebase Client] Project ID (NEXT_PUBLIC_FIREBASE_PROJECT_ID): ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NOT LOADED - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Storage Bucket (NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET): ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'NOT LOADED'}`);
  console.log(`[NExVERSE Firebase Client] Messaging Sender ID (NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID): ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'NOT LOADED'}`);
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
  console.log('[NExVERSE Firebase Server] Initializing Firebase. Checking for environment variables:');
  console.log(`[NExVERSE Firebase Server] NEXT_PUBLIC_FIREBASE_API_KEY available: ${firebaseConfig.apiKey ? 'Yes' : 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] NEXT_PUBLIC_FIREBASE_PROJECT_ID available: ${firebaseConfig.projectId || 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN available: ${firebaseConfig.authDomain || 'NO - CRITICAL FOR AUTH!'}`);
   if (!firebaseConfig.apiKey || !firebaseConfig.projectId || !firebaseConfig.authDomain) {
    console.error('[NExVERSE Firebase Server] CRITICAL: Core Firebase config environment variables are missing server-side. Ensure secrets are correctly defined in Google Secret Manager, referenced in apphosting.yaml, and accessible by the App Hosting service account.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storageInstance: FirebaseStorage;

if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      const errorMsg = '[Firebase Init Error] Firebase API Key or Project ID is missing. Cannot initialize Firebase. Ensure secrets are correctly set up in Google Secret Manager, referenced in apphosting.yaml, and that the App Hosting service account has Secret Manager Secret Accessor permissions.';
      console.error(errorMsg);
       // This error during build or server-side rendering will likely lead to failures.
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
    console.error('[Firebase Init] CRITICAL: Failed to initialize Firebase app. This is likely due to missing or incorrect Firebase config environment variables from secrets.', error);
    if (typeof window === 'undefined') {
        // If server-side (build or runtime), this is a fatal issue.
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

// @ts-ignore - app might not be initialized if config is missing, leading to runtime errors.
const auth: Auth = getAuth(app);
// @ts-ignore - app might not be initialized
const db: Firestore = getFirestore(app);

// IMPORTANT: For `auth/unauthorized-domain` errors with OAuth providers (like Google Sign-In):
// 1. Ensure your app's deployed domain (e.g., `nexverse-2cc70.web.app` or custom domain) is in "Authorized domains"
//    in Firebase Console > Authentication > Sign-in method.
// 2. Critically, the domain `nexverse-2cc70.firebaseapp.com` (i.e., [YOUR_PROJECT_ID].firebaseapp.com)
//    MUST ALSO be added to "Authorized domains". This is used for the OAuth redirect.
// 3. The `authDomain` in your `firebaseConfig` (loaded from NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_SECRET)
//    MUST be `nexverse-2cc70.firebaseapp.com`.
// 4. VERY IMPORTANT FOR FIREBASE STUDIO / CLOUD WORKSTATIONS: The specific domain of your development environment
//    (e.g., your-dev-instance.cloudworkstations.dev, like '6000-firebase-studio-1749913046111.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev')
//    MUST ALSO be added to the "Authorized domains" list in the Firebase Console if you test OAuth from there.

export { app, auth, db, analytics, storageInstance as storage, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId };
