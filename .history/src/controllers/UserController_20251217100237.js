// src/controllers/UserController.js

const User = require('../models/User'); // Pastikan model User diimpor
// Jika Anda menggunakan Firebase Admin SDK untuk manajemen user
const admin = require('../config/firebaseAuth'); // Asumsi path Anda

// @deskripsi: Admin mendaftarkan user baru (Kasir/Mekanik)
// @rute: POST /api/users/register
// @akses: Private (Admin)
// GANTI NAMA: registerUser menjadi createUser (agar sesuai dengan routes)
const createUser = async (req, res) => { // <--- DIGANTI KE 'createUser'
    const { email, password, name, role } = req.body;

    // 1. Validasi Input (Opsional, tapi penting)
    if (!email || !password || !name || !role) {
        return res.status(400).json({ success: false, message: 'Harap lengkapi semua field.' });
    }
    
    // Pastikan peran yang dimasukkan valid
    if (!['kasir', 'mekanik'].includes(role)) {
        return res.status(400).json({ success: false, message: 'Peran tidak valid.' });
    }

    try {
        // 2. Buat User di Firebase Authentication
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // 3. Simpan User ID dan Role ke MongoDB
        const newUser = await User.create({
            uid: userRecord.uid, // UID dari Firebase
            email,
            name,
            role,
        });

        console.log(`SUCCESS: User ${email} berhasil disimpan di database dengan UID ${userRecord.uid}`);
        
        // KRITIS: TIDAK ADA JWT/COOKIE/SESSION TOKEN DI SINI
        // Admin tetap login di sesinya sendiri

        // Respons ke Admin
        res.status(201).json({
            success: true,
            message: `User ${role} (${name}) berhasil didaftarkan.`,
            data: { id: newUser._id, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        console.error('Pendaftaran User Gagal:', error.message);
        // Error Firebase Auth (misal: email sudah terdaftar)
        if (error.code && error.code.startsWith('auth/')) {
            return res.status(400).json({ success: false, message: error.message });
        }
        res.status(500).json({ success: false, message: 'Server error saat mendaftarkan user.' });
    }
};


// @deskripsi: Mengambil semua daftar user (Admin hanya untuk manajemen)
// @rute: GET /api/users
// @akses: Private (Admin)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-currentSessionToken'); 
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// --- DEFINISIKAN update User ---
const updateUser = async (req, res) => { 
    // ... logic update user (placeholder atau yang sudah Anda buat) ...
    res.status(200).json({ success: true, message: 'User updated (placeholder)' });
};


// --- DEFINISIKAN deleteUser ---
const deleteUser = async (req, res) => { 
    // ... logic delete user (placeholder atau yang sudah Anda buat) ...
    res.status(204).json({ success: true, message: 'User deleted (placeholder)' }); // 204 No Content
};
// ------------------------------

// ... (Tambahkan fungsi untuk updateRole, deleteUser, dll.)

module.exports = {
    createUser,
    getAllUsers,
    updateUser
    // ...
};