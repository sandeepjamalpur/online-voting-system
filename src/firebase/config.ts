import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, getDoc, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase client
const app = initializeApp(firebaseConfig);

// CRITICAL: The app will break without specifying firestoreDatabaseId
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test per skill instructions
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
      return false;
    }
    // Any other response (like permission-denied or document-not-found) means connection succeeded
    return true;
  }
}

export async function ensureDefaultAdminInFirestore(): Promise<void> {
  try {
    const adminRef = doc(db, 'admins', 'admin_1');
    const snap = await getDoc(adminRef);
    if (!snap.exists()) {
      await setDoc(adminRef, {
        id: 'admin_1',
        fullName: 'Prof. Sandeep Jamalpur',
        collegeName: '',
        username: 'admin',
        email: 'jamalpursandeep41@gmail.com',
        password: 'admin',
        createdAt: new Date().toISOString(),
      });
    }
  } catch (err) {
    console.warn('[Firebase] Default admin check note:', err);
  }
}

// Execute connection verification and default admin seeding on boot
if (typeof window !== 'undefined') {
  testConnection();
  ensureDefaultAdminInFirestore();
}

export default app;
