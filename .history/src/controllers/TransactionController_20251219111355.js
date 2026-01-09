// sisfo-bengkel-baru/src/controllers/TransactionController.js

const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part'); 
const Service = require('../models/Service');
const mongoose = require('mongoose');

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
        const parts = lastTransaction.invoiceNumber.split('-');
        counter = parseInt(parts[parts.length - 1], 10) + 1;
    }

    return `INV-${dateString}-${counter.toString().padStart(3, '0')}`;
};

/**
 * LOGIKA UTAMA TRANSAKSI (Core Logic)
 * Fungsi ini dipisahkan agar bisa dipanggil oleh API Controller maupun View Controller
 */
const processTransactionLogic = async (reqBody) => {
    // Destructuring data dari body
    const { 
        customerName, 
        vehicleLicense, 
        totalAmount, 
        discount, 
        grandTotal, 
        paymentMethod, 
        notes, 
        itemDetails 
    } = reqBody;

    // Start Session untuk Atomicity (Semua sukses atau batal semua)
    const session = await mongoose.startSession(); 
    session.startTransaction();
    
    let newTransaction; 
    let savedDetails = [];
    
    try {
        // 1. GENERATE NOMOR INVOICE
        const invoiceNumber = await generateInvoiceNumber();
        
        // 2. BUAT HEADER TRANSAKSI
        // Menggunakan array [{...}] karena opsi { session } pada create membutuhkan array di Mongoose versi tertentu
        const transactionResult = await Transaction.create([{
            invoiceNumber,
            customerName,
            vehicleLicense,
            totalAmount,
            discount,
            grandTotal,
            paymentMethod,
            notes,
            status: 'pending' // Default status
        }], { session });

        newTransaction = transactionResult[0]; // Ambil object pertama dari array hasil create
        const transactionId = newTransaction._id;

        let detailsToSave = [];
        let partUpdates = [];

        // 3. LOOPING ITEM DETAILS (Validasi Stok & Siapkan Data)
        if (itemDetails && itemDetails.length > 0) {
            for (const item of itemDetails) {
                let itemData;
                let itemName, itemCode;

                // Cek Tipe Item (Part atau Service)
                if (item.itemType === 'part') {
                    // Ambil data Part dengan Session
                    itemData = await Part.findById(item.itemId).session(session);
                    
                    if (!itemData) {
                        throw new Error(`Suku cadang dengan ID ${item.itemId} tidak ditemukan.`);
                    }

                    // Cek Stok
                    if (itemData.stock < item.quantity) {
                        throw new Error(`Stok ${itemData.name} tidak cukup (Sisa: ${itemData.stock}).`);
                    }

                    // Siapkan Query Update Stok (dikumpulkan dulu, dieksekusi nanti)
                    partUpdates.push({
                        updateOne: {
                            filter: { _id: item.itemId },
                            update: { $inc: { stock: -item.quantity } }
                        }
                    });

                    itemName = itemData.name;
                    itemCode = itemData.code;

                } else if (item.itemType === 'service') {
                    // Ambil data Service
                    itemData = await Service.findById(item.itemId).session(session);
                    
                    if (!itemData) {
                        throw new Error(`Jasa dengan ID ${item.itemId} tidak ditemukan.`);
                    }

                    itemName = itemData.serviceName;
                    itemCode = itemData.serviceCode;
                } else {
                    throw new Error(`Tipe item '${item.itemType}' tidak valid.`);
                }

                // Hitung subtotal & Masukkan ke array detailsToSave
                const subTotal = item.quantity * item.pricePerUnit;
                
                detailsToSave.push({
                    transactionId,
                    itemType: item.itemType,
                    itemId: item.itemId,
                    itemName: itemName,
                    itemCode: itemCode,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    subTotal
                });
            }
        }

        // 4. EKSEKUSI UPDATE STOK (Bulk Write)
        if (partUpdates.length > 0) {
            await Part.bulkWrite(partUpdates, { session });
        }
        
        // 5. SIMPAN DETAIL TRANSAKSI KE DATABASE
        if (detailsToSave.length > 0) {
            savedDetails = await TransactionDetail.insertMany(detailsToSave, { session });
        }

        // 6. COMMIT TRANSAKSI (Simpan Permanen)
        await session.commitTransaction();
        session.endSession();

        // Kembalikan data yang sudah disimpan
        return { 
            transaction: newTransaction, 
            details: savedDetails 
        };

    } catch (error) {
        // ROLLBACK JIKA ADA ERROR
        if (session.inTransaction()) {
             await session.abortTransaction();
        }
        session.endSession();
        
        // Lempar error agar bisa ditangkap oleh Controller pemanggil
        throw error; 
    }
};

/**
 * API HANDLER: Membuat Transaksi via API (JSON)
 * @route POST /api/transactions
 */
const createTransactionApi = async (req, res) => {
    try {
        // Panggil fungsi logic di atas
        const result = await processTransactionLogic(req.body); 
        
        res.status(201).json({ 
            success: true, 
            message: 'Transaksi berhasil dicatat', 
            data: result 
        });
    } catch (error) {
        console.error('Error Create Transaction API:', error.message);
        res.status(400).json({ 
            success: false, 
            message: error.message 
        });
    }
};

/**
 * API HANDLER: Mengambil Semua Transaksi
 * @route GET /api/transactions
 */
const getAllTransactions = async (req, res) => {
    try {
        // Ambil semua transaksi, urutkan dari yang terbaru
        const transactions = await Transaction.find({}).sort({ createdAt: -1 });
        
        // Jika dipanggil via API Request
        if (res) {
            return res.status(200).json({ success: true, data: transactions });
        }
        
        // Jika dipanggil internal function (return data saja)
        return transactions; 
    } catch (error) {
        if (res) {
            return res.status(500).json({ success: false, message: error.message });
        }
        throw error;
    }
};

/**
 * API HANDLER: Mengambil Satu Transaksi Detail
 * @route GET /api/transactions/:id
 */
const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
            // .populate('details'); // Aktifkan jika sudah relasi virtual di model
        
        if (!transaction) {
            return res.status(404).json({ success: false, message: 'Transaksi tidak ditemukan.' });
        }

        // Opsional: Ambil detail manual jika belum pakai populate
        const details = await TransactionDetail.find({ transactionId: transaction._id });

        res.status(200).json({ 
            success: true, 
            data: {
                ...transaction.toObject(),
                details: details
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Placeholder functions
const addDetail = (req, res) => {
    res.status(501).json({ success: false, message: 'Fungsi addDetail belum diimplementasikan.' });
};

const printReceipt = (req, res) => {
    res.status(501).json({ success: false, message: 'Fungsi printReceipt belum diimplementasikan.' });
};

module.exports = {
    processTransactionLogic, // Diekspor untuk dipakai View Controller
    createTransactionApi,    // Diekspor untuk dipakai API Route
    getAllTransactions,
    getTransaction,
    addDetail,
    printReceipt
};