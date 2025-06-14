
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId } from 'firebase/firestore'; // Added Firestore functions
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added Storage functions

// Your web app's Firebase configuration is read from environment variables
// These environment variables are populated by App Hosting from Google Secret Manager secrets

// Log raw environment variables (client-side only for NEXT_PUBLIC_ variables)
if (typeof window !== 'undefined') {
  console.log('[NExVERSE Firebase Debug Client] Raw environment variables:');
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_API_KEY: ${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`);
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: ${process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}`);
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_PROJECT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}`);
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: ${process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}`);
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID}`);
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_APP_ID: ${process.env.NEXT_PUBLIC_FIREBASE_APP_ID}`);
  console.log(`[NExVERSE Firebase Debug Client] Raw NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID: ${process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID}`);
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
  console.log(`[NExVERSE Firebase Debug Client] API Key: ${firebaseConfig.apiKey ? 'SET' : 'MISSING!'}`);
  console.log(`[NExVERSE Firebase Debug Client] Auth Domain: ${firebaseConfig.authDomain || 'MISSING!'}`); // CRITICAL FOR GOOGLE SIGN-IN
  console.log(`[NExVERSE Firebase Debug Client] Project ID: ${firebaseConfig.projectId || 'MISSING!'}`);
  console.log(`[NExVERSE Firebase Debug Client] Storage Bucket: ${firebaseConfig.storageBucket || 'MISSING!'}`);
  console.log(`[NExVERSE Firebase Debug Client] Messaging Sender ID: ${firebaseConfig.messagingSenderId || 'MISSING!'}`);
  console.log(`[NExVERSE Firebase Debug Client] App ID: ${firebaseConfig.appId || 'MISSING!'}`);
  console.log(`[NExVERSE Firebase Debug Client] Measurement ID: ${firebaseConfig.measurementId || 'NOT SET (optional)'}`);

  if (!firebaseConfig.apiKey) {
    console.error('[NExVERSE Firebase Debug Client] CRITICAL: Firebase API Key is MISSING or UNDEFINED in the client-side config.');
  }
  if (!firebaseConfig.authDomain) {
    console.error('[NExVERSE Firebase Debug Client] CRITICAL: Firebase Auth Domain is MISSING or UNDEFINED in the client-side config. For Google Sign-in, this MUST be "[YOUR_PROJECT_ID].firebaseapp.com" (e.g., "nexverse-2cc70.firebaseapp.com") AND this domain must be added to "Authorized Domains" in your Firebase project settings (Authentication > Sign-in method). Your main app domain (e.g., "nexverse-2cc70.web.app") also needs to be authorized.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storageInstance: FirebaseStorage; // Renamed to avoid conflict with imported 'storage' function

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
    storageInstance = getStorage(app);
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
  storageInstance = getStorage(app);
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
// 3. The `authDomain` in your `firebaseConfig` (loaded from environment variables/secrets via `process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`)
//    MUST be `[YOUR_PROJECT_ID].firebaseapp.com`.
// 4. Double check the VALUE of your `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN_SECRET` in Google Secret Manager. It must be exactly `nexverse-2cc70.firebaseapp.com`.
// 5. Ensure the App Hosting service account has "Secret Manager Secret Accessor" permission for this secret.
// 6. VERY IMPORTANT FOR FIREBASE STUDIO / CLOUD WORKSTATIONS: The specific domain of your development environment
//    (e.g., `6000-firebase-studio-1749913046111.cluster-ikxjzjhlifcwuroomfkjrx437g.cloudworkstations.dev`)
//    MUST ALSO be added to the "Authorized domains" list in the Firebase Console. The Firebase SDK error message often indicates this domain.

export { app, auth, db, analytics, storageInstance as storage, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId };
