// src/config/firebase.js


const path = require('path'); // <-- Panggil modul path
const admin = require('./firebaseAuth');
// Path ke file JSON kunci Service Account Anda
// Gunakan path.resolve untuk mendapatkan path absolut
const serviceAccountPath = path.resolve(__dirname, '..', '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

// Perbaikan: Lakukan require pada path yang sudah di-resolve
const serviceAccount = require(serviceAccountPath); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = require('./firebaseAuth');