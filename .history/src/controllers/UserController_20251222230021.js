const User = require('../models/User');
const admin = require('../config/firebaseAuth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// ==================================================================
// 1. KONFIGURASI MULTER
// ==================================================================
const uploadDir = 'uploads/profiles/';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, req.params.id + '-' + Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) return cb(null, true);
        cb(new Error('Hanya file gambar (jpg/png) yang diperbolehkan!'));
    }
}).single('profileImage');

// ==================================================================
// 2. FUNGSI-FUNGSI CONTROLLER
// ==================================================================

// --- Membuat User Baru (Admin Only) ---
const createUser = async (req, res) => {
    const { email, password, name, role, department } = req.body;
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
            department: department || '-'
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

// --- Mengambil Semua User (List Manajemen) ---
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).sort({ createdAt: -1 });
        if (req.headers.accept && req.headers.accept.includes('text/html')) {
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

// --- Menampilkan Halaman Edit ---
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

// --- Update Data User (Oleh Admin via Tabel) ---
const updateUser = async (req, res) => {
    try {
        const { role, department, name, email } = req.body;
        await User.findByIdAndUpdate(req.params.id, {
            name,
            email,
            role,
            department: department || '-'
        });
        res.redirect('/api/users');
    } catch (error) {
        res.status(400).send("Gagal update user: " + error.message);
    }
};

// --- Update Profil (Foto & Identitas oleh User Sendiri) ---
const updateUserProfile = (req, res) => {
    upload(req, res, async (err) => {
        if (err) {
            return res.status(400).send("Gagal mengunggah gambar: " + err.message);
        }

        try {
            const { name, department } = req.body;
            const updateData = { name, department };

            if (req.file) {
                updateData.profileImage = '/uploads/profiles/' + req.file.filename;
            }

            const updatedUser = await User.findByIdAndUpdate(
                req.params.id, 
                updateData, 
                { new: true }
            );

            if (!updatedUser) return res.status(404).send("User tidak ditemukan");

            // Redirect ke dashboard masing-masing dengan Cache Busting parameter
            const successParam = "?update=success&t=" + Date.now();
            
            if (updatedUser.role === 'admin') {
                return res.redirect('/admin/dashboard' + successParam);
            } else if (updatedUser.role === 'kasir') {
                return res.redirect('/kasir/dashboard' + successParam);
            } else {
                return res.redirect('/mechanic/dashboard' + successParam);
            }
            
        } catch (error) {
            console.error("Error saat update profil:", error);
            res.status(500).send("Terjadi kesalahan internal pada server.");
        }
    });
};

// --- Hapus User ---
const deleteUser = async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.redirect('/api/users');
    } catch (error) {
        res.status(500).send("Gagal menghapus user");
    }
};

// ==================================================================
// 3. EXPORTS
// ==================================================================
module.exports = {
    createUser,
    getAllUsers,
    getEditUserPage,
    updateUser,
    deleteUser,
    updateUserProfile
};