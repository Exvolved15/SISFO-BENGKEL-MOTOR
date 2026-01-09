const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    jobTitle: { type: String, required: true },
    description: { type: String },
    mechanicId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    transactionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Transaction' },
    vehicleLicense: { type: String, required: true },
    customerName: { type: String, required: true },
    status: { 
        type: String, 
        enum: ['pending', 'on_progress', 'completed'], 
        default: 'pending' 
    }
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);