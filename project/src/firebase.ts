import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Get Firebase configuration from environment variables or use fallback values for production
const firebaseConfig = {
  apiKey: "AIzaSyCwbbwDTUIw0NeHpaeOKL2fMn2JsiEX-f4",
  authDomain: "questo-59b77.firebaseapp.com",
  projectId: "questo-59b77",
  storageBucket: "questo-59b77.firebasestorage.app",
  messagingSenderId: "104723841839",
  appId: "1:104723841839:web:de544b70f6619d185857da",
  measurementId: "G-VPJRRTR992"
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
