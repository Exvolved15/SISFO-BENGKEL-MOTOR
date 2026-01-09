require('dotenv').config();
const mongoose = require('mongoose');
const Service = require('./src/models/Service');
const Part = require('./src/models/Part');
const Motor = require('./src/models/Motor');

const partsData = [
    { 
        name: "Oli Yamalube Matic (0.8L)", 
        code: "PART-01"s, 
        purchasePrice: 45000, 
        sellingPrice: 55000, 
        stock: 50, 
        supplier: "Yamaha Part Center", 
        imageUrl: "https://lh3.googleusercontent.com/d/1XlR0vO8O9o3m5v7zD9hN8rR7VfV8m5Xo" // Botol Oli Yamalube
    },
    { 
        name: "Oli Honda MPX2 (0.8L)", 
        code: "PART-02", 
        purchasePrice: 40000, 
        sellingPrice: 50000, 
        stock: 45, 
        supplier: "Astra Honda Motor", 
        imageUrl: "https://lh3.googleusercontent.com/d/1v5O_7rB_N_RzW5jVqK9P9oE_rB_XqVnN" // Oli Honda MPX2
    },
    { 
        name: "Kampas Rem Depan Beat", 
        code: "PART-03", 
        purchasePrice: 30000, 
        sellingPrice: 45000, 
        stock: 20, 
        supplier: "Federal Parts", 
        imageUrl: "https://lh3.googleusercontent.com/d/1S_o9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Brake Pad/Kampas Rem
    },
    { 
        name: "Kampas Rem Belakang", 
        code: "PART-04", 
        purchasePrice: 25000, 
        sellingPrice: 35000, 
        stock: 25, 
        supplier: "Federal Parts", 
        imageUrl: "https://lh3.googleusercontent.com/d/1R_r9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Brake Shoe
    },
    { 
        name: "Busi NGK Standard", 
        code: "PART-05", 
        purchasePrice: 15000, 
        sellingPrice: 25000, 
        stock: 100, 
        supplier: "NGK Busi Indonesia", 
        imageUrl: "https://lh3.googleusercontent.com/d/1Q_q9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Busi NGK
    },
    { 
        name: "Roller CVT 10gr (Set)", 
        code: "PART-06", 
        purchasePrice: 45000, 
        sellingPrice: 60000, 
        stock: 15, 
        supplier: "TDR Racing", 
        imageUrl: "https://lh3.googleusercontent.com/d/1P_p9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Roller CVT
    },
    { 
        name: "Vanbelt Mio Sporty", 
        code: "PART-07", 
        purchasePrice: 70000, 
        sellingPrice: 85000, 
        stock: 10, 
        supplier: "Yamaha Part Center", 
        imageUrl: "https://lh3.googleusercontent.com/d/1O_o9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // V-Belt
    },
    { 
        name: "Filter Udara NMAX", 
        code: "PART-08", 
        purchasePrice: 40000, 
        sellingPrice: 55000, 
        stock: 12, 
        supplier: "Yamaha Part Center", 
        imageUrl: "https://lh3.googleusercontent.com/d/1N_n9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Air Filter
    },
    { 
        name: "Ban Luar IRC 80/90-14", 
        code: "PART-09", 
        purchasePrice: 180000, 
        sellingPrice: 210000, 
        stock: 8, 
        supplier: "Gajah Tunggal", 
        imageUrl: "https://lh3.googleusercontent.com/d/1M_m9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Ban IRC
    },
    { 
        name: "Aki GS Astra (Kering)", 
        code: "PART-10", 
        purchasePrice: 210000, 
        sellingPrice: 250000, 
        stock: 5, 
        supplier: "GS Battery", 
        imageUrl: "https://lh3.googleusercontent.com/d/1L_l9rT_VzR_N7uVqK5P9oE_rB_XqVnN" // Aki GS Astra
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