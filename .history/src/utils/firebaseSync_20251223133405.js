// [LOKASI]: src/utils/firebaseSync.js
const admin = require('../config/firebase');

/**
 * Fungsi sinkronisasi yang aman dari bug tipe data
 */
const syncToFirebase = async (collectionName, doc) => {
    if (!doc) return;
    try {
        const data = JSON.parse(JSON.stringify(doc));
        delete data.__v;

        const db = admin.database();
        // Menyimpan ke folder backups/nama_koleksi/id_mongo
        await db.ref(`backups/${collectionName}/${data._id}`).set(data);
        
        console.log(`[SYNC] ${collectionName} berhasil dicadangkan.`);
    } catch (error) {
        console.error(`[SYNC ERROR] ${error.message}`);
    }
};

module.exports = { syncToFirebase };