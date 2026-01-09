// sisfo-bengkel-baru/src/config/db.js

const mongoose = require('mongoose');

// Fungsi untuk menghubungkan ke database
const connectDB = async () => {
    try {
        // Gunakan variabel lingkungan untuk URL koneksi
        const conn = await mongoose.connect(process.env.MONGO_URI);

        console.log(`MongoDB Terhubung: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error koneksi DB: ${error.message}`);
        // Keluar dari proses jika koneksi gagal
        process.exit(1);
    }
};

module.exports = connectDB;