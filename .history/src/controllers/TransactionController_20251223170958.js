const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part');
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

// CREATE TRANSACTION (Sinkron Mekanik & Pelanggan)
exports.createTransactionApi = async (req, res) => {
    try {
        const { 
            customer, motorName, vehicleLicense, totalAmount, 
            discount, paymentMethod, notes, assignedTo, itemDetails 
        } = req.body;

        const totalAmountNum = parseInt(totalAmount) || 0;
        const discountNum = parseInt(discount) || 0;
        const grandTotalNum = totalAmountNum - discountNum;

        // Validasi Pelanggan
        let finalCustomerName = "Umum";
        if (customer) {
            const foundCust = await User.findById(customer);
            if (foundCust) finalCustomerName = foundCust.name;
        }

        // Validasi Mekanik
        let mechanicName = "Tanpa Mekanik";
        if (assignedTo && assignedTo !== "null") {
            const mech = await User.findById(assignedTo);
            if (mech) mechanicName = mech.name;
        }

        const invoiceNumber = await generateInvoiceNumber();

        // 1. Simpan Header
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null, 
            customerName: finalCustomerName,
            motorName: motorName || "-",
            vehicleLicense,
            mechanicId: assignedTo && assignedTo !== "null" ? assignedTo : null,
            mechanicName,
            totalAmount: totalAmountNum,
            discount: discountNum,
            grandTotal: grandTotalNum, 
            paymentMethod: paymentMethod || 'Cash',
            notes,
            status: assignedTo ? 'proses' : 'lunas',
            user: req.user._id 
        });

        // 2. Simpan Detail & Update Stok
        const items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;
        let jobDesc = [];
        const details = items.map(item => {
            jobDesc.push(`${item.name} (${item.quantity})`);
            return {
                transactionId: newTransaction._id,
                itemType: item.itemType,
                itemId: item.itemId,
                itemName: item.name,
                itemCode: item.itemCode || "UNK-001",
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                subTotal: item.quantity * item.pricePerUnit
            };
        });
        await TransactionDetail.insertMany(details);

        for (const item of items) {
            if (item.itemType === 'part') {
                await Part.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } });
            }
        }

        // 3. TRIGGER JOB (SINKRON MEKANIK & PELANGGAN)
        if (assignedTo && assignedTo !== "null") {
            await Job.create({
                invoiceNumber,
                customer: { name: finalCustomerName },
                customerId: customer || null, // Link ke Dashboard Pelanggan
                transactionId: newTransaction._id,
                vehicleLicense,
                motorName: motorName || "-",
                mechanicId: assignedTo, // Link ke Dashboard Mekanik
                description: `Servis: ${jobDesc.join(', ')}`,
                status: 'pending'
            });
            await User.findByIdAndUpdate(assignedTo, { status: 'kerja' });
        }

        res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// Fungsi pembantu lainnya
exports.index = async (req, res) => {
    const transactions = await Transaction.find().sort({ createdAt: -1 });
    res.render('transactions/list', { title: 'Riwayat Transaksi', transactions, user: req.user, activePage: 'transactions' });
};

exports.getTransaction = async (req, res) => {
    const header = await Transaction.findById(req.params.id);
    const details = await TransactionDetail.find({ transactionId: header._id });
    res.render('transactions/detail', { title: 'Detail Transaksi', header, details, user: req.user, activePage: 'transactions' });
};

exports.printReceipt = async (req, res) => {
    const transaction = await Transaction.findById(req.params.id);
    const details = await TransactionDetail.find({ transactionId: transaction._id });
    res.render('transactions/receipt', { layout: false, transaction, details });
};

exports.trackStatusPublic = async (req, res) => {
    const { invoice } = req.query;
    const transaction = await Transaction.findOne({ $or: [{ invoiceNumber: invoice }, { vehicleLicense: invoice }] }).sort({ createdAt: -1 });
    if (!transaction) return res.render('index', { title: 'Overview', activePage: 'home', error: 'Data tidak ditemukan.' });
    const job = await Job.findOne({ transactionId: transaction._id });
    res.render('transactions/public-status', { title: 'Status Servis Anda', transaction, job, activePage: 'home', layout: 'layouts/main' });
};

const printReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Transaksi tidak ditemukan");
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.render('transactions/receipt', { layout: false, transaction, details: details || [] });
    } catch (error) {
        res.status(500).send("Gagal memuat struk: " + error.message);
    }
};



const addDetail = (req, res) => res.status(501).json({ message: 'Belum diimplementasikan' });

module.exports = {
    index,
    createTransaction,
    getTransaction,
    printReceipt,
    trackStatusPublic
};