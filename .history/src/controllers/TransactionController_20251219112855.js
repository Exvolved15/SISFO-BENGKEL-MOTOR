// sisfo-bengkel-baru/src/controllers/TransactionController.js

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part'); 
const Service = require('../models/Service');
const Job = require('../models/Job'); 
const User = require('../models/User');

// --- HELPER: GENERATE INVOICE ---
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0');
    
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

// --- LOGIC UTAMA (DATABASE TRANSACTION) ---
const processTransactionLogic = async (reqBody, userCreator) => {
    const { 
        customerName, vehicleLicense, totalAmount, 
        discount, grandTotal, paymentMethod, 
        notes, itemDetails, assignedTo // assignedTo = mechanicId
    } = reqBody;

    const session = await mongoose.startSession(); 
    session.startTransaction();
    
    let newTransaction; 
    let savedDetails = [];

    try {
        // 1. GENERATE NOMOR INVOICE
        const invoiceNumber = await generateInvoiceNumber();
        
        // 2. CARI NAMA MEKANIK (Jika ada)
        let mechanicName = "Tanpa Mekanik";
        if (assignedTo) {
            const mechanic = await User.findById(assignedTo).session(session);
            if (mechanic) mechanicName = mechanic.name;
        }

        // 3. BUAT HEADER TRANSAKSI
        const trxResult = await Transaction.create([{
            invoiceNumber,
            customerName,
            vehicleLicense,
            mechanicId: assignedTo || null,
            mechanicName,
            totalAmount,
            discount,
            grandTotal,
            paymentMethod,
            notes,
            status: 'lunas', 
            user: userCreator._id 
        }], { session });

        newTransaction = trxResult[0];
        const transactionId = newTransaction._id;

        let detailsToSave = [];
        let partUpdates = [];
        let jobDescriptionItems = [];

        // 4. LOOPING ITEM DETAILS
        if (itemDetails && itemDetails.length > 0) {
            let items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;

            for (const item of items) {
                let itemData;
                let itemName, itemCode;

                if (item.itemType === 'part') {
                    // Cek Stok Part
                    itemData = await Part.findById(item.itemId).session(session);
                    if (!itemData) throw new Error(`Suku cadang ${item.itemId} tidak ditemukan.`);
                    if (itemData.stock < item.quantity) throw new Error(`Stok ${itemData.name} kurang (Sisa: ${itemData.stock}).`);

                    // Masukkan ke antrian update stok
                    partUpdates.push({
                        updateOne: {
                            filter: { _id: item.itemId },
                            update: { $inc: { stock: -item.quantity } }
                        }
                    });
                    itemName = itemData.name;
                    itemCode = itemData.code;

                } else if (item.itemType === 'service') {
                    itemData = await Service.findById(item.itemId).session(session);
                    if (!itemData) throw new Error(`Jasa ${item.itemId} tidak ditemukan.`);
                    itemName = itemData.serviceName;
                    itemCode = itemData.serviceCode;
                }

                jobDescriptionItems.push(`${itemName} (${item.quantity})`);

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

        // 5. EKSEKUSI DATABASE
        if (partUpdates.length > 0) await Part.bulkWrite(partUpdates, { session });
        if (detailsToSave.length > 0) savedDetails = await TransactionDetail.insertMany(detailsToSave, { session });

        // 6. BUAT JOB MEKANIK
        if (assignedTo) {
            await Job.create([{
                jobTitle: notes || `Service ${vehicleLicense}`, 
                description: `Plat: ${vehicleLicense}. Items: ${jobDescriptionItems.join(', ')}`,
                mechanicId: assignedTo,
                transactionId: transactionId,
                vehicleLicense: vehicleLicense,
                customerName: customerName,
                status: 'pending'
            }], { session });
        }

        // 7. COMMIT BERHASIL
        await session.commitTransaction();
        session.endSession();

        return { transaction: newTransaction, details: savedDetails };

    } catch (error) {
        if (session.inTransaction()) await session.abortTransaction();
        session.endSession();
        throw error;
    }
};

// --- CONTROLLER FUNCTIONS ---

// 1. TAMPILAN VIEW
const index = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        // Sesuai info Anda, file view bernama list.ejs atau sejenisnya di folder transactions
        res.render('transactions/list', { title: 'Daftar Transaksi', transactions, user: req.user });
    } catch (error) { res.status(500).send("Server Error"); }
};

const createView = async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $gt: 0 } }); 
        const services = await Service.find({});
        const mechanics = await User.find({ role: 'mekanik' });

        // Sesuai info Anda, file view bernama 'add.ejs'
        res.render('transactions/add', { 
            title: 'Transaksi Baru', 
            parts, 
            services, 
            mechanics,
            user: req.user 
        });
    } catch (error) { res.status(500).send("Error loading page"); }
};

// 2. API ENDPOINT (Dipanggil oleh Frontend JS)
const createTransactionApi = async (req, res) => {
    try {
        const result = await processTransactionLogic(req.body, req.user);
        res.status(201).json({ 
            success: true, 
            message: 'Transaksi Berhasil & Job Dibuat!', 
            data: result 
        });
    } catch (error) {
        console.error("Transaction Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

// 3. API GET DATA
const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({}).sort({ createdAt: -1 });
        // Cek jika dipanggil sebagai API atau internal function
        if (res) return res.status(200).json({ success: true, data: transactions });
        return transactions;
    } catch (error) { 
        if(res) return res.status(500).json({ success: false, message: error.message });
        throw error;
    }
};

const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).json({ success: false, message: 'Not Found' });
        
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.status(200).json({ success: true, data: { ...transaction.toObject(), details } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// 4. DUMMY FUNCTIONS (Agar tidak error saat di-export)
const addDetail = (req, res) => {
    res.status(501).json({ success: false, message: 'Fungsi addDetail belum diimplementasikan.' });
};

const printReceipt = (req, res) => {
    res.status(501).json({ success: false, message: 'Fungsi printReceipt belum diimplementasikan.' });
};

// --- EXPORT MODULE (HARUS DI PALING BAWAH) ---
module.exports = {
    index,
    createView,
    createTransactionApi,
    getAllTransactions,
    getTransaction,
    processTransactionLogic,
    addDetail,     // Sekarang aman karena sudah didefinisikan di atas
    printReceipt   // Sekarang aman karena sudah didefinisikan di atas
};