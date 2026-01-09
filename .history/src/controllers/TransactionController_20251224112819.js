// [LOKASI]: src/controllers/TransactionController.js
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const TransactionDetail = require('../models/TransactionDetail');
const Part = require('../models/Part');
const Service = require('../models/Service');
const Job = require('../models/Job');
const User = require('../models/User');
const ExcelJS = require('exceljs');

// --- HELPER ---
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

// --- FUNGSI-FUNGSI ---

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

const createTransaction = async (req, res) => {
    try {
        const { customer, motorName, vehicleLicense, totalAmount, discount, assignedTo, itemDetails, notes } = req.body;
        const customerData = customer ? await User.findById(customer) : null;
        const mechanicData = (assignedTo && assignedTo !== "null") ? await User.findById(assignedTo) : null;
        const invoiceNumber = await generateInvoiceNumber(); // Gunakan helper yang sudah ada

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
                    itemCode: item.itemCode || "N/A", 
                    pricePerUnit: item.pricePerUnit,
                    quantity: item.quantity,
                    subTotal: item.pricePerUnit * item.quantity
                };
            });
            await TransactionDetail.insertMany(detailsData);

            for (const item of items) {
                if (item.itemType === 'part') {
                    await Part.findByIdAndUpdate(item.itemId, { $inc: { stock: -item.quantity } });
                }
            }
        }

        if (assignedTo && assignedTo !== "null") {
            const fullDescription = itemSummary.join(', ') + (notes ? ` | Ket: ${notes}` : '');
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
        res.status(500).json({ success: false, message: error.message });
    }
};

const getTransaction = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.render('transactions/detail', { 
            title: 'Detail Transaksi', header: transaction, details, user: req.user, activePage: 'transactions' 
        });
    } catch (error) { res.status(500).send(error.message); }
};

const printReceipt = async (req, res) => {
    try {
        const transaction = await Transaction.findById(req.params.id);
        const details = await TransactionDetail.find({ transactionId: transaction._id });
        res.render('transactions/receipt', { layout: false, transaction, details });
    } catch (error) { res.status(500).send(error.message); }
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

        if (!transaction) return res.render('index', { title: 'Overview', activePage: 'home', error: 'Data tidak ditemukan.' });
        const job = await Job.findOne({ transactionId: transaction._id });
        res.render('transactions/public-status', { title: 'Status Servis Anda', transaction, job, activePage: 'home', layout: 'layouts/main' });
    } catch (error) { res.status(500).send(error.message); }
};

const getAllTransactions = async (req, res) => {
    try {
        const transactions = await Transaction.find().sort({ createdAt: -1 });
        res.status(200).json({ success: true, data: transactions });
    } catch (error) { res.status(500).json({ success: false, message: error.message }); }
};

// [LOKASI]: src/controllers/TransactionController.js

exports.getProfitReport = async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        let dateFilter = {};

        if (startDate && endDate) {
            dateFilter = {
                createdAt: {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate + 'T23:59:59.999Z')
                }
            };
        }

        const report = await Transaction.aggregate([
            { $match: dateFilter },
            { $lookup: { from: 'transactiondetails', localField: '_id', foreignField: 'transactionId', as: 'details' } },
            { $unwind: '$details' },
            { $lookup: { from: 'parts', localField: 'details.partId', foreignField: '_id', as: 'partInfo' } },
            { $project: {
                revenue: { $multiply: ['$details.price', '$details.quantity'] },
                cost: { $multiply: [{ $arrayElemAt: ['$partInfo.purchasePrice', 0] }, '$details.quantity'] },
                date: '$createdAt'
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                totalRevenue: { $sum: "$revenue" },
                totalProfit: { $sum: { $subtract: ["$revenue", "$cost"] } }
            }},
            { $sort: { _id: -1 } }
        ]);

        // Kirim data ke view
        res.render('admin/report', { 
            title: 'Laporan Laba Rugi', 
            report, 
            user: req.user,
            activePage: 'reports',
            filters: { startDate: startDate || '', endDate: endDate || '' } // Pastikan ini terkirim
        });
    } catch (error) {
        res.status(500).send("Gagal memuat halaman laporan: " + error.message);
    }
};


const exportProfitToExcel = async (req, res) => {
    try {
        // Ambil data agregasi yang sama dengan laporan di dashboard
        const report = await Transaction.aggregate([
            { $lookup: { from: 'transactiondetails', localField: '_id', foreignField: 'transactionId', as: 'details' } },
            { $unwind: '$details' },
            { $lookup: { from: 'parts', localField: 'details.partId', foreignField: '_id', as: 'partInfo' } },
            { $project: {
                revenue: { $multiply: ['$details.price', '$details.quantity'] },
                cost: { $multiply: [{ $arrayElemAt: ['$partInfo.purchasePrice', 0] }, '$details.quantity'] },
                date: '$createdAt'
            }},
            { $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                totalRevenue: { $sum: "$revenue" },
                totalProfit: { $sum: { $subtract: ["$revenue", "$cost"] } }
            }},
            { $sort: { _id: -1 } }
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Laporan Laba Rugi');

        // Header Kolom
        worksheet.columns = [
            { header: 'Tanggal', key: 'date', width: 20 },
            { header: 'Pendapatan Kotor (Rp)', key: 'revenue', width: 25 },
            { header: 'Laba Bersih (Rp)', key: 'profit', width: 25 },
            { header: 'Margin (%)', key: 'margin', width: 15 }
        ];

        // Isi Data
        report.forEach(item => {
            const margin = ((item.totalProfit / item.totalRevenue) * 100).toFixed(2);
            worksheet.addRow({
                date: item._id,
                revenue: item.totalRevenue,
                profit: item.totalProfit,
                margin: margin + '%'
            });
        });

        // Styling Header
        worksheet.getRow(1).font = { bold: true };

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Laporan_Laba_Rugi.xlsx');

        await workbook.xlsx.write(res);
        res.end();
        
        // Audit Trail: Mencatat siapa yang mendownload laporan
        console.log(`[AUDIT] ${new Date().toLocaleString()} - ${req.user.name} mendownload laporan Excel.`);
        
    } catch (error) {
        res.status(500).send("Gagal export excel: " + error.message);
    }
};
// EKSPOR SEMUA FUNGSI (Sesuai dengan pemanggilan di viewRoutes.js)
module.exports = {
    index,
    createTransaction,
    getTransaction,
    printReceipt,
    trackStatusPublic,
    getAllTransactions,
    getProfitReport, // Sekarang fungsi ini terdaftar dan tidak undefined
    exportProfitToExcel
};