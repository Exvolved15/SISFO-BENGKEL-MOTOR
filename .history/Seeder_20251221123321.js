require('dotenv').config();
const mongoose = require('mongoose');

// Import Model
const Service = require('./src/models/Service');
const Part = require('./src/models/Part');

// --- 1. DATA SUKU CADANG (10 ITEM) ---
// Ditambahkan sellingPrice dan purchasePrice agar lolos validasi
const partsData = [
    { name: "Oli Yamalube Matic (0.8L)", code: "PART-01", purchasePrice: 45000, sellingPrice: 55000, stock: 50, description: "Oli matic standar Yamaha", isPart: true },
    { name: "Oli Honda MPX2 (0.8L)", code: "PART-02", purchasePrice: 40000, sellingPrice: 50000, stock: 45, description: "Oli matic standar Honda", isPart: true },
    { name: "Kampas Rem Depan Beat", code: "PART-03", purchasePrice: 30000, sellingPrice: 45000, stock: 20, description: "Kampas rem cakram depan", isPart: true },
    { name: "Kampas Rem Belakang", code: "PART-04", purchasePrice: 25000, sellingPrice: 35000, stock: 25, description: "Kampas rem tromol belakang", isPart: true },
    { name: "Busi NGK Standard", code: "PART-05", purchasePrice: 15000, sellingPrice: 25000, stock: 100, description: "Busi standar motor", isPart: true },
    { name: "Roller CVT 10gr (Set)", code: "PART-06", purchasePrice: 45000, sellingPrice: 60000, stock: 15, description: "Roller racing/standar", isPart: true },
    { name: "Vanbelt Mio Sporty", code: "PART-07", purchasePrice: 70000, sellingPrice: 85000, stock: 10, description: "V-belt original Yamaha", isPart: true },
    { name: "Filter Udara NMAX", code: "PART-08", purchasePrice: 40000, sellingPrice: 55000, stock: 12, description: "Saringan udara motor NMAX", isPart: true },
    { name: "Ban Luar IRC 80/90-14", code: "PART-09", purchasePrice: 180000, sellingPrice: 210000, stock: 8, description: "Ban tubeless ring 14", isPart: true },
    { name: "Aki GS Astra (Kering)", code: "PART-10", purchasePrice: 210000, sellingPrice: 250000, stock: 5, description: "Aki kering bebas perawatan", isPart: true }
];

// --- 2. DATA JASA SERVIS (10 ITEM) ---
const servicesData = [
    { serviceName: "Service Ringan / Tune Up", serviceCode: "SRV-01", price: 65000, isPart: false },
    { serviceName: "Ganti Oli (Jasa)", serviceCode: "SRV-02", price: 10000, isPart: false },
    { serviceName: "Service CVT", serviceCode: "SRV-03", price: 45000, isPart: false },
    { serviceName: "Service Besar", serviceCode: "SRV-04", price: 250000, isPart: false },
    { serviceName: "Ganti Kampas Rem", serviceCode: "SRV-05", price: 20000, isPart: false },
    { serviceName: "Tambal Ban Tubeless", serviceCode: "SRV-06", price: 15000, isPart: false },
    { serviceName: "Ganti Ban Luar", serviceCode: "SRV-07", price: 25000, isPart: false },
    { serviceName: "Cas Aki / Accu", serviceCode: "SRV-08", price: 15000, isPart: false },
    { serviceName: "Ganti Lampu Utama", serviceCode: "SRV-09", price: 5000, isPart: false },
    { serviceName: "Cek Kelistrikan", serviceCode: "SRV-10", price: 50000, isPart: false }
];

const importData = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bengkel_db');
        console.log(`🔌 Terhubung ke Database: ${conn.connection.host}`);

        // 1. Bersihkan Data Suku Cadang & Jasa (User Tidak Disentuh)
        console.log("🗑️ Menghapus data Part & Service lama...");
        await Service.deleteMany();
        await Part.deleteMany();

        // 2. Masukkan Data Baru
        console.log("📦 Mengisi data baru...");
        await Part.insertMany(partsData);
        await Service.insertMany(servicesData);
        
        console.log("✅ SEEDER BERHASIL!");
        console.log(`   - ${partsData.length} Suku Cadang`);
        console.log(`   - ${servicesData.length} Jasa Servis`);
        
        process.exit();
    } catch (error) {
        console.error(`❌ Gagal Import Data: ${error.message}`);
        process.exit(1);
    }
};

importData();