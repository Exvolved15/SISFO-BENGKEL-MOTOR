const admin = require("firebase-admin");

// Fungsi Helper untuk Backup
const backupToFirebase = async (collectionName, doc) => {
  try {
    const data = doc.toObject ? doc.toObject() : doc;
    // Hapus field sensitif jika ada
    delete data.__v; 
    
    await admin.database().ref(`backups/${collectionName}/${data._id}`).set(data);
    console.log(`[Firebase Backup] Success: ${collectionName} ID: ${data._id}`);
  } catch (error) {
    console.error(`[Firebase Backup] Failed: ${error.message}`);
  }
};

module.exports = { backupToFirebase };