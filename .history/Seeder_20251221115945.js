require('dotenv').config();
const mongoose = require('mongoose');

// Pastikan path model sesuai dengan struktur folder Anda
const User = require('./src/models/User'); 
const Service = require('./src/models/Service');
const Part = require('./src/models/Part'); // Kita butuh model Part terpisah agar Controller jalan

// --- 1. DATA SUKU CADANG (10 ITEM) ---
const partsData = [
    { name: "Oli Yamalube Matic (0.8L)", code: "PART-01", price: 55000, stock: 50, description: "Oli matic standar Yamaha" },
    { name: "Oli Honda MPX2 (0.8L)", code: "PART-02", price: 50000, stock: 45, description: "Oli matic standar Honda" },
    { name: "Kampas Rem Depan (Beat/Vario)", code: "PART-03", price: 45000, stock: 20, description: "Kampas rem cakram depan" },
    { name: "Kampas Rem Belakang (Universal)", code: "PART-04", price: 35000, stock: 25, description: "Kampas rem tromol belakang" },
    { name: "Busi NGK Standard", code: "PART-05", price: 25000, stock: 100, description: "Busi standar motor bebek/matic" },
    { name: "Roller CVT 10gr (Set)", code: "PART-06", price: 60000, stock: 15, description: "Roller racing/standar" },
    { name: "Vanbelt Mio Sporty", code: "PART-07", price: 85000, stock: 10, description: "V-belt original Yamaha" },
    { name: "Filter Udara NMAX", code: "PART-08", price: 55000, stock: 12, description: "Saringan udara motor NMAX" },
    { name: "Ban Luar IRC 80/90-14", code: "PART-09", price: 210000, stock: 8, description: "Ban tubeless ring 14" },
    { name: "Aki GS Astra (Kering)", code: "PART-10", price: 250000, stock: 5, description: "Aki kering bebas perawatan" }
];

// --- 2. DATA JASA SERVIS (10 ITEM) ---
const servicesData = [
    { serviceName: "Service Ringan / Tune Up", serviceCode: "SRV-01", price: 65000, isPart: false },
    { serviceName: "Ganti Oli (Jasa)", serviceCode: "SRV-02", price: 10000, isPart: false }, // Harga jasa ganti oli
    { serviceName: "Service CVT (Pembersihan)", serviceCode: "SRV-03", price: 45000, isPart: false },
    { serviceName: "Service Besar / Turun Mesin", serviceCode: "SRV-04", price: 250000, isPart: false },
    { serviceName: "Ganti Kampas Rem", serviceCode: "SRV-05", price: 20000, isPart: false },
    { serviceName: "Tambal Ban Tubeless", serviceCode: "SRV-06", price: 15000, isPart: false },
    { serviceName: "Ganti Ban Luar", serviceCode: "SRV-07", price: 25000, isPart: false },
    { serviceName: "Cas Aki / Accu", serviceCode: "SRV-08", price: 15000, isPart: false },
    { serviceName: "Ganti Lampu Utama", serviceCode: "SRV-09", price: 5000, isPart: false },
    { serviceName: "Cek Kelistrikan / Reset ECU", serviceCode: "SRV-10", price: 50000, isPart: false }
];

// --- 3. DATA USER (MEKANIK & ADMIN) ---


const importData = async () => {
    try {
        // Gunakan MONGO_URI dari env atau fallback ke localhost
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bengkel_db');
        console.log(`🔌 Terhubung ke Database: ${conn.connection.host}`);

        // 1. BERSIHKAN DATA LAMA
        console.log("🗑️  Menghapus data lama...");
        await User.deleteMany();
        await Service.deleteMany();
        await Part.deleteMany(); // Hapus parts juga

        // 2. MASUKKAN DATA BARU
        console.log("📦 Mengisi data baru...");
        
        // Simpan User (create agar hook hash password jalan jika ada)
        
        
        // Simpan Suku Cadang ke Collection 'parts'
        await Part.insertMany(partsData);

        // Simpan Jasa ke Collection 'services'
        await Service.insertMany(servicesData);
        
        console.log("✅ SEEDER SUKSES!");
        console.log(`   - ${partsData.length} Suku Cadang`);
        console.log(`   - ${servicesData.length} Jasa Servis`);
        console.log(`   - ${usersData.length} User`);
        
        process.exit();
    } catch (error) {
        console.error(`❌ Gagal Import Data: ${error.message}`);
        process.exit(1);
    }
};

importData();