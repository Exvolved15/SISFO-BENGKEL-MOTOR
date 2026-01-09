// src/config/firebase.js (Sumber Tunggal)

const admin = require('firebase-admin');
// Pastikan path ke file kunci layanan benar dari src/config/
const serviceAccount = require('../../firebase-service-account.json'); 

if (admin.apps.length === 0) { // <--- Pastikan kondisi ini paling aman
    admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // Ganti URL di bawah dengan URL Realtime Database Anda dari Firebase Console
    databaseURL: "https://bengkelan-motor-default-rtdb.asia-southeast1.firebasedatabase.app/" 
    });
    console.log("[CONFIG] Firebase Admin SDK berhasil diinisiasi.");
} else {
    console.log("[CONFIG] Firebase Admin SDK sudah terinisiasi. Menggunakan instance yang sudah ada.");
}

module.exports = admin;