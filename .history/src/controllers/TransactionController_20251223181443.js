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

// 1. Menampilkan Daftar Transaksi (Halaman List)
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

// 2. Fungsi Utama Simpan Transaksi (Sinkronisasi Mekanik & Pelanggan)
// FIX: Menggunakan const agar bisa di-export di bagian bawah
const createTransaction = async (req, res) => {
    try {
        const { customer, motorName, vehicleLicense, totalAmount, discount, assignedTo, itemDetails, notes } = req.body;

        const customerData = customer ? await User.findById(customer) : null;
        const mechanicData = (assignedTo && assignedTo !== "null") ? await User.findById(assignedTo) : null;
        const invoiceNumber = 'INV-' + Date.now();

        // 1. Simpan Header Transaksi
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null,
            customerName: customerData ? customerData.name : 'Umum',
            motorName: motorName || '-',
            vehicleLicense: vehicleLicense,
            mechanicId: assignedTo && assignedTo !== "null" ? assignedTo : null,
            mechanicName: mechanicData ? mechanicData.name : 'Tanpa Mekanik',
            totalAmount: parseInt(totalAmount) || 0,
            discount: parseInt(discount) || 0,
            grandTotal: (parseInt(totalAmount) || 0) - (parseInt(discount) || 0),
            status: assignedTo && assignedTo !== "null" ? 'proses' : 'lunas',
            notes: notes || '-',
            user: req.user._id
        });

        // 2. Olah Data Item & Perbaiki itemCode
        const items = typeof itemDetails === 'string' ? JSON.parse(itemDetails) : itemDetails;
        let itemSummary = [];

        if (items && items.length > 0) {
            const detailsData = items.map(item => {
                itemSummary.push(`${item.name} (${item.quantity}x)`);
                
                return {
                    transactionId: newTransaction._id,
                    itemType: item.itemType,
                    itemId: item.itemId,
                    itemName: item.name,
                    // FIX: Pastikan itemCode tidak undefined/null
                    itemCode: item.itemCode || "N/A", 
                    pricePerUnit: item.pricePerUnit,
                    quantity: item.quantity,
                    subTotal: item.pricePerUnit * item.quantity
                };
            });
            // Simpan ke database
            await TransactionDetail.insertMany(detailsData);

            // Update Stok
            for (const item of items) {
                if (item.itemType === 'part') {
                    await Part.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } });
                }
            }
        }

        // 3. GABUNGKAN ITEM + CATATAN UNTUK DESKRIPSI JOB
        
        // 3. SINKRONISASI KE TABEL JOB (Isi Invoice Detail & Notes)
        const fullDescription = itemSummary.join(', ') + (notes ? ` | Ket: ${notes}` : '');

        if (assignedTo && assignedTo !== "null") {
            await Job.create({
                invoiceNumber: invoiceNumber,
                transactionId: newTransaction._id,
                customerId: customer || null,
                customer: { name: customerData ? customerData.name : 'Umum' },
                vehicleLicense: vehicleLicense,
                motorName: motorName || '-',
                mechanicId: assignedTo,
                description: fullDescription,
                status: 'pending'
            });

            await User.findByIdAndUpdate(assignedTo, { status: 'kerja' });
        }

        res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
        console.error("LOGIC ERROR:", error.message);
        res.status(500).json({ success: false, message: "Gagal menyimpan: " + error.message });
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
        res.render('transactions/receipt', { 
            layout: false, 
            transaction, 
            details: details || [] 
        });
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
                title: 'Overview', 
                activePage: 'home', 
                error: 'Data tidak ditemukan.' 
            });
        }
        const job = await Job.findOne({ transactionId: transaction._id });
        res.render('transactions/public-status', {
            title: 'Status Servis Anda',
            transaction,
            job,
            activePage: 'home',
            layout: 'layouts/main'
        });
    } catch (error) {
        res.status(500).send("Error tracking: " + error.message);
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

// EKSPOR SEMUA FUNGSI SECARA KONSISTEN
module.exports = {
    index,
    createTransaction,
    getTransaction,
    printReceipt,
    trackStatusPublic,
    getAllTransactions
};