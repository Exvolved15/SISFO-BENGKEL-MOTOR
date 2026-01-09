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
                error: 'Data tidak ditemukan. Periksa kembali No. Invoice / Plat Nomor.' 
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

// --- LOGIK UTAMA TRANSAKSI ---
const createTransaction = async (req, res) => {
    try {
        const { 
            customer, motorName, vehicleLicense, totalAmount, 
            discount, paymentMethod, notes, assignedTo, itemDetails 
        } = req.body;

        const totalAmountNum = parseInt(totalAmount) || 0;
        const discountNum = parseInt(discount) || 0;
        const grandTotalNum = totalAmountNum - discountNum;

        // Sinkron Pelanggan
        let finalCustomerName = "Umum";
        if (customer) {
            const foundCustomer = await User.findById(customer);
            if (foundCustomer) finalCustomerName = foundCustomer.name;
        }

        // Sinkron Mekanik
        let mechanicName = "Tanpa Mekanik";
        if (assignedTo) {
            const foundMech = await User.findById(assignedTo);
            if (foundMech) mechanicName = foundMech.name;
        }

        const invoiceNumber = await generateInvoiceNumber();

        // 1. Simpan Header Transaksi
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null, 
            customerName: finalCustomerName,
            motorName: motorName || "-",
            vehicleLicense,
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

        // 2. Proses Detail & Update Stok
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

        // 3. SINKRON KE TABEL JOB (Agar muncul di Dashboard Mekanik & Pelanggan)
        if (assignedTo) {
            await Job.create({
                invoiceNumber: invoiceNumber,
                customer: { name: finalCustomerName },
                customerId: customer || null, 
                transactionId: newTransaction._id,
                vehicleLicense: vehicleLicense,
                motorName: motorName || "-",
                assignedTo: assignedTo,
                description: `Servis: ${jobDescriptionItems.join(', ')}`,
                status: 'pending'
            });

            // Update status Mekanik jadi 'kerja'
            await User.findByIdAndUpdate(assignedTo, { status: 'kerja' });
        }

        res.status(201).json({ success: true, data: newTransaction });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const processTransactionLogic = async (reqBody, userCreator) => {
    const { 
        customer, totalAmount, discount, motorName,
        vehicleLicense, paymentMethod, notes, itemDetails, assignedTo 
    } = reqBody;

    // FIX: Pastikan konversi ke angka agar perhitungan di riwayat & resi tidak 0 atau NaN
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

        // 1. Simpan Transaksi Header (Field grandTotal harus masuk DB agar muncul di Riwayat)
        const newTransaction = await Transaction.create({
            invoiceNumber,
            customer: customer || null, 
            customerName: finalCustomerName,
            motorName: motorName || "-",
            vehicleLicense,
            mechanicId,
            mechanicName,
            // SIMPAN HASIL PERHITUNGAN NUMERIK
            totalAmount: totalAmountNum,
            discount: discountNum,
            grandTotal: grandTotalNum, 
            paymentMethod: paymentMethod || 'Cash',
            notes: notes || '-',
            status: assignedTo ? 'proses' : 'lunas',
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
                    itemCode: item.itemCode || "UNK-001",
                    quantity: item.quantity,
                    pricePerUnit: item.pricePerUnit,
                    subTotal: item.quantity * item.pricePerUnit
                });
            }
        }

        if (detailsToSave.length > 0) {
            await TransactionDetail.insertMany(detailsToSave);
        }

        // 5. BUAT JOB MEKANIK
        if (mechanicId) {
            try {
                await Job.create({
                    invoiceNumber: invoiceNumber,
                    customer: { name: finalCustomerName },
                    customerId: customer || null, 
                    transactionId: transactionId,
                    vehicleLicense: vehicleLicense,
                    motorName: motorName || "-", // FIX: Tambahkan baris ini agar data motor tersimpan di tabel Job
                    mechanicId: mechanicId,
                    assignedTo: mechanicId,
                    description: `Servis: ${jobDescriptionItems.join(', ')}`,
                    status: 'pending'
                });
                console.log(`✅ Job berhasil dibuat dengan unit: ${motorName}`);
            } catch (jobError) {
                console.error("❌ Job Error:", jobError.message);
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
            header: transaction, 
            details: details, 
            user: req.user, 
            activePage: 'transactions' 
        });
    } catch (error) {
        res.status(500).send("Error: " + error.message);
    }
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