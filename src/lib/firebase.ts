
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId } from 'firebase/firestore';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Your web app's Firebase configuration is read from environment variables
// These environment variables are populated by Firebase App Hosting from Google Secret Manager secrets.
// CRITICAL: Ensure each NEXT_PUBLIC_FIREBASE_..._SECRET (e.g., NEXT_PUBLIC_FIREBASE_API_KEY_SECRET)
// exists in Google Secret Manager for project 'nexverse-2cc70' and that the
// App Hosting service account (firebase-app-hosting-compute@nexverse-2cc70.iam.gserviceaccount.com)
// has the "Secret Manager Secret Accessor" role for EACH of these secrets.

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Client-side logging to verify if environment variables are loaded
if (typeof window !== 'undefined') {
  console.log('[NExVERSE Firebase Client] Initializing with effective config:');
  console.log(`[NExVERSE Firebase Client] API Key Loaded: ${firebaseConfig.apiKey ? 'YES' : 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Auth Domain: ${firebaseConfig.authDomain || 'NOT LOADED - CRITICAL FOR AUTH!'}`);
  console.log(`[NExVERSE Firebase Client] Project ID: ${firebaseConfig.projectId || 'NOT LOADED - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Client] Storage Bucket: ${firebaseConfig.storageBucket || 'NOT LOADED'}`);
  console.log(`[NExVERSE Firebase Client] Messaging Sender ID: ${firebaseConfig.messagingSenderId || 'NOT LOADED'}`);
  console.log(`[NExVERSE Firebase Client] App ID: ${firebaseConfig.appId || 'NOT LOADED'}`);
  console.log(`[NExVERSE Firebase Client] Measurement ID: ${firebaseConfig.measurementId || 'NOT LOADED (optional)'}`);

  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId) {
    console.error('[NExVERSE Firebase Client] CRITICAL: One or more core Firebase config values are missing. This is likely due to misconfigured secrets in Google Secret Manager or missing IAM permissions for the App Hosting service account to access these secrets. Refer to apphosting.yaml for secret names.');
  }
}

// Server-side logging for build/runtime in App Hosting
if (typeof window === 'undefined') {
  console.log('[NExVERSE Firebase Server] Initializing Firebase. Checking for environment variables:');
  console.log(`[NExVERSE Firebase Server] NEXT_PUBLIC_FIREBASE_API_KEY available: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY ? 'Yes' : 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] NEXT_PUBLIC_FIREBASE_PROJECT_ID available: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'NO - CRITICAL!'}`);
  console.log(`[NExVERSE Firebase Server] NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN available: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'NO - CRITICAL FOR AUTH!'}`);
   if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY || !process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || !process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN) {
    console.error('[NExVERSE Firebase Server] CRITICAL: Core Firebase config environment variables are missing server-side. Ensure secrets are correctly defined in apphosting.yaml and accessible by the App Hosting service account.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storageInstance: FirebaseStorage;

if (!getApps().length) {
  try {
    if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
      const errorMsg = 'Firebase API Key or Project ID is missing. Cannot initialize Firebase. Ensure secrets are correctly set up in Google Secret Manager and apphosting.yaml.';
      console.error(`[Firebase Init Error] ${errorMsg}`);
      // For server-side, this might prevent startup. For client-side, features will fail.
      // Avoid throwing here to let client-side potentially show a degraded experience or more specific UI errors.
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
    // If running server-side (e.g., during build or server components), re-throw to make failure clear.
    if (typeof window === 'undefined') {
        throw new Error(`Server-side Firebase initialization failed: ${error}. Ensure secrets are correctly configured.`);
    }
    // For client-side, the app might be in a broken state, further errors will likely occur.
  }
} else {
  app = getApps()[0];
  storageInstance = getStorage(app); // Ensure storageInstance is assigned here too
  if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.warn("[Firebase Analytics Re-Init] Failed to re-initialize Analytics:", e);
    }
  }
}

// Ensure app is defined before trying to use it for auth and db
// This check is more for robustness; init errors should ideally be caught above.
if (!app!) {
    const criticalErrorMsg = "[Firebase Init] CRITICAL: Firebase app object is UNDEFINED after initialization attempt. Firebase services (Auth, Firestore, Storage) will not work. Check previous logs for errors related to missing config from secrets.";
    console.error(criticalErrorMsg);
    // If server-side, this is a fatal error for request handling or builds.
    if (typeof window === 'undefined') {
        throw new Error(criticalErrorMsg);
    }
}

const auth: Auth = getAuth(app!);
const db: Firestore = getFirestore(app!);

// IMPORTANT: For `auth/unauthorized-domain` errors with OAuth providers (like Google Sign-In):
// 1. Ensure your app's deployed domain (e.g., `nexverse-2cc70.web.app` or custom domain) is in "Authorized domains"
//    in Firebase Console > Authentication > Sign-in method.
// 2. Critically, the domain `nexverse-2cc70.firebaseapp.com` (i.e., [YOUR_PROJECT_ID].firebaseapp.com)
//    MUST ALSO be added to "Authorized domains". This is used for the OAuth redirect.
// 3. The `authDomain` in your `firebaseConfig` (loaded from NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_SECRET)
//    MUST be `nexverse-2cc70.firebaseapp.com`.
// 4. VERY IMPORTANT FOR FIREBASE STUDIO / CLOUD WORKSTATIONS: The specific domain of your development environment
//    (e.g., `your-dev-instance.cloudworkstations.dev`) MUST ALSO be added to the "Authorized domains" list if you test OAuth from there.

export { app, auth, db, analytics, storageInstance as storage, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId };
