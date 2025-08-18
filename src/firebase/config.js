// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// --- ¡IMPORTANTE! USA TUS CREDENCIALES REALES AQUÍ ---
const firebaseConfig = {
  apiKey: "AIzaSyC_X_Ex30hkD-bE0amCpuu9tipo-0x1AZo", // Pega tu apiKey
  authDomain: "power-service-f513f.firebaseapp.com", // Pega tu authDomain
  projectId: "power-service-f513f", // Pega tu projectId
  storageBucket: "power-service-f513f.firebasestorage.app", // Pega tu storageBucket
  messagingSenderId: "1429369870122", // Pega tu messagingSenderId
  appId: "1:429369870122:web:1f151f86a3a3435fff4053", // Pega tu appId
};
// ----------------------------------------------------

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);