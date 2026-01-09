// [LOKASI]: src/models/User.js
const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({ // Gunakan 'userSchema' (huruf kecil)
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    uid: { type: String, required: true, unique: true },
    role: { 
        type: String, 
        enum: ['admin', 'kasir', 'mekanik', 'customer'], 
        default: 'customer' 
    },
    profileImage: { type: String, default: '/img/default-avatar.png' },
    department: {
        type: String,
        default: 'Umum'
    }, // Field sinkronisasi departemen
}, { timestamps: true });

// Ekspor menggunakan nama variabel yang sama dengan di atas
module.exports = mongoose.model('User', userSchema);