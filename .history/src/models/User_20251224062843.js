const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    uid: { type: String, required: true, unique: true },
    role: { 
        type: String, 
        enum: ['admin', 'kasir', 'mekanik', 'customer'], 
        default: 'customer' 
    },
    profileImage: { type: String, default: '/img/default-avatar.png' },
    // TAMBAHKAN FIELD INI AGAR SINKRON DENGAN INDEX
    bio: { 
        type: String, 
        default: 'Staff profesional Sisfo Bengkel siap melayani Anda.' 
    },
    status: { 
        type: String, 
        enum: ['ready', 'kerja'], 
        default: 'ready' 
    },
    department: {
        type: String,
        default: 'Umum'
    },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);