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
    const { idToken } = req.body;

    // 0. KRITIS: HAPUS SEMUA COOKIE SESI LAMA SEBELUM PROSES BARU DIMULAI
    // Ini memastikan kita memulai sesi yang bersih.
    res.clearCookie('token');

    try {
        // 1. Verifikasi ID Token Firebase (Sudah Ada)
        // const decodedToken = await admin.auth().verifyIdToken(idToken); 
        // const firebaseUid = decodedToken.uid;
        
        // --- ASUMSIKAN VERIFIKASI FIREBASE BERHASIL ---
        // (Ganti dengan logika verifikasi Firebase Anda)
        const firebaseUid = 'qHA1qantZpcB35LzOMuks0AG5b83'; // Contoh UID Admin
        // ---------------------------------------------
        
        // 2. Cari User di MongoDB
        const user = await User.findOne({ uid: firebaseUid });

        if (!user) {
            return res.status(404).json({ message: 'User tidak terdaftar di sistem bengkel.' });
        }

        // 3. BUAT JWT Sesi Baru
        const jwtPayload = { id: user._id, role: user.role };
        const sessionToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });
        
       // 4. SIMPAN TOKEN BARU KE DATABASE (KRITIS!)
        user.currentSessionToken = sessionToken;
        await user.save({ validateBeforeSave: false }); // <-- KEMUNGKINAN BESAR INI GAGAL

        user.currentSessionToken = sessionToken;

        const savedUser = await user.save({ validateBeforeSave: false }); 

        // --- LOGGING ---
        console.log(`[AUTH CONTROLLER] Token sesi baru berhasil disimpan untuk user: ${savedUser.email}`);
        // ----------------

        // 5. Kirim JWT sebagai HTTP-Only Cookie
        res.cookie('token', sessionToken, { // <--- Pastikan nama 'token' SAMA
            httpOnly: true,
            // Pastikan parameter lain konsisten
            secure: process.env.NODE_ENV === 'production',
            maxAge: (process.env.JWT_EXPIRES_IN || 24 * 60 * 60) * 1000, 
        });

        res.status(200).json({ 
            status: 'success', 
            user: { id: user._id, role: user.role } 
        });

    } catch (error) {
        console.error('Verifikasi Token Server Gagal:', error);
        res.status(401).json({ message: 'Token tidak valid atau server error.' });
    }
};

// Fungsi loginUser lama dihapus/diganti di sini
const loginUser = (req, res) => {
    // Fungsi ini hanya placeholder agar ViewRoutes tidak crash.
    // Logic utama sudah di verifyToken.
    res.status(500).json({ message: 'Gunakan endpoint /api/auth/verify-token.' });
}

const logout = (req, res) => {
    // 1. Hapus Cookie Sesi (WAJIB)
    res.clearCookie('token'); 
    
    // 2. Clear Session (Jika Anda menggunakan express-session, opsional)
    // req.session.destroy(); 

    // 3. Redirect ke halaman Login
    res.redirect('/login');
};

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
    // Ambil user dari MongoDB (tanpa field sensitif)
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
        const user = req.user; // User saat ini dari middleware (DB lokal)
        
        if (!user) {
             return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        // 1. Update di Firebase (hanya password/email yang memerlukan ini)
        if (password) {
            // Kita perlu API / SDK untuk update password di Firebase, yang rumit dari Admin SDK.
            // UNTUK SEMENTARA: Kita biarkan ini dilakukan di sisi client (browser) jika ada fitur edit password.
            // Jika Anda hanya mengizinkan nama/role di server:
        }

        // 2. Update MongoDB
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
    registerUserLogic,
    verifyToken,
    loginUser,   
    getAllUsers, 
    getProfile, // <--- TAMBAHKAN EKSPORT INI
    updateProfile // <--- TAMBAHKAN EKSPORT INI
};