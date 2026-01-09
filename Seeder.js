require('dotenv').config();
const mongoose = require('mongoose');
const Part = require('./src/models/Part');

const partsData = [
    { 
        name: "Oli Yamalube Matic (0.8L)", 
        code: "PART-01", 
        purchasePrice: 45000, 
        sellingPrice: 55000, 
        stock: 50, 
        supplier: "Yamaha Part Center", 
        description: "Oli matic standar Yamaha", 
        isPart: true,
        imageUrl: "/img/parts/PART-01.jpg" 
    },
    { 
        name: "Oli Honda MPX2 (0.8L)", 
        code: "PART-02", 
        purchasePrice: 40000, 
        sellingPrice: 50000, 
        stock: 45, 
        supplier: "Astra Honda Motor", 
        description: "Oli matic standar Honda", 
        isPart: true,
        imageUrl: "/img/parts/PART-02.jpg"
    },
    { 
        name: "Kampas Rem Depan Beat", 
        code: "PART-03", 
        purchasePrice: 30000, 
        sellingPrice: 45000, 
        stock: 20, 
        supplier: "Federal Parts", 
        description: "Kampas rem cakram depan", 
        isPart: true,
        imageUrl: "/img/parts/PART-03.jpg"
    },
    { 
        name: "Kampas Rem Belakang", 
        code: "PART-04", 
        purchasePrice: 25000, 
        sellingPrice: 35000, 
        stock: 25, 
        supplier: "Federal Parts", 
        description: "Kampas rem tromol belakang", 
        isPart: true,
        imageUrl: "/img/parts/PART-04.jpg"
    },
    { 
        name: "Busi NGK Standard", 
        code: "PART-05", 
        purchasePrice: 15000, 
        sellingPrice: 25000, 
        stock: 100, 
        supplier: "NGK Busi Indonesia", 
        description: "Busi standar motor", 
        isPart: true,
        imageUrl: "/img/parts/PART-05.jpg"
    },
    { 
        name: "Roller CVT 10gr (Set)", 
        code: "PART-06", 
        purchasePrice: 45000, 
        sellingPrice: 60000, 
        stock: 15, 
        supplier: "TDR Racing", 
        description: "Roller racing/standar", 
        isPart: true,
        imageUrl: "/img/parts/PART-06.jpg"
    },
    { 
        name: "Vanbelt Mio Sporty", 
        code: "PART-07", 
        purchasePrice: 70000, 
        sellingPrice: 85000, 
        stock: 10, 
        supplier: "Yamaha Part Center", 
        description: "V-belt original Yamaha", 
        isPart: true,
        imageUrl: "/img/parts/PART-07.jpg"
    },
    { 
        name: "Filter Udara NMAX", 
        code: "PART-08", 
        purchasePrice: 40000, 
        sellingPrice: 55000, 
        stock: 12, 
        supplier: "Yamaha Part Center", 
        description: "Saringan udara motor NMAX", 
        isPart: true,
        imageUrl: "/img/parts/PART-08.jpg"
    },
    { 
        name: "Ban Luar IRC 80/90-14", 
        code: "PART-09", 
        purchasePrice: 180000, 
        sellingPrice: 210000, 
        stock: 8, 
        supplier: "Gajah Tunggal", 
        description: "Ban tubeless ring 14", 
        isPart: true,
        imageUrl: "/img/parts/PART-09.jpg"
    },
    { 
        name: "Aki GS Astra (Kering)", 
        code: "PART-10", 
        purchasePrice: 210000, 
        sellingPrice: 250000, 
        stock: 5, 
        supplier: "GS Battery", 
        description: "Aki kering bebas perawatan", 
        isPart: true,
        imageUrl: "/img/parts/PART-10.jpg"
    }
];

const importData = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/bengkel_db');
        console.log("Cleaning Part database...");
        await Part.deleteMany();
        console.log("Seeding Spare Parts...");
        await Part.insertMany(partsData);
        console.log("✅ SEEDER SUKU CADANG SUCCESSFUL!");
        process.exit();
    } catch (error) {
        console.error("❌ Seeder Error:", error.message);
        process.exit(1);
    }
};

importData();