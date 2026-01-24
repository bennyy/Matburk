import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithPopup,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const config = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyDummyKeyForEmulator',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'localhost',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'demo-project',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || 'dummy-app-id',
};

// Use emulator ONLY when explicitly enabled
const useEmulator = import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true';

if (useEmulator) {
  console.log('🔥 Using Firebase Auth Emulator on localhost:9099');
}

const firebaseApp = initializeApp(config);
const auth = getAuth(firebaseApp);

// Connect to Auth Emulator in development if needed
if (useEmulator && !auth.emulatorConfig) {
  connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
}

const provider = new GoogleAuthProvider();

// In emulator, avoid real Google OAuth. Use anonymous sign-in for dev.
const signInWithGoogle = () =>
  useEmulator ? signInAnonymously(auth) : signInWithPopup(auth, provider);
const logout = () => signOut(auth);

const signInWithEmailPassword = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

export {
  auth,
  logout,
  onAuthStateChanged,
  onIdTokenChanged,
  signInWithGoogle,
  signInWithEmailPassword,
};
