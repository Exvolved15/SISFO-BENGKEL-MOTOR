const Job = require('../models/Job');
const Service = require('../models/Service');
const User = require('../models/User');

// --- UTILITAS: Generate Nomor Invoice ---
const generateInvoiceNumber = async () => {
    const today = new Date();
    const dateString = today.getFullYear().toString() + 
                       (today.getMonth() + 1).toString().padStart(2, '0') + 
                       today.getDate().toString().padStart(2, '0');
    
    const lastJob = await Job.findOne({ 
        invoiceNumber: { $regex: new RegExp(`INV-${dateString}`, 'i') } 
    }).sort({ createdAt: -1 });

    let counter = 1;
    if (lastJob && lastJob.invoiceNumber) {
        const parts = lastJob.invoiceNumber.split('-');
        const lastCounter = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(lastCounter)) counter = lastCounter + 1;
    }
    return `INV-${dateString}-${counter.toString().padStart(3, '0')}`;
};

// --- 1. Buat Job Baru (Oleh Kasir/Admin) ---
exports.createJob = async (req, res) => {
    try {
        const { customerName, vehicleLicense, assignedTo, notes, totalAmount, itemDetails, discount } = req.body;

        if (!customerName || !vehicleLicense) {
            return res.status(400).json({ success: false, message: "Nama pelanggan dan Plat Nomor wajib diisi." });
        }

        const invoiceNumber = await generateInvoiceNumber();
        
        // Menghitung grand total dengan diskon %
        const subtotal = parseInt(totalAmount) || 0;
        const discPercent = parseInt(discount) || 0;
        const grandTotal = subtotal - (subtotal * discPercent / 100);

        const newJob = await Job.create({
            invoiceNumber,
            customer: { name: customerName },
            vehicleLicense,
            description: notes,
            assignedTo: assignedTo || null, // Jika diisi kasir, langsung masuk ke tugas mekanik
            transactionDetails: itemDetails || [],
            totalAmount: subtotal,
            discount: discPercent,
            grandTotal: grandTotal,
            status: assignedTo ? 'on_progress' : 'pending' // Jika ada mekanik langsung on_progress
        });

        res.status(201).json({ success: true, transactionId: newJob._id });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 2. Mekanik Mengambil Job (Self-Service) ---
exports.takeJob = async (req, res) => {
    try {
        const job = await Job.findByIdAndUpdate(req.params.id, {
            assignedTo: req.user._id,
            status: 'on_progress'
        }, { new: true });

        if (!job) return res.status(404).json({ success: false, message: 'Job tidak ditemukan.' });
        res.redirect('/mechanic/dashboard');
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// --- 3. Update Status Selesai ---
exports.updateJobStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        await Job.findByIdAndUpdate(id, { 
            status,
            completedAt: status === 'completed' ? new Date() : null 
        });
        res.status(200).json({ success: true, message: `Status diperbarui ke ${status}` });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- 4. Cetak Resi ---
exports.printReceipt = async (req, res) => {
    try {
        const job = await Job.findById(req.params.id).populate('assignedTo', 'name');
        if (!job) return res.status(404).send('Data Resi tidak ditemukan');
        res.render('transactions/receipt', { layout: false, transaction: job });
    } catch (error) {
        res.status(500).send('Kesalahan cetak: ' + error.message);
    }
};