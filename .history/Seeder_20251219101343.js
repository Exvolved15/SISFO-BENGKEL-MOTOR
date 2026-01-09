require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User'); 
const Service = require('./src/models/Service');

// Data Dummy Jasa & Sparepart
const servicesData = [
    // --- JASA (isPart: false) ---
    { name: "Service Ringan / Tune Up", code: "SRV-01", price: 65000, stock: 0, isPart: false },
    { name: "Ganti Oli (Jasa)", code: "SRV-02", price: 15000, stock: 0, isPart: false },
    { name: "Service CVT", code: "SRV-03", price: 45000, stock: 0, isPart: false },
    { name: "Service Besar", code: "SRV-04", price: 150000, stock: 0, isPart: false },
    
    // --- SUKU CADANG (isPart: true) ---
    { name: "Oli Yamalube Matic", code: "PART-01", price: 55000, stock: 24, isPart: true },
    { name: "Kampas Rem Depan Beat", code: "PART-02", price: 45000, stock: 10, isPart: true },
    { name: "Vanbelt Mio", code: "PART-03", price: 95000, stock: 5, isPart: true },
    { name: "Busi NGK", code: "PART-04", price: 25000, stock: 50, isPart: true },
    { name: "Roller CVT", code: "PART-05", price: 60000, stock: 15, isPart: true }
];

// Data Dummy User (DENGAN UID DUMMY)
const usersData = [
    {
        name: "Super Admin",
        email: "admin@gmail.com", 
        password: "123456",
        role: "admin",
        uid: "UID_ADMIN_SEMENTARA" // Nanti kita ganti dengan UID asli dari Firebase
    },
    {
        name: "Kasir Bengkel",
        email: "kasir@gmail.com",
        password: "123456",
        role: "kasir",
        uid: "UID_KASIR_SEMENTARA"
    },
    {
        name: "Mekanik Handal",
        email: "mekanik@gmail.com",
        password: "123456",
        role: "mekanik",
        uid: "UID_MEKANIK_SEMENTARA"
    }
];

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Terhubung ke Database Lokal...");

        // 1. BERSIHKAN DATA LAMA
        await User.deleteMany();
        await Service.deleteMany();
        console.log("🗑️  Data lama dihapus...");

        // 2. MASUKKAN DATA BARU
        await User.insertMany(usersData);
        await Service.insertMany(servicesData);
        
        console.log("✅ Data User (dengan UID Dummy), Jasa, & Sparepart BERHASIL di-import!");
        process.exit();
    } catch (error) {
        console.error(`❌ Gagal Import Data: ${error.message}`);
        process.exit(1);
    }
};

importData();