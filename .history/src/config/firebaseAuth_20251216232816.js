// src/config/firebaseAuth.js

const admin = require('firebase-admin');

// 1. Path ke Kunci Layanan (Sesuaikan path ini)
// Dari src/config/ ke root/firebase-key.json
const serviceAccount = require('../../firebase-key.json'); 

// 2. Inisiasi Firebase Admin SDK
try {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
    console.log("Firebase Admin SDK berhasil diinisiasi.");
} catch (error) {
    // Menghindari inisiasi ganda jika server di-hot-reload
    if (!admin.apps.length) { // <--- Pastikan kondisi ini digunakan
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
        console.log("[CONFIG] Firebase Admin SDK berhasil diinisiasi.");
    } else {
        console.log("[CONFIG] Firebase Admin SDK sudah terinisiasi. Melewati inisiasi ganda.");
    }
}

// 3. Ekspor objek admin yang sudah terinisiasi
module.exports = admin;