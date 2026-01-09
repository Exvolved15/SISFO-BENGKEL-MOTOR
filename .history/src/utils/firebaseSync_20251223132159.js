// [LOKASI]: src/utils/firebaseSync.js
const admin = require('firebase-admin');

/**
 * Fungsi sinkronisasi yang aman dari bug tipe data
 */
const syncToFirebase = async (collectionName, doc) => {
    if (!doc) return;

    try {
        // Konversi ke JSON mentah agar ObjectId MongoDB menjadi String
        const data = JSON.parse(JSON.stringify(doc));
        
        // Hapus field internal MongoDB agar Firebase tetap bersih
        delete data.__v;

        const db = admin.database();
        await db.ref(`backups/${collectionName}/${data._id}`).set(data);
        
        console.log(`[SYNC SUCCESS] ${collectionName} ID: ${data._id} terbackup.`);
    } catch (error) {
        console.error(`[SYNC ERROR] Gagal backup ke Firebase: ${error.message}`);
        // Di sini Anda bisa menambahkan sistem log file jika perlu
    }
};

module.exports = { syncToFirebase };