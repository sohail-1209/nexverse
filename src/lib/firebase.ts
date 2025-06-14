
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, orderBy, limit, startAfter, documentId } from 'firebase/firestore'; // Added Firestore functions
import { getAnalytics, Analytics } from 'firebase/analytics';
import { getStorage, FirebaseStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'; // Added Storage functions

// Your web app's Firebase configuration
// IMPORTANT: These should be set in your .env file
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Log the authDomain to help debug authorization issues
if (typeof window !== 'undefined') {
  console.log('Firebase Auth Domain being used by the app:', firebaseConfig.authDomain);
}

let app: FirebaseApp;
let analytics: Analytics | undefined;
let storage: FirebaseStorage;

if (!getApps().length) {
  app = initializeApp(firebaseConfig);
  if (typeof window !== 'undefined') {
    // Initialize Analytics only on the client side
    analytics = getAnalytics(app);
  }
  storage = getStorage(app);
} else {
  app = getApps()[0];
  if (typeof window !== 'undefined') {
    // Ensure analytics is initialized if app already exists
    try {
      analytics = getAnalytics(app);
    } catch (e) {
      console.error("Failed to initialize Analytics:", e);
    }
  }
  storage = getStorage(app); // Ensure storage is initialized if app already exists
}

const auth: Auth = getAuth(app);
const db: Firestore = getFirestore(app);

export { app, auth, db, analytics, storage, collection, addDoc, serverTimestamp, doc, setDoc, getDoc, getDocs, query, where, deleteDoc, updateDoc, ref, uploadBytes, getDownloadURL, deleteObject, orderBy, limit, startAfter, documentId };

