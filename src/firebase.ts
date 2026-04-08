import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigData from '../firebase-applet-config.json';

// Helper to get value with fallback and strip quotes
const getVal = (envVal: string | undefined, configVal: string) => {
  let val = envVal;
  if (!val || val.trim() === '' || val.startsWith('MY_')) {
    val = configVal;
  }
  // Strip surrounding quotes if present
  return val.replace(/^["'](.+)["']$/, '$1');
};

const firebaseConfig = {
  apiKey: getVal(import.meta.env.VITE_FIREBASE_API_KEY, firebaseConfigData.apiKey),
  authDomain: getVal(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseConfigData.authDomain),
  projectId: getVal(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseConfigData.projectId),
  storageBucket: getVal(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseConfigData.storageBucket),
  messagingSenderId: getVal(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseConfigData.messagingSenderId),
  appId: getVal(import.meta.env.VITE_FIREBASE_APP_ID, firebaseConfigData.appId),
};

const firestoreDatabaseId = getVal(import.meta.env.VITE_FIREBASE_DATABASE_ID, firebaseConfigData.firestoreDatabaseId);

const app = initializeApp(firebaseConfig);

// Debug log for connection (masking API key)
console.log(`[Firebase] Inicializado para o projeto: ${firebaseConfig.projectId}`);
if (import.meta.env.PROD) {
  console.log(`[Firebase] Ambiente de Produção detectado.`);
}

// If databaseId is '(default)' or empty, use the default database by not passing the second argument
export const db = (firestoreDatabaseId && firestoreDatabaseId !== '(default)') 
  ? getFirestore(app, firestoreDatabaseId) 
  : getFirestore(app);
export const auth = getAuth(app);
