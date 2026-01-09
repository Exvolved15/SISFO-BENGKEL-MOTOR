// sisfo-bengkel-baru/src/controllers/AuthController.js

const User = require('../models/User');
const admin = require('../config/firebase'); // <-- Panggil Firebase Admin SDK

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

// --- Fungsi Login (Memverifikasi user di Firebase) ---
// Note: Login dari browser akan dilakukan SISI CLIENT, dan token akan dikirim ke server.
// Karena kita menggunakan View EJS, ini akan menjadi rumit. Untuk sementara, kita buat
// fungsi login ini sebagai simulasi verifikasi.
const loginUser = async (req, res) => {
    // Fungsi ini akan dirombak total di Langkah 29, kita tinggalkan sebagai placeholder.
    res.status(500).json({ message: "Login tidak didukung via API saat ini. Gunakan View Client." });
};

// @deskripsi: Mengambil semua user (Hanya untuk Admin)
// @rute: GET /api/auth/users
const getAllUsers = async (req, res) => {
    try {
        // Ambil semua user, kecuali password dan token sesi
        const users = await User.find({}).select('-password -currentSessionToken'); 
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

// @deskripsi: Mendapatkan data profil user yang sedang login
// @rute: GET /api/auth/profile
const getProfile = async (req, res) => {
    // req.user disisipkan oleh middleware protect
    const user = await User.findById(req.user._id).select('-password -currentSessionToken');
    res.status(200).json({ success: true, data: user });
};

// @deskripsi: Update data profil user yang sedang login
// @rute: PUT /api/auth/profile
const updateProfile = async (req, res) => {
    const { name, email, currentPassword, newPassword } = req.body;

    try {
        const user = await User.findById(req.user._id).select('+password'); // Perlu password lama untuk verifikasi
        
        if (!user) {
            return res.status(404).json({ message: 'User tidak ditemukan' });
        }

        // 1. Update Nama dan Email
        user.name = name || user.name;
        user.email = email || user.email;

        // 2. Update Password (jika ada newPassword)
        if (newPassword) {
            if (!currentPassword || !(await user.matchPassword(currentPassword))) {
                return res.status(401).json({ message: 'Password lama tidak valid.' });
            }
            if (newPassword.length < 6) {
                 return res.status(400).json({ message: 'Password baru minimal 6 karakter.' });
            }
            user.password = newPassword; // Middleware pre('save') akan menghash ini
        }
        
        // Simpan perubahan
        const updatedUser = await user.save();
        
        // Kirim kembali data user tanpa password
        res.status(200).json({ 
            success: true, 
            message: 'Profil berhasil diperbarui',
            data: {
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role
            }
        });

    } catch (error) {
         if (error.code === 11000) { // Error Duplikasi Email
            return res.status(400).json({ message: 'Email sudah digunakan oleh akun lain.' });
        }
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    loginUser,
    getAllUsers, 
    getProfile, // <-- Export baru
    updateProfile // <-- Export baru
};