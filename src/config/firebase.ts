
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDJBYLMS_bhvYhlywLAwC3daHQZMKUFCZI",
  authDomain: "hostel-management-system-9b9fb.firebaseapp.com",
  projectId: "hostel-management-system-9b9fb",
  storageBucket: "hostel-management-system-9b9fb.firebasestorage.app",
  messagingSenderId: "320452771783",
  appId: "1:320452771783:web:a97e02529051d1c38be3e2",
  measurementId: "G-DEC6BJ3V51"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Only initialize analytics if window is defined (browser environment)
const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
export { analytics };

export default app;
