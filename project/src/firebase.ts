import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Get Firebase configuration from environment variables or use fallback values for production
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDYMXMQ-YoKuuJgGQCZeS5GFOQhqEhZVvM",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "inkstall-enrollment.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "inkstall-enrollment",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "inkstall-enrollment.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1234567890",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:1234567890:web:abcdef1234567890",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-ABCDEF1234"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore, Auth and Storage
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Sign in anonymously
const signInUser = async () => {
  try {
    await signInAnonymously(auth);
  } catch (error) {
    console.error('Error signing in anonymously:', error);
  }
};

// Sign in immediately
signInUser();

export { db, auth, storage };