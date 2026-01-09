require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const Part = require('./src/models/Part');
const Motor = require('./src/models/Motor'); // Import model Motor
const partsData = [
    { name: "Oli Yamalube Matic (0.8L)", code: "PART-01", purchasePrice: 45000, sellingPrice: 55000, price: 55000, stock: 50, supplier: "Yamaha Part Center", description: "Oli matic standar Yamaha", isPart: true },
    { name: "Oli Honda MPX2 (0.8L)", code: "PART-02", purchasePrice: 40000, sellingPrice: 50000, price: 50000, stock: 45, supplier: "Astra Honda Motor", description: "Oli matic standar Honda", isPart: true },
    { name: "Kampas Rem Depan Beat", code: "PART-03", purchasePrice: 30000, sellingPrice: 45000, price: 45000, stock: 20, supplier: "Federal Parts", description: "Kampas rem cakram depan", isPart: true },
    { name: "Kampas Rem Belakang", code: "PART-04", purchasePrice: 25000, sellingPrice: 35000, price: 35000, stock: 25, supplier: "Federal Parts", description: "Kampas rem tromol belakang", isPart: true },
    { name: "Busi NGK Standard", code: "PART-05", purchasePrice: 15000, sellingPrice: 25000, price: 25000, stock: 100, supplier: "NGK Busi Indonesia", description: "Busi standar motor", isPart: true },
    { name: "Roller CVT 10gr (Set)", code: "PART-06", purchasePrice: 45000, sellingPrice: 60000, price: 60000, stock: 15, supplier: "TDR Racing", description: "Roller racing/standar", isPart: true },
    { name: "Vanbelt Mio Sporty", code: "PART-07", purchasePrice: 70000, sellingPrice: 85000, price: 85000, stock: 10, supplier: "Yamaha Part Center", description: "V-belt original Yamaha", isPart: true },
    { name: "Filter Udara NMAX", code: "PART-08", purchasePrice: 40000, sellingPrice: 55000, price: 55000, stock: 12, supplier: "Yamaha Part Center", description: "Saringan udara motor NMAX", isPart: true },
    { name: "Ban Luar IRC 80/90-14", code: "PART-09", purchasePrice: 180000, sellingPrice: 210000, price: 210000, stock: 8, supplier: "Gajah Tunggal", description: "Ban tubeless ring 14", isPart: true },
    { name: "Aki GS Astra (Kering)", code: "PART-10", purchasePrice: 210000, sellingPrice: 250000, price: 250000, stock: 5, supplier: "GS Battery", description: "Aki kering bebas perawatan", isPart: true }
];

const servicesData = [
    { name: "Service Ringan / Tune Up", code: "SRV-01", price: 65000, isPart: false },
    { name: "Ganti Oli (Jasa)", code: "SRV-02", price: 10000, isPart: false },
    { name: "Service CVT", code: "SRV-03", price: 45000, isPart: false },
    { name: "Service Besar", code: "SRV-04", price: 250000, isPart: false },
    { name: "Ganti Kampas Rem", code: "SRV-05", price: 20000, isPart: false },
    { name: "Tambal Ban Tubeless", code: "SRV-06", price: 15000, isPart: false },
    { name: "Ganti Ban Luar", code: "SRV-07", price: 25000, isPart: false },
    { name: "Cas Aki / Accu", code: "SRV-08", price: 15000, isPart: false },
    { name: "Ganti Lampu Utama", code: "SRV-09", price: 5000, isPart: false },
    { name: "Cek Kelistrikan", code: "SRV-10", price: 50000, isPart: false }
];
const motorData = [
    { name: "Honda Beat", brand: "Honda", type: "Matic" },
    { name: "Honda Vario 160", brand: "Honda", type: "Matic" },
    { name: "Yamaha NMAX", brand: "Yamaha", type: "Matic" },
    { name: "Yamaha Mio M3", brand: "Yamaha", type: "Matic" },
    { name: "Suzuki Satria F150", brand: "Suzuki", type: "Sport" }
];
const importData = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bengkel_db');
        
        await Service.deleteMany();
        await Part.deleteMany();
        await Motor.deleteMany(); // Hapus motor lama

        await Part.insertMany(partsData);
        await Service.insertMany(servicesData);
        await Motor.insertMany(motorData); // Insert motor baru

        console.log("✅ SEEDER SUCCESSFUL! Suku cadang, Jasa, dan Motor telah diperbarui.");
        process.exit();
    } catch (error) {
        console.error("❌ Seeder Error:", error.message);
        process.exit(1);
    }
};

importData();