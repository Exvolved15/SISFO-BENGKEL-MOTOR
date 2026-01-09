// src/config/firebase.js

const admin = require('firebase-admin');
const path = require('path'); // <-- Panggil modul path

// Path ke file JSON kunci Service Account Anda
// Gunakan path.resolve untuk mendapatkan path absolut
const serviceAccountPath = path.resolve(__dirname, '..', '..', process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

// Perbaikan: Lakukan require pada path yang sudah di-resolve
const serviceAccount = require(serviceAccountPath); 

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});
const admin = require('./firebaseAuth');
module.exports = require('./firebaseAuth');