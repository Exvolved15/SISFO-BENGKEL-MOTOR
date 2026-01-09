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

exports.login = (req, res) => {
    // Pastikan req.query digunakan jika Anda ingin menampilkan pesan sukses register
    res.render('login', { title: 'Login', query: req.query }); 
};

// @deskripsi: Verifikasi ID Token dari klien dan buat sesi lokal (Cookie)
// @rute: POST /api/auth/verify-token
const verifyToken = async (req, res) => {
    const { idToken } = req.body;

    // 0. KRITIS: HAPUS SEMUA COOKIE SESI LAMA SEBELUM PROSES BARU DIMULAI
    // Ini memastikan kita memulai sesi yang bersih.
    res.clearCookie('token', { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        path: '/', // Gunakan path root
        // tambahkan domain jika Anda menggunakannya: domain: 'localhost' atau domain Anda
        expires: new Date(0) // Pastikan expired
    });

    try {
        // 1. Verifikasi ID Token Firebase (Sudah Ada)
        // const decodedToken = await admin.auth().verifyIdToken(idToken); 
        // const firebaseUid = decodedToken.uid;
        
        // --- ASUMSIKAN VERIFIKASI FIREBASE BERHASIL ---
        // (Ganti dengan logika verifikasi Firebase Anda)
        const firebaseUid = 'qHA1qantZpcB35LzOMuks0AG5b83'; // Contoh UID Admin
        // ---------------------------------------------
        
        // 2. Cari User di MongoDB
        const user = await User.findOne({ uid: firebaseUid }); // <--- PENCARIAN USER DI SINI
        console.log(`[DEBUG] User ditemukan di DB: ${user ? user.email : 'TIDAK DITEMUKAN'}`);

        if (!user) {
            return res.status(404).json({ message: 'User tidak terdaftar di sistem bengkel.' });
        }

        // 3. BUAT JWT Sesi Baru (sessionToken)
        const jwtPayload = { id: user._id, role: user.role };
        const sessionToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });
        
       // 4. SIMPAN TOKEN BARU KE DATABASE (Ini sudah berfungsi)
       user.currentSessionToken = sessionToken;
       await user.save({ validateBeforeSave: false });

       user.currentSessionToken = sessionToken;
       await user.save({ validateBeforeSave: false });
       
       console.log(`[AUTH CONTROLLER] Token sesi baru berhasil disimpan untuk user: ${user.email}`); // <-- Pastikan ini mencetak user.email
        // 5. KIRIM JWT BARU SEBAGAI HTTP-ONLY COOKIE
        // Ini akan membuat cookie baru yang seharusnya menimpa yang lama (walaupun kita sudah hapus di atas)
        res.cookie('token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/', // HARUS SAMA DENGAN PATH DI CLEARCOOKIE
            maxAge: (process.env.JWT_EXPIRES_IN || 24 * 60 * 60) * 1000,
            // ... (opsi lainnya)
        });

        res.status(200).json({ 
            status: 'success', 
            user: { id: user._id, role: user.role, email: user.email } 
        });

    } catch (error) {
        console.error('Verifikasi Token Server Gagal:', error);
        // Cookie sudah dihapus di atas, kita cukup kirim status error
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