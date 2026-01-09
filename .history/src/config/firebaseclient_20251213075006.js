// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);

export default auth;