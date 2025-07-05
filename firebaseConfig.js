// firebaseConfig.js

import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Tus credenciales de Firebase
const firebaseConfig = {
  // Pega aquí tu API Key completa y correcta
  apiKey: "AIzaSyAnaqczLjjVstuJUp8Rl-xIWJC-U6mrQiM", 
  authDomain: "mrplan-f15a2.firebaseapp.com",
  projectId: "mrplan-f15a2",
  storageBucket: "mrplan-f15a2.firebasestorage.app",
  messagingSenderId: "304281994978",
  appId: "1:304281994978:web:9b4d567a1bcac8f9d7c0bb"
};

// --- PUNTO ÚNICO DE INICIALIZACIÓN ---

// 1. Inicializa la App de Firebase
const app = initializeApp(firebaseConfig);

// 2. Inicializa la Autenticación con persistencia
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});

// 3. Inicializa Firestore
const db = getFirestore(app);

// --- EXPORTAMOS LAS INSTANCIAS ---
export { app, auth, db };
