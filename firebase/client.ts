// Import the functions you need from the SDKs you need
import { initializeApp, getApp, getApps } from "firebase/app";
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'


// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAUkHPDMfRT14UWf5XDN8u5Mvd5ez8_dBc",
  authDomain: "prepwise-3e2a8.firebaseapp.com",
  projectId: "prepwise-3e2a8",
  storageBucket: "prepwise-3e2a8.firebasestorage.app",
  messagingSenderId: "981737850497",
  appId: "1:981737850497:web:4e383e6dcdee379e286f80",
  measurementId: "G-P1D6Y66X2Q"
};

// Initialize Firebase
const app = !getApps.length ? initializeApp(firebaseConfig) : getApp()

export const auth = getAuth(app)
export const db = getFirestore(app)