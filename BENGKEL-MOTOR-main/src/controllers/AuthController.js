// [LOKASI]: C:\sisfo-bengkel\bengkelan\src\controllers\AuthController.js

const User = require('../models/User');
const admin = require('../config/firebase'); // Firebase Admin SDK
const jwt = require('jsonwebtoken');

/**
 * @desc    Generate JWT Local Session (Helper)
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    });
};

/**
 * @desc    Render Halaman Login
 * @route   GET /login
 */
const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

/**
 * @desc    Render Halaman Register
 * @route   GET /register
 */
const registerView = (req, res) => {
    res.render('auth/register', { 
        title: 'Daftar Akun Baru',
        oldData: null, 
        errors: null 
    });
};

/**
 * @desc    Register User Baru (API)
 * @route   POST /api/auth/register
 */
// PERBAIKAN: Gunakan const agar bisa masuk ke module.exports di bawah
const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        // 1. Buat User di Firebase Auth
        const userRecord = await admin.auth().createUser({
            email,
            password,
            displayName: name,
        });

        // 2. Simpan ke MongoDB
        const newUser = await User.create({
            uid: userRecord.uid, // Pastikan field ini sesuai dengan User model (uid atau firebaseId)
            name,
            email,
            role,
            department, 
        });

        res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        console.error("REGISTER ERROR:", error.message);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Verifikasi ID Token Firebase & Buat Cookie Sesi Lokal
 * @route   POST /api/auth/verify-token
 */
const verifyToken = async (req, res) => {
    const { idToken } = req.body;

    res.clearCookie('token');

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken); 
        const firebaseUid = decodedToken.uid; 
        
        // Pastikan field di MongoDB adalah 'uid' (sesuai pencarian di bawah)
        const user = await User.findOne({ uid: firebaseUid }); 
        
        if (!user) {
            console.warn(`[AUTH] Login ditolak: UID ${firebaseUid} tidak ada di MongoDB.`);
            return res.status(404).json({ message: 'User tidak terdaftar di sistem bengkel.' });
        }

        const jwtPayload = { id: user._id, role: user.role };
        const sessionToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: process.env.JWT_EXPIRES_IN || '1d',
        });
        
        user.currentSessionToken = sessionToken;
        await user.save({ validateBeforeSave: false });
        
        console.log(`[AUTH] Sesi dibuat: ${user.email} (${user.role})`); 

        res.cookie('token', sessionToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 24 * 60 * 60 * 1000 
        });

        res.status(200).json({ 
            status: 'success', 
            user: { id: user._id, role: user.role, email: user.email } 
        });

    } catch (error) {
        console.error('Verifikasi Token Server Gagal:', error.message);
        res.status(401).json({ message: 'Token tidak valid atau server error.' });
    }
};

/**
 * @desc    Logout User
 */
const logout = async (req, res) => {
    try {
        if (req.user) {
            await User.findByIdAndUpdate(req.user._id, { currentSessionToken: null });
        }
        res.clearCookie('token'); 
        res.redirect('/login');
    } catch (error) {
        res.clearCookie('token');
        res.redirect('/login');
    }
};

/**
 * @desc    Ambil Semua User (Admin Only)
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-currentSessionToken');
        res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get Profil User Login
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-currentSessionToken'); 
        if (!user) return res.status(404).json({ message: 'User tidak ditemukan.' });
        
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

/**
 * @desc    Update Profil User Login
 */
const updateProfile = async (req, res) => {
    const { name, email } = req.body;
    try {
        const user = await User.findById(req.user._id);
        
        if (!user) { 
            return res.status(404).json({ message: 'User tidak ditemukan.' });
        }

        user.name = name || user.name;
        user.email = email || user.email;

        const updatedUser = await user.save();
        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Ekspor modul (Sekarang 'register' sudah terdefinisi sebagai variabel)
module.exports = {
    login,
    registerView,
    register,
    verifyToken,
    getAllUsers,
    getProfile,
    updateProfile,
    logout
};