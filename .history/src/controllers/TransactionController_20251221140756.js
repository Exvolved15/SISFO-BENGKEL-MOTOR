// sisfo-bengkel-baru/src/controllers/TransactionController.js

const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part'); 
const Service = require('../models/Service');
const Job = require('../models/Job'); 
const User = require('../models/User');

/**
 * Fungsi untuk generate nomor invoice otomatis
 * Format: INV-YYYYMMDD-001
 */
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getDate().toString().padStart(2, '0');
    
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
 * LOGIC UTAMA TRANSAKSI
 * Memproses penyimpanan Header, Detail, Update Stok, dan Pembuatan Job Mekanik
 */
const processTransactionLogic = async (reqBody, userCreator) => {
    console.log("🔵 [DEBUG] Data Masuk ke Backend:", JSON.stringify(reqBody, null, 2));

    const { 
        customerName, vehicleLicense, totalAmount, 
        discount, grandTotal, paymentMethod, 
        notes, itemDetails, assignedTo 
    } = reqBody;

    // Pastikan angka valid
    const fixedTotalAmount = parseInt(totalAmount) || 0;
    const fixedDiscount = parseInt(discount) || 0;
    const fixedGrandTotal = parseInt(grandTotal) || (fixedTotalAmount - fixedDiscount);

    // 1. Identifikasi Mekanik (Jika ada)
    let mechanicId = null;
    let mechanicName = "Tanpa Mekanik";
    if (assignedTo && assignedTo !== "" && assignedTo !== "null") {
        const mechanic = await User.findById(assignedTo);
        if (mechanic) {
            mechanicId = mechanic._id;
            mechanicName = mechanic.name;
        }
    }

    // Gunakan Transaction Session jika memungkinkan (opsional), 
    // di sini kita gunakan alur standar yang diperbaiki
    const invoiceNumber = await generateInvoiceNumber();

    // 2. Buat Header Transaksi
    const newTransaction = await Transaction.create({
        invoiceNumber,
        customerName,
        vehicleLicense,
        mechanicId,
        mechanicName,
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

    // 3. Proses Detail Item (Looping)
    if (itemDetails && itemDetails.length > 0) {
        let items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;

        for (const item of items) {
            console.log(`🔍 [DEBUG] Mencari Item ID: ${item.itemId} (Tipe: ${item.itemType})`);

            let dbItem = null;
            let itemName = "";
            let itemCode = "";

            // LOGIC FIX: Cari berdasarkan tipe yang dikirim frontend
            if (item.itemType === 'part') {
                dbItem = await Part.findById(item.itemId);
                if (dbItem) {
                    itemName = dbItem.name;
                    itemCode = dbItem.code;
                    
                    // Cek Stok
                    if (dbItem.stock < item.quantity) {
                        throw new Error(`Stok ${itemName} tidak mencukupi (Sisa: ${dbItem.stock}).`);
                    }
                    
                    // Siapkan antrian update stok
                    partUpdates.push({
                        updateOne: {
                            filter: { _id: item.itemId },
                            update: { $inc: { stock: -item.quantity } }
                        }
                    });
                }
            } else if (item.itemType === 'service') {
                dbItem = await Service.findById(item.itemId);
                if (dbItem) {
                    // FIX: Gunakan .name dan .code sesuai model Service terbaru Anda
                    itemName = dbItem.name; 
                    itemCode = dbItem.code;
                }
            }

            // Jika item tetap tidak ditemukan (null)
            if (!dbItem) {
                console.error(`❌ [ERROR] Item ID ${item.itemId} TIDAK ADA di DB!`);
                throw new Error(`Item ${item.name || 'Terpilih'} tidak terdaftar di database.`);
            }

            jobDescriptionItems.push(`${itemName} (${item.quantity})`);

            const subTotal = item.quantity * item.pricePerUnit;
            
            detailsToSave.push({
                transactionId,
                itemType: item.itemType, 
                itemId: item.itemId,
                itemName: itemName,      // Field ini sekarang terisi (Mencegah ValidationError)
                itemCode: itemCode,      // Field ini sekarang terisi (Mencegah ValidationError)
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                subTotal: subTotal
            });
        }
    }

    // 4. Eksekusi Batch Save & Update
    if (partUpdates.length > 0) await Part.bulkWrite(partUpdates);
    
    let savedDetails = [];
    if (detailsToSave.length > 0) {
        savedDetails = await TransactionDetail.insertMany(detailsToSave);
    }

    // 5. Buat Job (Antrean kerja untuk mekanik)
    if (mechanicId) {
        await Job.create({
            jobTitle: notes && notes !== '-' ? notes : `Servis ${vehicleLicense}`, 
            description: `Plat: ${vehicleLicense}. Pelanggan: ${customerName}. Item: ${jobDescriptionItems.join(', ')}`,
            mechanicId: mechanicId,
            transactionId: transactionId,
            vehicleLicense: vehicleLicense,
            customerName: customerName,
            status: 'pending'
        });
    }

    return { transaction: newTransaction, details: savedDetails };
};

// --- CONTROLLER EXPORTS ---

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

        res.render('transactions/add', { title: 'Transaksi Baru', parts, services, mechanics, user: req.user });
    } catch (error) { res.status(500).send("Error loading page"); }
};

const createTransactionApi = async (req, res) => {
    try {
        const result = await processTransactionLogic(req.body, req.user);
        res.status(201).json({ success: true, message: 'Transaksi Berhasil!', data: result });
    } catch (error) {
        console.error("Transaction Error Detail:", error);
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
        if (!transaction) return res.status(404).json({ success: false, message: 'Transaksi Tidak Ditemukan' });
        
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.status(200).json({ success: true, data: { ...transaction.toObject(), details } });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

const addDetail = (req, res) => res.status(501).json({ message: 'Not implemented' });

const printReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Transaksi tidak ditemukan");
        
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.render('transactions/receipt', { 
            layout: false, 
            transaction, 
            details 
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

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