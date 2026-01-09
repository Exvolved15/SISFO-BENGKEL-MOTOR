// src/config/firebase.js

const admin = require('firebase-admin');

// Path ke file JSON kunci Service Account Anda
const serviceAccount = require(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

module.exports = admin;