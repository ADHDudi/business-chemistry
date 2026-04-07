import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyB9O_r05qM539ioQU7bBCgf__-GR6rg_pw",
    authDomain: "business-chemistry.firebaseapp.com",
    projectId: "business-chemistry",
    storageBucket: "business-chemistry.firebasestorage.app",
    messagingSenderId: "28475858240",
    appId: "1:28475858240:web:0e9005fa20c7f19fa42ea5",
    measurementId: "G-VQWGCEZW6L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const functions = getFunctions(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

