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

// 1. Menampilkan Daftar Transaksi
const index = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.render('transactions/list', { 
            title: 'Riwayat Transaksi', 
            transactions, 
            user: req.user, 
            activePage: 'transactions' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

// 2. Simpan Transaksi Baru (SINKRON MEKANIK & PELANGGAN)
const createTransaction = async (req, res) => {
    try {
        const { 
            customer, totalAmount, discount, motorName,
            vehicleLicense, paymentMethod, notes, itemDetails, assignedTo 
        } = req.body;

        const totalAmountNum = parseInt(totalAmount) || 0;
        const discountNum = parseInt(discount) || 0;
        const grandTotalNum = totalAmountNum - discountNum;

        // Cari Info Pelanggan
        let finalCustomerName = "Umum";
        if (customer) {
            const foundCustomer = await User.findById(customer);
            if (foundCustomer) finalCustomerName = foundCustomer.name;
        }

        // Cari Info Mekanik
        let mechanicName = "Tanpa Mekanik";
        if (assignedTo && assignedTo !== "null") {
            const mech = await User.findById(assignedTo);
            if (mech) mechanicName = mech.name;
        }

        const invoiceNumber = await generateInvoiceNumber();

        // A. Simpan Header Transaksi
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null, 
            customerName: finalCustomerName,
            motorName: motorName || "-",
            vehicleLicense: vehicleLicense || "-",
            mechanicId: assignedTo || null,
            mechanicName: mechanicName,
            totalAmount: totalAmountNum,
            discount: discountNum,
            grandTotal: grandTotalNum, 
            paymentMethod: paymentMethod || 'Cash',
            notes: notes || '-',
            status: assignedTo ? 'proses' : 'lunas',
            user: req.user._id 
        });

        // B. Proses Detail & Potong Stok
        const items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;
        let jobDescriptionItems = [];
        const detailsToSave = [];

        for (const item of items) {
            if (item.itemType === 'part') {
                await Part.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } });
            }
            jobDescriptionItems.push(`${item.name} (${item.quantity})`);
            
            detailsToSave.push({
                transactionId: newTransaction._id,
                itemType: item.itemType,
                itemId: item.itemId,
                itemName: item.name,
                itemCode: item.itemCode || "UNK-001",
                quantity: item.quantity,
                pricePerUnit: item.pricePerUnit,
                subTotal: item.quantity * item.pricePerUnit
            });
        }

        if (detailsToSave.length > 0) {
            await TransactionDetail.insertMany(detailsToSave);
        }

        // C. SINKRON KE TABEL JOB (Mekanik & Tracking Pelanggan)
        if (assignedTo && assignedTo !== "null") {
            await Job.create({
                invoiceNumber: invoiceNumber,
                customer: { name: finalCustomerName },
                customerId: customer || null, 
                transactionId: newTransaction._id,
                vehicleLicense: vehicleLicense || "-",
                motorName: motorName || "-",
                assignedTo: assignedTo,
                description: `Servis: ${jobDescriptionItems.join(', ')}`,
                status: 'pending'
            });

            // Update status Mekanik jadi sibuk
            await User.findByIdAndUpdate(assignedTo, { status: 'kerja' });
        }

        res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
        console.error("CREATE ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Ambil Detail Transaksi
const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        if (!transaction) return res.status(404).send("Transaksi tidak ditemukan");
        const details = await TransactionDetail.find({ transactionId: transaction._id });

        res.render('transactions/detail', { 
            title: 'Detail Transaksi', 
            header: transaction, 
            details: details, 
            user: req.user, 
            activePage: 'transactions' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
};

// 4. Cetak Struk
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

// 5. Tracking Publik
const trackStatusPublic = async (req, res) => {
    try {
        const { invoice } = req.query;
        const transaction = await Transaction.findOne({
            $or: [
                { invoiceNumber: { $regex: invoice, $options: 'i' } },
                { vehicleLicense: { $regex: invoice, $options: 'i' } }
            ]
        }).sort({ createdAt: -1 });

        if (!transaction) {
            return res.render('index', { 
                title: 'Overview', activePage: 'home', 
                error: 'Data tidak ditemukan. Periksa kembali No. Invoice / Plat Nomor.' 
            });
        }
        const job = await Job.findOne({ transactionId: transaction._id });
        res.render('transactions/public-status', {
            title: 'Status Servis Anda', transaction, job, activePage: 'home', layout: 'layouts/main'
        });
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

module.exports = {
    index,
    createTransaction,
    getTransaction,
    printReceipt,
    trackStatusPublic,
    getAllTransactions
};