// src/firebase/config.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyC_X_Ex30hkD-bE0amCpuu9tipo-0x1AZo",
  authDomain: "power-service-f513f.firebaseapp.com",
  projectId: "power-service-f513f",
  storageBucket: "power-service-f513f.firebasestorage.app",
  messagingSenderId: "429369870122",
  appId: "1:429369870122:web:1f151f86a3a3435fff4053"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);