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
        // Konfigurasi Penyimpanan Multer
        const storage = multer.diskStorage({
            destination: (req, file, cb) => {
                cb(null, 'uploads/profiles/');
            },
            filename: (req, file, cb) => {
                // Nama file: IDUser-Timestamp.jpg
                cb(null, req.params.id + '-' + Date.now() + path.extname(file.originalname));
            }
        });

        const upload = multer({ 
            storage: storage,
            limits: { fileSize: 2 * 1024 * 1024 }, // Batas 2MB
            fileFilter: (req, file, cb) => {
                const fileTypes = /jpeg|jpg|png/;
                const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
                if (extname) return cb(null, true);
                cb(new Error('Hanya file gambar (jpg/png) yang diperbolehkan!'));
            }
        }).single('profileImage');
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
        if (req.user.role === 'admin') {
            res.redirect('/admin/dashboard');
        } else if (req.user.role === 'kasir') {
            res.redirect('/kasir/dashboard');
        } else {
            res.redirect('/mechanic/dashboard');
        }

        // Redirect kembali ke daftar user setelah sukses
        res.redirect('/api/users'); 
    } catch (error) {
        res.status(400).send("Gagal update user: " + error.message);
    }
};

// Fungsi Update Profil (Termasuk Foto)
exports.updateUserProfile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) return res.status(400).send(err.message);

        try {
            const updateData = {
                name: req.body.name,
                department: req.body.department
            };

            // Jika ada file baru yang diupload, masukkan ke data update
            if (req.file) {
                updateData.profileImage = '/uploads/profiles/' + req.file.filename;
            }

            await User.findByIdAndUpdate(req.params.id, updateData);
            res.redirect('back'); // Kembali ke halaman sebelumnya
        } catch (error) {
            res.status(500).send("Gagal update profil");
        }
    });
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