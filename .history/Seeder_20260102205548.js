require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const Part = require('./src/models/Part');
const Motor = require('./src/models/Motor');

const partsData = [
    { 
        name: "Oli Yamalube Matic (0.8L)", 
        code: "PART-01", 
        purchasePrice: 45000, 
        sellingPrice: 55000, 
        stock: 50, 
        supplier: "Yamaha Part Center", 
        // Gambar botol oli motor matic
        imageUrl: "https://images.unsplash.com/photo-1635833158732-4467ec9f7831?w=600" 
    },
    { 
        name: "Oli Honda MPX2 (0.8L)", 
        code: "PART-02", 
        purchasePrice: 40000, 
        sellingPrice: 50000, 
        stock: 45, 
        supplier: "Astra Honda Motor", 
        // Gambar menuang oli mesin
        imageUrl: "https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=600" 
    },
    { 
        name: "Kampas Rem Depan Beat", 
        code: "PART-03", 
        purchasePrice: 30000, 
        sellingPrice: 45000, 
        stock: 20, 
        supplier: "Federal Parts", 
        // Gambar cakram/rem motor
        imageUrl: "https://images.unsplash.com/photo-1581092160607-ee23622dd1a6?w=600" 
    },
    { 
        name: "Kampas Rem Belakang", 
        code: "PART-04", 
        purchasePrice: 25000, 
        sellingPrice: 35000, 
        stock: 25, 
        supplier: "Federal Parts", 
        // Gambar mekanik memperbaiki rem
        imageUrl: "https://images.unsplash.com/photo-1486001920241-422e53556010?w=600" 
    },
    { 
        name: "Busi NGK Standard", 
        code: "PART-05", 
        purchasePrice: 15000, 
        sellingPrice: 25000, 
        stock: 100, 
        supplier: "NGK Busi Indonesia", 
        // Gambar busi kendaraan
        imageUrl: "https://images.unsplash.com/photo-1620939511593-33926639e761?w=600" 
    },
    { 
        name: "Roller CVT 10gr (Set)", 
        code: "PART-06", 
        purchasePrice: 45000, 
        sellingPrice: 60000, 
        stock: 15, 
        supplier: "TDR Racing", 
        // Gambar komponen logam mesin (gir/roller)
        imageUrl: "https://images.unsplash.com/photo-1504198266287-1659872e6590?w=600" 
    },
    { 
        name: "Vanbelt Mio Sporty", 
        code: "PART-07", 
        purchasePrice: 70000, 
        sellingPrice: 85000, 
        stock: 10, 
        supplier: "Yamaha Part Center", 
        // Gambar sabuk penggerak/belt mesin
        imageUrl: "https://images.unsplash.com/photo-1549495146-51f49619198b?w=600" 
    },
    { 
        name: "Filter Udara NMAX", 
        code: "PART-08", 
        purchasePrice: 40000, 
        sellingPrice: 55000, 
        stock: 12, 
        supplier: "Yamaha Part Center", 
        // Gambar part filter mesin
        imageUrl: "https://images.unsplash.com/photo-1597839219216-a773cb2473e4?w=600" 
    },
    { 
        name: "Ban Luar IRC 80/90-14", 
        code: "PART-09", 
        purchasePrice: 180000, 
        sellingPrice: 210000, 
        stock: 8, 
        supplier: "Gajah Tunggal", 
        // Gambar ban sepeda motor
        imageUrl: "https://images.unsplash.com/photo-1584013400518-e3952924151a?w=600" 
    },
    { 
        name: "Aki GS Astra (Kering)", 
        code: "PART-10", 
        purchasePrice: 210000, 
        sellingPrice: 250000, 
        stock: 5, 
        supplier: "GS Battery", 
        // Gambar aki/baterai kendaraan
        imageUrl: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600" 
    }
];

const servicesData = [
    { name: "Service Ringan / Tune Up", code: "SRV-01", price: 65000 },
    { name: "Ganti Oli (Jasa)", code: "SRV-02", price: 10000 },
    { name: "Service CVT", code: "SRV-03", price: 45000 },
    { name: "Service Besar", code: "SRV-04", price: 250000 },
    { name: "Ganti Kampas Rem", code: "SRV-05", price: 20000 },
    { name: "Tambal Ban Tubeless", code: "SRV-06", price: 15000 },
    { name: "Ganti Ban Luar", code: "SRV-07", price: 25000 },
    { name: "Cas Aki / Accu", code: "SRV-08", price: 15000 },
    { name: "Ganti Lampu Utama", code: "SRV-09", price: 5000 },
    { name: "Cek Kelistrikan", code: "SRV-10", price: 50000 }
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
        // Menggunakan opsi koneksi modern
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bengkel_db');
        console.log("Connected to Database...");

        // Membersihkan data lama
        await Service.deleteMany();
        await Part.deleteMany();
        await Motor.deleteMany();

        // Memasukkan data baru
        await Part.insertMany(partsData);
        await Service.insertMany(servicesData);
        await Motor.insertMany(motorData);

        console.log("✅ SEEDER SUCCESSFUL! Suku cadang, Jasa, dan Motor telah diperbarui dengan gambar asli.");
        process.exit();
    } catch (error) {
        console.error("❌ Seeder Error:", error.message);
        process.exit(1);
    }
};

importData();