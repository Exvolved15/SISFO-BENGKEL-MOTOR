// fix_uid.js
require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Pastikan file ini ada
const User = require('./src/models/User');

// 1. Inisialisasi Firebase Admin (Hanya untuk script ini)
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const syncAdminUID = async () => {
    try {
        console.log("🔄 Menghubungkan ke MongoDB & Firebase...");
        await mongoose.connect(process.env.MONGO_URI);

        const emailTarget = "admin@gmail.com";

        // 2. Cek User di Firebase Cloud
        let firebaseUser;
        try {
            firebaseUser = await admin.auth().getUserByEmail(emailTarget);
            console.log(`✅ User ditemukan di Firebase! UID Asli: ${firebaseUser.uid}`);
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                console.log("⚠️ User belum ada di Firebase. Membuat baru...");
                firebaseUser = await admin.auth().createUser({
                    email: emailTarget,
                    password: "password123", // Password default jika baru dibuat
                    emailVerified: true
                });
                console.log(`✅ User baru dibuat di Firebase. UID: ${firebaseUser.uid}`);
            } else {
                throw error;
            }
        }

        // 3. Update User di MongoDB Lokal
        const result = await User.findOneAndUpdate(
            { email: emailTarget }, // Cari admin berdasarkan email
            { uid: firebaseUser.uid }, // Update UID-nya
            { new: true } // Kembalikan data terbaru
        );

        if (result) {
            console.log("🎉 BERHASIL! Database Lokal sudah sinkron.");
            console.log(`👉 Admin: ${result.email}`);
            console.log(`👉 UID Baru: ${result.uid}`);
        } else {
            console.error("❌ Gagal: User admin tidak ditemukan di MongoDB Lokal. Jalankan 'node seeder.js' dulu.");
        }

        process.exit();

    } catch (error) {
        console.error("❌ Terjadi Error:", error.message);
        process.exit(1);
    }
};

syncAdminUID();