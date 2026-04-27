import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyCpoRMPnXKp4OKLsKr2RiceGlgAGcPJKO0",
    authDomain: "mishna-yomit-7cecd.firebaseapp.com",
    projectId: "mishna-yomit-7cecd",
    storageBucket: "mishna-yomit-7cecd.firebasestorage.app",
    messagingSenderId: "826189234717",
    appId: "1:826189234717:web:87ae635d05136763043cf4",
    measurementId: "G-7ZXK802PSN"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
