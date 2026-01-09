// seeder.js - VERSI FIX UID
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User'); 
const Service = require('./src/models/Service');

// Data Dummy Suku Cadang & Jasa
const servicesData = [
    // --- JASA (isPart: false) ---
    { name: "Service Ringan / Tune Up", code: "SRV-01", price: 65000, stock: 0, isPart: false },
    { name: "Ganti Oli (Jasa)", code: "SRV-02", price: 15000, stock: 0, isPart: false },
    { name: "Service CVT", code: "SRV-03", price: 45000, stock: 0, isPart: false },
    
    // --- SUKU CADANG (isPart: true) ---
    { name: "Oli Yamalube Matic", code: "PART-01", price: 55000, stock: 24, isPart: true },
    { name: "Kampas Rem Depan Beat", code: "PART-02", price: 45000, stock: 10, isPart: true },
    { name: "Vanbelt Mio", code: "PART-03", price: 95000, stock: 5, isPart: true },
    { name: "Busi NGK", code: "PART-04", price: 25000, stock: 50, isPart: true }
];

// Data Dummy User (DITAMBAHKAN UID)
const usersData = [
    {
        name: "Super Admin",
        email: "admin@gmail.com", 
        password: "password123",
        role: "admin",
        uid: "dummy_uid_admin_123" // <--- Perbaikan di sini
    },
    {
        name: "Kasir Bengkel",
        email: "kasir@gmail.com",
        password: "password123",
        role: "kasir",
        uid: "dummy_uid_kasir_456" // <--- Perbaikan di sini
    },
    {
        name: "Mekanik Handal",
        email: "mekanik@gmail.com",
        password: "password123",
        role: "mekanik",
        uid: "dummy_uid_mekanik_789" // <--- Perbaikan di sini
    }
];

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🔌 Terhubung ke Database...");

        // 1. BERSIHKAN DATA LAMA
        await User.deleteMany();
        await Service.deleteMany();
        console.log("🗑️  Data lama dihapus...");

        // 2. MASUKKAN DATA BARU
        await User.insertMany(usersData);
        await Service.insertMany(servicesData);
        
        console.log("✅ Data User (dengan UID), Jasa, & Sparepart BERHASIL di-import!");
        process.exit();
    } catch (error) {
        console.error(`❌ Gagal Import Data: ${error.message}`);
        process.exit(1);
    }
};

importData();