// sisfo-bengkel-baru/src/controllers/AuthController.js

const User = require('../models/User');
const admin = require('../config/firebase'); // Firebase Admin SDK
const jwt = require('jsonwebtoken'); // Kita akan tetap butuh JWT/Cookie untuk sesi lokal
// Fungsi untuk membuat JWT (JSON Web Token)
const generateToken = (id) => {
    // Ambil secret dari .env (akan kita buat di Langkah 21.4)
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '1h', // Token kadaluarsa dalam 1 jam
    });
};

// --- Fungsi Logic Register (Membuat user di Firebase dan menyimpan data di MongoDB) ---
const registerUserLogic = async ({ email, password, name, role }) => {
    
    // 1. Buat user di Firebase Authentication
    const firebaseUser = await admin.auth().createUser({
        email: email,
        password: password,
        displayName: name,
    });
    
    // 2. Simpan user (UID dan data) di MongoDB
    const newUser = await User.create({
        uid: firebaseUser.uid, // Simpan UID unik dari Firebase
        email,
        name,
        role,
    });

    return newUser;
};

// @deskripsi: Verifikasi ID Token dari klien dan buat sesi lokal (Cookie)
// @rute: POST /api/auth/verify-token
const verifyToken = async (req, res) => {
    const idToken = req.body.idToken;

    if (!idToken) {
        return res.status(401).json({ message: 'Token tidak disediakan.' });
    }

    try {
        // 1. Verifikasi token menggunakan Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        const firebaseUid = decodedToken.uid;

        // 2. Cari User di MongoDB berdasarkan UID
        // Kita harus memastikan user terdaftar di DB lokal kita
        let user = await User.findOne({ uid: firebaseUid });

        if (!user) {
            // Jika user ada di Firebase tapi belum ada di MongoDB (misalnya, baru di-import)
            // Lakukan sinkronisasi atau tolak akses
            return res.status(404).json({ message: 'Akun tidak terdaftar di sistem lokal.' });
        }

        // 3. Buat Token Sesi Lokal (Cookie)
        // Kita gunakan JWT untuk sesi lokal yang cepat
        const localToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
            expiresIn: '1h', // Sesuaikan durasi sesi
        });
        
        // Atur cookie sesi di browser
        res.cookie('token', localToken, {
            httpOnly: true,
            maxAge: 3600000, // 1 jam
        });

        res.status(200).json({ success: true, message: 'Verifikasi sukses, sesi dibuat.' });

    } catch (error) {
        console.error("Firebase Token Verification Failed:", error.message);
        res.status(401).json({ message: 'Token tidak valid atau kedaluwarsa.' });
    }
};

// Fungsi loginUser lama dihapus/diganti di sini
const loginUser = (req, res) => {
    // Fungsi ini hanya placeholder agar ViewRoutes tidak crash.
    // Logic utama sudah di verifyToken.
    res.status(500).json({ message: 'Gunakan endpoint /api/auth/verify-token.' });
}

const getAllUsers = async (req, res) => {
    try {
        // Ambil semua user (Model User sekarang tidak punya field password, jadi aman)
        const users = await User.find({}).select('-uid'); // Kecualikan UID jika perlu
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};


// @deskripsi: Mendapatkan data profil user yang sedang login
// @rute: GET /api/auth/profile
const getProfile = async (req, res) => {
    // req.user disisipkan oleh middleware protect
    const user = await User.findById(req.user._id).select('-uid'); 
    
    if (!user) {
         return res.status(404).json({ message: 'User tidak ditemukan di database lokal.' });
    }
    
    res.status(200).json({ success: true, data: user });
};

// @deskripsi: Update data profil user yang sedang login
// @rute: PUT /api/auth/profile
const updateProfile = async (req, res) => {
    const { name, email, password } = req.body;
    
    try {
        const user = req.user; 
        
        if (!user) {
             return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        // Update MongoDB
        user.name = name || user.name;
        user.email = email || user.email; // Perlu validasi duplikasi di Mongoose

        const updatedUser = await user.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Profil berhasil diperbarui',
            data: updatedUser
        });

    } catch (error) {
         // Tangani error duplikasi email
         res.status(500).json({ message: error.message });
    }
};


module.exports = {
    // Pastikan semua fungsi ini ada di file:
    registerUserLogic,
    verifyToken,
    loginUser,   
    getAllUsers, 
    getProfile, // <--- TAMBAHKAN EKSPORT INI
    updateProfile // <--- TAMBAHKAN EKSPORT INI
};