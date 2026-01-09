const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part');
const Service = require('../models/Service');
const Job = require('../models/Job');
const User = require('../models/User');

// Helper: Membuat Nomor Invoice Otomatis
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + (today.getMonth() + 1).toString().padStart(2, '0') + today.getDate().toString().padStart(2, '0');
    const lastTransaction = await Transaction.findOne({ invoiceNumber: { $regex: new RegExp(`INV-${dateString}`, 'i') } }).sort({ createdAt: -1 });
    let counter = 1;
    if (lastTransaction) {
        const parts = lastTransaction.invoiceNumber.split('-');
        counter = parseInt(parts[parts.length - 1], 10) + 1;
    }
    return `INV-${dateString}-${counter.toString().padStart(3, '0')}`;
};

// --- LOGIK UTAMA TRANSAKSI ---
const processTransactionLogic = async (reqBody, userCreator) => {
    const { 
        customer, totalAmount, discount, grandTotal, // Ambil data dari reqBody
        vehicleLicense, paymentMethod, notes, itemDetails, assignedTo 
    } = reqBody;

    // Pastikan konversi ke angka agar perhitungan di resi tidak NaN
    const totalAmountNum = parseInt(totalAmount) || 0;
    const discountNum = parseInt(discount) || 0;
    const grandTotalNum = totalAmountNum - discountNum;

    let finalCustomerName = "Umum";
    if (customer) {
        const foundCustomer = await User.findById(customer);
        if (foundCustomer) finalCustomerName = foundCustomer.name;
    }

    let mechanicId = null;
    let mechanicName = "Tanpa Mekanik";
    if (assignedTo && assignedTo !== "" && assignedTo !== "null") {
        const mechanic = await User.findById(assignedTo);
        if (mechanic) {
            mechanicId = mechanic._id;
            mechanicName = mechanic.name;
        }
    }

    try {
        const invoiceNumber = await generateInvoiceNumber();

        // 1. Simpan Transaksi Header
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null, 
            customerName: finalCustomerName,
            vehicleLicense,
            mechanicId,
            mechanicName,
            totalAmount: totalAmountNum,
            discount: discountNum,
            grandTotal: grandTotalNum, // PERBAIKAN: Menghilangkan typo ggrandTotal dan koma yang hilang
            paymentMethod: paymentMethod || 'Cash',
            notes: notes || '-',
            status: mechanicId ? 'proses' : 'lunas',
            user: userCreator._id 
        });

        const transactionId = newTransaction._id;
        let detailsToSave = [];
        let jobDescriptionItems = [];

        // 2. Proses Detail (SINKRONISASI ITEMCODE)
        if (itemDetails) {
            let items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;
            for (const item of items) {
                // Update Stok jika itu barang
                if (item.itemType === 'part') {
                    await Part.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } });
                }

                jobDescriptionItems.push(`${item.name} (${item.quantity})`);
                
                // Masukkan data ke array detail
                detailsToSave.push({
                    transactionId,
                    itemType: item.itemType,
                    itemId: item.itemId,
                    itemName: item.name,
                    itemCode: item.itemCode || "UNK-001", // SOLUSI: Pastikan itemCode tidak undefined
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    subTotal: item.quantity * item.pricePerUnit
                });
            }
        }

        if (detailsToSave.length > 0) {
            await TransactionDetail.insertMany(detailsToSave);
        }

        // 5. BUAT JOB MEKANIK (DIPERBAIKI)
        if (mechanicId) {
            try {
                await Job.create({
                    invoiceNumber: invoiceNumber,
                    customer: {
                        name: finalCustomerName 
                    },
                    customerId: customer || null, 
                    transactionId: transactionId,
                    vehicleLicense: vehicleLicense,
                    mechanicId: mechanicId,
                    assignedTo: mechanicId,
                    description: `Servis: ${jobDescriptionItems.join(', ')}`,
                    status: 'pending'
                });
                console.log(`✅ Job berhasil dibuat untuk pelanggan: ${finalCustomerName}`);
            } catch (jobError) {
                console.error("❌ Job Validation Error:", jobError.message);
                throw new Error("Gagal membuat data pengerjaan: " + jobError.message);
            }
        }

        return { transaction: newTransaction };
    } catch (error) {
        console.error("Logic Error:", error.message);
        throw error;
    }
};

// --- FUNGSI-FUNGSI EXPORT ---

const index = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.render('transactions/list', { title: 'Riwayat Transaksi', transactions, user: req.user, activePage: 'transactions' });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Transaksi tidak ditemukan");

        const details = await TransactionDetail.find({ transactionId: transaction._id });

        res.render('transactions/detail', { 
            title: 'Detail Transaksi', 
            header: transaction, // SINKRON: detail.ejs butuh variabel 'header'
            details: details, 
            user: req.user, 
            activePage: 'transactions' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

const createTransactionApi = async (req, res) => {
    try {
        const result = await processTransactionLogic(req.body, req.user);
        res.status(201).json({ success: true, message: 'Transaksi Berhasil!', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// [LOKASI]: src/controllers/TransactionController.js

const printReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Transaksi tidak ditemukan");

        // Ambil detail agar tabel barang di resi terisi
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        
        // Render file receipt.ejs
        res.render('transactions/receipt', { 
            layout: false, 
            transaction: transaction, 
            details: details || [] 
        });
    } catch (error) {
        res.status(500).send("Gagal memuat struk: " + error.message);
    }
};
const addDetail = (req, res) => res.status(501).json({ message: 'Belum diimplementasikan' });

module.exports = {
    index,
    createTransactionApi,
    getAllTransactions,
    getTransaction,
    printReceipt,
    addDetail,
    processTransactionLogic
};