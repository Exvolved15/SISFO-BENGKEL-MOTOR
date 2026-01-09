// public/js/firebaseAuth.js (Pastikan syntaxnya menggunakan ES Module)

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";

// GANTI DENGAN KONFIGURASI PROYEK FIREBASE ANDA!
const firebaseConfig = {
    apiKey: "AIzaSyBNclQBPgOf9wS0hCM6jsWerAJ_-mz_AOA",
    authDomain: "bengkelan-motor.firebaseapp.com",
    projectId: "bengkelan-motor",
    storageBucket: "bengkelan-motor.firebasestorage.app",
    messagingSenderId: "86184705378",
    appId: "1:86184705378:web:018c12ce6261c9a522c03b",
    measurementId: "G-5WMTCL5G9R"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

export default auth;