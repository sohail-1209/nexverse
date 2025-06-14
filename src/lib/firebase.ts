
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId } from 'firebase/firestore'; // Added Firestore functions
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added Storage functions

// Your web app's Firebase configuration
// IMPORTANT: These should be set in your .env file locally, and as secrets in App Hosting
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
  console.log('[Firebase Init] Attempting to initialize Firebase with Project ID:', firebaseConfig.projectId || 'PROJECT_ID_NOT_FOUND');
  if (!firebaseConfig.apiKey) {
    console.warn('[Firebase Init] Firebase API Key is missing or undefined in the environment.');
  }
}


let app: FirebaseApp;
let analytics: Analytics | undefined;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    // Initialize Analytics only on the client side
    try {
      if (firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      } else {
        console.warn('[Firebase Init] Firebase Measurement ID is missing. Analytics will not be initialized.');
      }
    } catch (e) {
      console.error("[Firebase Init] Failed to initialize Analytics:", e);
    }
  }
  storage = getStorage(app);
} else {
  app = getApps()[0];
  if (typeof window !== 'undefined') {
    // Ensure analytics is initialized if app already exists
    try {
      if (firebaseConfig.measurementId) {
        analytics = getAnalytics(app);
      }
    } catch (e) {
      // console.error("[Firebase Init] Failed to re-initialize Analytics:", e); // Usually not needed to log this
    }
  }
  storage = getStorage(app); // Ensure storage is initialized if app already exists
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, analytics, storage, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId };
