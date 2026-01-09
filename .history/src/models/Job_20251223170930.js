const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    invoiceNumber: { type: String, required: true },
    customer: {
        name: { type: String, required: true }
    },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, 
    vehicleLicense: { type: String, required: true },
    motorName: { type: String, default: "-" },
    description: { type: String },
    mechanicId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        default: null 
    },
    status: { 
        type: String, 
        enum: ['pending', 'on_progress', 'completed'], 
        default: 'pending' 
    },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    totalAmount: { type: Number, default: 0 },
    completedAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);