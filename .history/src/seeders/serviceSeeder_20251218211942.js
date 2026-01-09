const Service = require('../models/Service');

const seedWorkshopData = async () => {
    try {
        const data = [
            // 10 SPARE-PARTS (isPart: true)
            { name: "Oli Shell Helix 1L", code: "PART-01", price: 120000, stock: 50, isPart: true },
            { name: "Filter Oli Honda", code: "PART-02", price: 45000, stock: 20, isPart: true },
            { name: "Kampas Rem Depan", code: "PART-03", price: 250000, stock: 15, isPart: true },
            { name: "Aki GS Astra", code: "PART-04", price: 850000, stock: 10, isPart: true },
            { name: "Busi NGK Iridium", code: "PART-05", price: 95000, stock: 40, isPart: true },
            { name: "Filter Udara Denso", code: "PART-06", price: 110000, stock: 25, isPart: true },
            { name: "V-Belt CVT Gates", code: "PART-07", price: 185000, stock: 12, isPart: true },
            { name: "Lampu LED Philips", code: "PART-08", price: 320000, stock: 8, isPart: true },
            { name: "Sokbreker KYB", code: "PART-09", price: 450000, stock: 6, isPart: true },
            { name: "Ban Dunlop 90/90-14", code: "PART-10", price: 280000, stock: 10, isPart: true },

            // 10 JASA (isPart: false)
            { name: "Servis Rutin / Tune Up", code: "SRV-01", price: 150000, stock: 0, isPart: false },
            { name: "Ganti Oli (Jasa)", code: "SRV-02", price: 25000, stock: 0, isPart: false },
            { name: "Servis Rem", code: "SRV-03", price: 65000, stock: 0, isPart: false },
            { name: "Servis CVT Lengkap", code: "SRV-04", price: 120000, stock: 0, isPart: false },
            { name: "Bongkar Pasang Ban", code: "SRV-05", price: 35000, stock: 0, isPart: false },
            { name: "Servis Injeksi", code: "SRV-06", price: 85000, stock: 0, isPart: false },
            { name: "Cek Kelistrikan", code: "SRV-07", price: 45000, stock: 0, isPart: false },
            { name: "Kuras Radiator", code: "SRV-08", price: 55000, stock: 0, isPart: false },
            { name: "Overhaul Mesin", code: "SRV-09", price: 1500000, stock: 0, isPart: false },
            { name: "Cuci Motor Salju", code: "SRV-10", price: 30000, stock: 0, isPart: false }
        ];

        await Service.insertMany(data);
        console.log("Database Bengkel Berhasil Terisi (20 Item)!");
    } catch (error) {
        console.error("Gagal Seeding:", error);
    }
};