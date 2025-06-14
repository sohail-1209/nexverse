
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId } from 'firebase/firestore'; // Added Firestore functions
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added Storage functions

// Your web app's Firebase configuration is read from environment variables
// These environment variables are populated by App Hosting from Google Secret Manager secrets
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// For server-side logging during initialization, if needed for debugging in App Hosting
if (typeof window === 'undefined') {
  console.log('[Firebase Init] Server-side: Attempting to initialize Firebase.');
  console.log('[Firebase Init] Server-side: Project ID from env (NEXT_PUBLIC_FIREBASE_PROJECT_ID):', firebaseConfig.projectId || 'PROJECT_ID_NOT_FOUND_IN_ENV');
  if (!firebaseConfig.apiKey) {
    console.warn('[Firebase Init] Server-side: CRITICAL - Firebase API Key (NEXT_PUBLIC_FIREBASE_API_KEY) is MISSING or UNDEFINED in the environment. This will cause Firebase initialization to fail.');
  }
  if (!firebaseConfig.authDomain) {
    // For OAuth providers like Google Sign-In, this specific authDomain should be [YOUR_PROJECT_ID].firebaseapp.com
    // and must be in your Firebase project's "Authorized domains" list.
    console.warn('[Firebase Init] Server-side: Firebase Auth Domain (NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) is MISSING or UNDEFINED.');
  }
} else {
  // Client-side specific logging for debugging Firebase config
  console.log('[NExVERSE Firebase Debug Client] Initializing Firebase with effective config:');
  console.log(`[NExVERSE Firebase Debug Client] Project ID: ${firebaseConfig.projectId}`);
  console.log(`[NExVERSE Firebase Debug Client] Auth Domain: ${firebaseConfig.authDomain}`); // CRITICAL FOR GOOGLE SIGN-IN
  if (!firebaseConfig.apiKey) {
    console.error('[NExVERSE Firebase Debug Client] CRITICAL: Firebase API Key is MISSING or UNDEFINED in the client-side config.');
  }
  if (!firebaseConfig.authDomain) {
    console.error('[NExVERSE Firebase Debug Client] CRITICAL: Firebase Auth Domain is MISSING or UNDEFINED in the client-side config. This MUST be "[YOUR_PROJECT_ID].firebaseapp.com" for Google Sign-in and added to Authorized Domains in Firebase Console.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storage: FirebaseStorage;

if (!getApps().length) {
  try {
    app = initializeApp(firebaseConfig);
    if (typeof window !== 'undefined') {
      // Initialize Analytics only on the client side
      if (firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      } else {
        console.warn('[Firebase Init] Client-side: Firebase Measurement ID is missing. Analytics will not be initialized.');
      }
    }
    storage = getStorage(app);
  } catch (error) {
    console.error('[Firebase Init] CRITICAL: Failed to initialize Firebase app. This is likely due to missing or incorrect Firebase config environment variables.', error);
    // Re-throw or handle critical failure appropriately for server-side
    if (typeof window === 'undefined') {
        throw new Error(`Server-side Firebase initialization failed: ${error}`);
    }
  }
} else {
  app = getApps()[0];
  if (typeof window !== 'undefined') {
    try {
      if (firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    } catch (e) {
      // Non-critical if re-initializing analytics fails, but log it
      console.warn("[Firebase Init] Client-side: Failed to re-initialize Analytics:", e);
    }
  }
  storage = getStorage(app);
}

// Ensure app is defined before trying to use it for auth and db
// This is more of a safeguard; the catch block above should handle init failure.
if (!app!) {
    console.error("[Firebase Init] CRITICAL: Firebase app object is not defined after initialization attempt. Cannot get Auth or Firestore instances.");
    if (typeof window === 'undefined') {
        throw new Error("Server-side Firebase app object is not defined. Firebase cannot be used.");
    }
}

const auth: Auth = getAuth(app!);
const db: Firestore = getFirestore(app!);

// IMPORTANT: For `auth/unauthorized-domain` errors with OAuth providers (like Google Sign-In):
// 1. Ensure your app's deployed domain (e.g., `your-project-id.web.app` or custom domain) is in "Authorized domains"
//    in Firebase Console > Authentication > Sign-in method.
// 2. Critically, for OAuth providers, the domain `[YOUR_PROJECT_ID].firebaseapp.com` (e.g., `nexverse-2cc70.firebaseapp.com`)
//    MUST ALSO be added to "Authorized domains". This is used for the OAuth redirect.
// 3. The `authDomain` in your `firebaseConfig` (loaded from environment variables/secrets) MUST be `[YOUR_PROJECT_ID].firebaseapp.com`.

export { app, auth, db, analytics, storage, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId };
