const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part');
const Service = require('../models/Service');
const Job = require('../models/Job');
const User = require('../models/User');

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

// --- LOGIC UTAMA (SINKRONISASI ID PELANGGAN) ---
// src/controllers/TransactionController.js

const processTransactionLogic = async (reqBody, userCreator) => {
    console.log("🔵 [DEBUG] Memproses Logika Transaksi...");

    const { 
        customer, vehicleLicense, totalAmount, 
        discount, grandTotal, paymentMethod, 
        notes, itemDetails, assignedTo 
    } = reqBody;

    // 1. Cari nama asli pelanggan berdasarkan ID
    let finalCustomerName = "Umum";
    if (customer) {
        const foundCustomer = await User.findById(customer);
        if (foundCustomer) {
            finalCustomerName = foundCustomer.name; 
        }
    }

    // 2. Identifikasi Mekanik
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

        // 3. BUAT TRANSAKSI (HANYA SATU KALI)
        // Pastikan field 'customerName' terisi agar tidak terkena ValidationError
        const newTransaction = new Transaction({
            invoiceNumber,
            customer: customer || null,      // Simpan ID untuk Dashboard Pelanggan
            customerName: finalCustomerName, // Simpan Nama agar validasi DB lulus
            vehicleLicense,
            mechanicId,
            mechanicName,
            totalAmount: parseInt(totalAmount) || 0,
            discount: parseInt(discount) || 0,
            grandTotal: parseInt(grandTotal) || 0,
            paymentMethod: paymentMethod || 'Cash',
            notes: notes || '-',
            status: mechanicId ? 'proses' : 'lunas', // 'proses' agar muncul di mekanik
            user: userCreator._id 
        });

        await newTransaction.save(); // Eksekusi simpan ke database

        const transactionId = newTransaction._id;
        let jobDescriptionItems = [];
        let detailsToSave = [];

        // 4. Proses Detail Item & Update Stok
        if (itemDetails) {
            let items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;

            for (const item of items) {
                // ... (Logika update stok suku cadang tetap sama) ...
                jobDescriptionItems.push(`${item.name} (${item.quantity})`);
                detailsToSave.push({
                    transactionId,
                    itemType: item.itemType,
                    itemId: item.itemId,
                    itemName: item.name,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    subTotal: item.quantity * item.pricePerUnit
                });
            }
        }

        if (detailsToSave.length > 0) await TransactionDetail.insertMany(detailsToSave);

        // 5. BUAT JOB MEKANIK
        if (mechanicId) {
            await Job.create({
                invoiceNumber,
                customerId: customer || null, // Hubungkan ke Dashboard Pelanggan
                description: `Servis: ${jobDescriptionItems.join(', ')}`,
                mechanicId,
                transactionId,
                vehicleLicense,
                customerName: finalCustomerName,
                status: 'pending'
            });
        }

        return { transaction: newTransaction };
    } catch (error) {
        throw error;
    }
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
        // Tambahkan pengambilan user untuk dropdown pelanggan
        const users = await User.find({ role: { $in: ['user', 'customer'] } }).sort({ name: 1 });

        res.render('transactions/add', { 
            title: 'Transaksi Baru', 
            parts, 
            services, 
            mechanics, 
            users, 
            user: req.user 
        });
    } catch (error) { res.status(500).send("Error loading page"); }
};

const createTransactionApi = async (req, res) => {
    try {
        const result = await processTransactionLogic(req.body, req.user);
        res.status(201).json({ success: true, message: 'Transaksi Berhasil!', data: result });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

const printReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Data Resi tidak ditemukan");
        const details = await TransactionDetail.find({ transactionId: req.params.id });
        res.render('transactions/receipt', { layout: false, transaction, details });
    } catch (error) { res.status(500).send("Error memuat resi"); }
};

module.exports = {
    index, 
    createView, 
    createTransactionApi, // Pastikan nama ini sesuai
    getAllTransactions, 
    getTransaction, 
    processTransactionLogic, 
    printReceipt
};