// src/controllers/UserController.js
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const admin = require('../config/firebaseAuth'); 

// 1. Membuat User Baru
const createUser = async (req, res) => {
    const { email, password, name, role, department } = req.body; // Tambahkan department

    if (!email || !password || !name || !role) {
        return res.status(400).json({ success: false, message: 'Harap lengkapi semua field.' });
    }

    try {
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        const newUser = await User.create({
            uid: userRecord.uid,
            email,
            name,
            role,
            department: department || '-' // Simpan keterangan bagian
        });

        res.status(201).json({
            success: true,
            message: `User ${role} (${name}) berhasil didaftarkan.`,
            data: { id: newUser._id, role: newUser.role }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 2. Mengambil Semua User (Menampilkan ke Tabel)
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        // Jika permintaan dari browser (bukan API), render halaman list
        if (req.headers.accept.includes('text/html')) {
            return res.render('users/list', {
                title: 'Manajemen Pengguna',
                users,
                user: req.user,
                activePage: 'users'
            });
        }
        res.status(200).json({ success: true, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// 3. Menampilkan Halaman Edit
const getEditUserPage = async (req, res) => {
    try {
        const userToEdit = await User.findById(req.params.id);
        if (!userToEdit) return res.status(404).send("User tidak ditemukan");

        res.render('users/edit', {
            title: 'Edit User',
            user: req.user, 
            targetUser: userToEdit, 
            activePage: 'users'
        });
    } catch (error) {
        res.status(500).send(error.message);
    }
};

// 4. Proses Update Role & Keterangan
const updateUser = async (req, res) => {
    try {
        const { role, department, name, email } = req.body;
        
        // Melakukan update ke database
        await User.findByIdAndUpdate(req.params.id, { 
            name, 
            email, 
            role, 
            department: department || '-' // Sinkronisasi field keterangan bagian
        });

        // Redirect kembali ke daftar user setelah sukses
        res.redirect('/api/users'); 
    } catch (error) {
        res.status(400).send("Gagal update user: " + error.message);
    }
};


// 5. Hapus User
const deleteUser = async (req, res) => {
    try {
        // Menghapus data dari MongoDB
        await User.findByIdAndDelete(req.params.id);
        
        // Catatan: Jika ingin menghapus dari Firebase Auth juga, 
        // Anda butuh userRecord.uid untuk admin.auth().deleteUser(uid)
        
        res.redirect('/api/users');
    } catch (error) {
        res.status(500).send("Gagal menghapus user");
    }
};

// Ekspor semua fungsi secara bersamaan
module.exports = {
    createUser,
    getAllUsers,
    getEditUserPage,
    updateUser,
    deleteUser
};