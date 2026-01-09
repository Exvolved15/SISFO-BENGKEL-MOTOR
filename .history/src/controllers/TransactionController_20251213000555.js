// sisfo-bengkel-baru/src/controllers/TransactionController.js

const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part'); 
const Service = require('../models/Service');

const mongoose = require('mongoose'); // <-- PASTIKAN INI ADA UNTUK SESSION!

// Fungsi utilitas untuk generate invoice number sederhana
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0');
    
    // Cari transaksi terakhir hari ini
    const lastTransaction = await Transaction.findOne({ 
        invoiceNumber: { $regex: new RegExp(`INV-${dateString}`, 'i') } 
    }).sort({ createdAt: -1 });

    let counter = 1;
    if (lastTransaction) {
        // Ambil counter dari nomor invoice terakhir (e.g., dari INV-20251212-005)
        const parts = lastTransaction.invoiceNumber.split('-');
        counter = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `INV-${dateString}-${counter.toString().padStart(3, '0')}`;
};

// @deskripsi: Membuat Transaksi Penjualan Baru
// @rute: POST /api/transactions
// @akses: Private (Kasir)
const createTransaction = async (req, res) => {
    // Kita membutuhkan data transaksi (Header) dan itemDetails (Detail) dari body
    const { 
        customerName, 
        vehicleLicense, 
        totalAmount, 
        discount, 
        grandTotal, 
        paymentMethod, 
        notes, 
        itemDetails // Array of items: [{ itemId, itemType, quantity, pricePerUnit }]
    } = req.body;

    // Start Session (Penting untuk transaksi multi-langkah di MongoDB)
    const session = await mongoose.startSession(); 
    session.startTransaction();

    try {
        // 1. GENERATE NOMOR INVOICE
        const invoiceNumber = await generateInvoiceNumber();
        
        // 2. BUAT HEADER TRANSAKSI
        const newTransaction = await Transaction.create([{
            invoiceNumber,
            customerName,
            vehicleLicense,
            totalAmount,
            discount,
            grandTotal,
            paymentMethod,
            notes
        }], { session });

        const transactionId = newTransaction[0]._id;
        let detailsToSave = [];
        let partUpdates = [];

        // 3. PROSES DETAIL ITEM
        for (const item of itemDetails) {
            
            let itemData;
            
            // a. Ambil data item (Part atau Service)
            if (item.itemType === 'part') {
                itemData = await Part.findById(item.itemId).session(session);
                
                // Cek Stok (LOGIKA KRUSIAL)
                if (!itemData || itemData.stock < item.quantity) {
                    throw new Error(`Stok suku cadang ${item.itemId} tidak cukup atau tidak ditemukan.`);
                }

                // Siapkan update stok (pengurangan)
                partUpdates.push({
                    updateOne: {
                        filter: { _id: item.itemId },
                        update: { $inc: { stock: -item.quantity } }
                    }
                });

            } else if (item.itemType === 'service') {
                itemData = await Service.findById(item.itemId).session(session);
                if (!itemData) {
                    throw new Error(`Jasa ${item.itemId} tidak ditemukan.`);
                }
            } else {
                throw new Error('Tipe item tidak valid.');
            }

            // b. Hitung subtotal & siapkan detail untuk disimpan
            const subTotal = item.quantity * item.pricePerUnit;
            detailsToSave.push({
                transactionId,
                itemType: item.itemType,
                itemId: item.itemId,
                itemName: itemData.name || itemData.serviceName, // Ambil nama dari Model
                itemCode: itemData.code || itemData.serviceCode, // Ambil kode dari Model
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                subTotal
            });
        }
        
        // 4. UPDATE STOK SUKU CADANG (Bulk Write)
        if (partUpdates.length > 0) {
            await Part.bulkWrite(partUpdates, { session });
        }
        
        // 5. SIMPAN DETAIL TRANSAKSI
        const savedDetails = await TransactionDetail.insertMany(detailsToSave, { session });

        // 6. COMMIT TRANSAKSI
        await session.commitTransaction();
        session.endSession();

        res.status(201).json({ 
            success: true, 
            message: 'Transaksi berhasil dicatat', 
            transaction: newTransaction[0],
            details: savedDetails
        });

    } catch (error) {
        // ROLLBACK JIKA ADA ERROR
        await session.abortTransaction();
        session.endSession();
        
        console.error('Transaksi Gagal:', error.message);
        res.status(400).json({ success: false, message: 'Transaksi gagal: ' + error.message });
    }
};

// FUNGSI UTAMA LOGIKA TRANSAKSI (Hanya mengembalikan data atau melempar error)
const processTransactionLogic = async (reqBody) => {
    // ... (kode destructing reqBody) ...

    const session = await mongoose.startSession(); 
    session.startTransaction();

    try {
        // ... (Semua langkah 1-5, CREATE HEADER, LOOP DETAIL, Cek Stok, BulkWrite) ...

        // 6. COMMIT TRANSAKSI
        await session.commitTransaction();
        session.endSession();

        // MENGEMBALIKAN DATA SETELAH BERHASIL (TIDAK ADA res.json/res.send)
        return { 
            transaction: newTransaction[0], 
            details: savedDetails 
        };

    } catch (error) {
        // ROLLBACK JIKA ADA ERROR
        await session.abortTransaction();
        session.endSession();
        
        // Lempar error agar ditangkap oleh pemanggil fungsi
        throw error; 
    }
};

// --- FUNGSI API (Menggunakan Logic dan Mengirim Respons JSON) ---
const createTransactionApi = async (req, res) => {
    try {
        const result = await processTransactionLogic(req.body); // Panggil fungsi logic
        res.status(201).json({ 
            success: true, 
            message: 'Transaksi berhasil dicatat', 
            ...result 
        });
    } catch (error) {
        res.status(400).json({ success: false, message: 'Transaksi gagal: ' + error.message });
    }
};

// ... Tambahkan fungsi getAllTransactions (untuk laporan/view) ...
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({}).sort({ createdAt: -1 });
        res.status(200).json({ success: true, count: transactions.length, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    processTransactionLogic,
    createTransaction,
    createTransactionApi,
    getAllTransactions
};