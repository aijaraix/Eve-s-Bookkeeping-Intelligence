import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
let rawFirebaseConfig: any = {};
try {
  // @ts-ignore
  rawFirebaseConfig = (import.meta as any).env?.VITE_FIREBASE_CONFIG ? JSON.parse((import.meta as any).env.VITE_FIREBASE_CONFIG) : {};
} catch (e) {
  rawFirebaseConfig = {};
}

const resolvedApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || rawFirebaseConfig.apiKey || 'placeholder-key';

const firebaseConfig = {
  apiKey: resolvedApiKey,
  authDomain: rawFirebaseConfig.authDomain || 'placeholder.firebaseapp.com',
  projectId: rawFirebaseConfig.projectId || 'placeholder-project',
  storageBucket: rawFirebaseConfig.storageBucket || 'placeholder.appspot.com',
  messagingSenderId: rawFirebaseConfig.messagingSenderId || '1234567890',
  appId: rawFirebaseConfig.appId || '1:1234567890:web:abcdef'
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app, rawFirebaseConfig.firestoreDatabaseId || undefined);
export const googleProvider = new GoogleAuthProvider();

export {
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged
};
export type { User };

