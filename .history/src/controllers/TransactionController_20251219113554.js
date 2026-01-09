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

// --- LOGIC UTAMA (TANPA SESSION TRANSACTION AGAR JALAN DI LOCALHOST) ---
const processTransactionLogic = async (reqBody, userCreator) => {
    const { 
        customerName, vehicleLicense, totalAmount, 
        discount, grandTotal, paymentMethod, 
        notes, itemDetails, assignedTo 
    } = reqBody;

    // 1. Validasi & Hitung Grand Total Otomatis
    const fixedTotalAmount = parseInt(totalAmount) || 0;
    const fixedDiscount = parseInt(discount) || 0;
    let fixedGrandTotal = grandTotal ? parseInt(grandTotal) : (fixedTotalAmount - fixedDiscount);

    // 2. Tentukan Status & Mekanik
    // Jika tidak ada mekanik (assignedTo kosong), maka status langsung 'lunas' (Beli Putus/Direct Pay)
    // Jika ada mekanik, status juga 'lunas' (karena kasir yang input, asumsi bayar dulu/belakangan tetap tercatat lunas di kasir)
    let mechanicId = null;
    let mechanicName = "Tanpa Mekanik"; // Default jika beli part saja

    if (assignedTo && assignedTo !== "") {
        const mechanic = await User.findById(assignedTo);
        if (mechanic) {
            mechanicId = mechanic._id;
            mechanicName = mechanic.name;
        }
    }

    try {
        // 3. GENERATE NOMOR INVOICE
        const invoiceNumber = await generateInvoiceNumber();

        // 4. BUAT HEADER TRANSAKSI
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customerName,
            vehicleLicense,
            mechanicId: mechanicId, // Bisa null jika tidak ada jasa
            mechanicName: mechanicName,
            totalAmount: fixedTotalAmount,
            discount: fixedDiscount,
            grandTotal: fixedGrandTotal,
            paymentMethod: paymentMethod || 'Cash',
            notes: notes || '-',
            status: 'lunas', 
            user: userCreator._id 
        });

        const transactionId = newTransaction._id;
        let detailsToSave = [];
        let partUpdates = [];
        let jobDescriptionItems = [];

        // 5. LOOPING ITEM DETAILS (DENGAN AUTO-DETECTION)
        if (itemDetails && itemDetails.length > 0) {
            let items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;

            for (const item of items) {
                // Variables untuk menampung data DB
                let dbItem = null;
                let finalItemType = item.itemType; // Coba pakai dari frontend dulu
                let itemName = "";
                let itemCode = "";

                // LOGIKA PENCARIAN ITEM (Cari di Part dulu, kalau gak ada cari di Service)
                // Ini mengatasi masalah jika frontend lupa kirim itemType
                
                // Cek 1: Apakah ini Part?
                dbItem = await Part.findById(item.itemId);
                if (dbItem) {
                    finalItemType = 'part';
                    itemName = dbItem.name;
                    itemCode = dbItem.code;
                    
                    // Cek Stok
                    if (dbItem.stock < item.quantity) {
                        throw new Error(`Stok ${itemName} kurang (Sisa: ${dbItem.stock}).`);
                    }

                    // Masukkan ke antrian update stok
                    partUpdates.push({
                        updateOne: {
                            filter: { _id: item.itemId },
                            update: { $inc: { stock: -item.quantity } }
                        }
                    });
                } 
                // Cek 2: Jika bukan Part, apakah ini Service?
                else {
                    dbItem = await Service.findById(item.itemId);
                    if (dbItem) {
                        finalItemType = 'service';
                        itemName = dbItem.serviceName;
                        itemCode = dbItem.serviceCode;
                    } else {
                        // Jika tidak ketemu di keduanya
                        throw new Error(`Item dengan ID ${item.itemId} tidak ditemukan di database.`);
                    }
                }

                // Tambahkan ke deskripsi Job (hanya nama item)
                jobDescriptionItems.push(`${itemName} (${item.quantity})`);

                // Persiapkan data detail untuk disimpan
                const subTotal = item.quantity * item.pricePerUnit;
                
                detailsToSave.push({
                    transactionId,
                    itemType: finalItemType, // Pasti terisi 'part' atau 'service'
                    itemId: item.itemId,
                    itemName: itemName,      // Pasti terisi dari DB
                    itemCode: itemCode,      // Pasti terisi dari DB
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    subTotal
                });
            }
        }

        // 6. EKSEKUSI DATABASE (Simpan Detail & Update Stok)
        if (partUpdates.length > 0) await Part.bulkWrite(partUpdates);
        if (detailsToSave.length > 0) await TransactionDetail.insertMany(detailsToSave);

        // 7. BUAT JOB MEKANIK (HANYA JIKA ADA MEKANIK DIPILIH)
        // Fitur "Langsung Bayar" terpenuhi di sini. 
        // Jika assignedTo kosong, blok ini dilewati, jadi tidak error walau gak ada servis.
        if (mechanicId) {
            await Job.create({
                jobTitle: notes || `Service ${vehicleLicense}`, 
                description: `Plat: ${vehicleLicense}. Items: ${jobDescriptionItems.join(', ')}`,
                mechanicId: mechanicId,
                transactionId: transactionId,
                vehicleLicense: vehicleLicense,
                customerName: customerName,
                status: 'pending'
            });
        }

        return { transaction: newTransaction, details: savedDetails };

    } catch (error) {
        throw error;
    }
};

// --- CONTROLLER FUNCTIONS ---

const index = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.render('transactions/list', { title: 'Daftar Transaksi', transactions, user: req.user });
    } catch (error) { res.status(500).send("Server Error"); }
};

const createView = async (req, res) => {
    try {
        const parts = await Part.find({ stock: { $gt: 0 } }); 
        const services = await Service.find({});
        const mechanics = await User.find({ role: 'mekanik' });

        res.render('transactions/add', { 
            title: 'Transaksi Baru', 
            parts, 
            services, 
            mechanics,
            user: req.user 
        });
    } catch (error) { res.status(500).send("Error loading page"); }
};

const createTransactionApi = async (req, res) => {
    try {
        const result = await processTransactionLogic(req.body, req.user);
        res.status(201).json({ 
            success: true, 
            message: 'Transaksi Berhasil!', 
            data: result 
        });
    } catch (error) {
        console.error("Transaction Error:", error);
        res.status(400).json({ success: false, message: error.message });
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find({}).sort({ createdAt: -1 });
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

// DUMMY FUNCTIONS
const addDetail = (req, res) => {
    res.status(501).json({ success: false, message: 'Fungsi addDetail belum diimplementasikan.' });
};

const printReceipt = (req, res) => {
    res.status(501).json({ success: false, message: 'Fungsi printReceipt belum diimplementasikan.' });
};

// --- EXPORT MODULE ---
module.exports = {
    index,
    createView,
    createTransactionApi,
    getAllTransactions,
    getTransaction,
    processTransactionLogic,
    addDetail,     
    printReceipt   
};