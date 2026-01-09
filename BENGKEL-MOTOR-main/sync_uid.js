// sync_uid.js
require('dotenv').config();
const mongoose = require('mongoose');
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // Pastikan file ini ada
const User = require('./src/models/User');

// 1. Inisialisasi Firebase
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount)
    });
}

const syncUID = async () => {
    try {
        console.log("🔄 Menghubungkan ke database...");
        await mongoose.connect(process.env.MONGO_URI);

        const emailTarget = "admin@gmail.com";

        // 2. Ambil User dari Firebase Cloud (Bukan buat baru)
        console.log(`🔍 Mencari user ${emailTarget} di Firebase...`);
        const firebaseUser = await admin.auth().getUserByEmail(emailTarget);
        
        console.log(`✅ User Ditemukan!`);
        console.log(`   UID Asli: ${firebaseUser.uid}`);

        // 3. Update UID di MongoDB Lokal
        const result = await User.findOneAndUpdate(
            { email: emailTarget }, 
            { uid: firebaseUser.uid }, // Timpa UID dummy dengan UID asli
            { new: true }
        );

        if (result) {
            console.log("🎉 BERHASIL! Database Lokal sudah disinkronkan.");
            console.log("👉 Sekarang coba LOGIN (bukan register) di website.");
        } else {
            console.log("❌ Gagal: User admin tidak ditemukan di MongoDB Lokal. Jalankan 'node seeder.js' dulu.");
        }

        process.exit();

    } catch (error) {
        console.error("❌ Error:", error.message);
        process.exit(1);
    }
};

syncUID();