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
const processTransactionLogic = async (reqBody, userCreator) => {
    const { 
        customer, vehicleLicense, totalAmount, 
        discount, grandTotal, paymentMethod, 
        notes, itemDetails, assignedTo 
    } = reqBody;

    const fixedTotalAmount = parseInt(totalAmount) || 0;
    const fixedDiscount = parseInt(discount) || 0;
    const fixedGrandTotal = grandTotal ? parseInt(grandTotal) : (fixedTotalAmount - fixedDiscount);

    // 1. Cari data User berdasarkan ID untuk mendapatkan nama asli (Nickname)
    let finalCustomerName = "Umum";
    if (customer && customer !== "") {
        const foundCustomer = await User.findById(customer);
        if (foundCustomer) {
            finalCustomerName = foundCustomer.name; 
        }
    }

    // 2. Tentukan Mekanik
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

        // 3. Buat Header Transaksi (Simpan ID Pelanggan di field 'customer')
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null, // ID Pelanggan untuk Sinkronisasi Dashboard
            customerName: finalCustomerName, 
            vehicleLicense,
            mechanicId,
            mechanicName,
            totalAmount: fixedTotalAmount,
            discount: fixedDiscount,
            grandTotal: fixedGrandTotal,
            paymentMethod: paymentMethod || 'Cash',
            notes: notes || '-',
            status: mechanicId ? 'proses' : 'lunas', // Jika ada mekanik status 'proses'
            user: userCreator._id 
        });

        const transactionId = newTransaction._id;
        let detailsToSave = [];
        let partUpdates = [];
        let jobDescriptionItems = [];

        // 4. Proses Detail Item
        if (itemDetails) {
            let items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;

            for (const item of items) {
                let dbItem = null;
                let itemName = item.name || "Unknown Item"; 
                let itemCode = "UNK-001";      

                if (item.itemType === 'part') {
                    dbItem = await Part.findById(item.itemId);
                    if (dbItem) {
                        itemName = dbItem.name;
                        itemCode = dbItem.code;
                        if (dbItem.stock < item.quantity) throw new Error(`Stok ${itemName} kurang.`);
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
                        itemName = dbItem.name;
                        itemCode = dbItem.code;
                    }
                }

                jobDescriptionItems.push(`${itemName} (${item.quantity})`);
                detailsToSave.push({
                    transactionId,
                    itemType: item.itemType,
                    itemId: item.itemId,
                    itemName: itemName,
                    itemCode: itemCode,
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    subTotal: item.quantity * item.pricePerUnit
                });
            }
        }

        if (partUpdates.length > 0) await Part.bulkWrite(partUpdates);
        if (detailsToSave.length > 0) await TransactionDetail.insertMany(detailsToSave);

        // 5. Buat Job Mekanik
        if (mechanicId) {
            try {
                await Job.create({
                    invoiceNumber: invoiceNumber,
                    customerId: customer || null, // Hubungkan ke Akun Pelanggan
                    jobTitle: notes && notes !== '-' ? notes : `Servis ${vehicleLicense}`, 
                    description: `Items: ${jobDescriptionItems.join(', ')}`,
                    mechanicId: mechanicId,
                    assignedTo: mechanicId, 
                    transactionId: transactionId,
                    vehicleLicense: vehicleLicense,
                    customerName: finalCustomerName,
                    status: 'pending'
                });
            } catch (jobError) {
                console.error("⚠️ Gagal membuat Job:", jobError.message);
            }
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
    index, createView, createTransactionApi, printReceipt, processTransactionLogic
};