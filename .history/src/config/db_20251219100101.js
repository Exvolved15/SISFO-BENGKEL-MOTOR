const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        // Opsi ini memastikan kompatibilitas dengan MongoDB versi baru
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`✅ MongoDB LOKAL Terhubung: ${conn.connection.host}`);
    } catch (error) {
        console.error(`❌ Error koneksi DB: ${error.message}`);
        
        // Deteksi jika MongoDB belum dinyalakan (Error Connection Refused)
        if (error.message.includes('ECONNREFUSED')) {
            console.error("⚠️  SARAN: Sepertinya MongoDB belum nyala. Cek 'MongoDB Compass' atau Services Windows.");
        }
        
        process.exit(1);
    }
};

module.exports = connectDB;