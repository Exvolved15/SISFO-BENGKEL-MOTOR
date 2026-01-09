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
 * @desc    Render Halaman Login (Navigasi)
 * @route   GET /login
 */
const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

/**
 * @desc    Render Halaman Register (Navigasi)
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
 * @desc    Handle Login Tradisional (API jika dibutuhkan)
 * @route   POST /api/auth/login
 */
const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Logika login manual (jika tidak pakai Firebase di frontend)
        // Jika hanya menggunakan Firebase verifyToken, fungsi ini bisa diabaikan
        res.status(200).json({ success: true, message: "Gunakan verify-token untuk login Firebase" });
    } catch (error) {
        res.status(401).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Register User Baru (API)
 * @route   POST /api/auth/register
 */
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
            uid: userRecord.uid, 
            name,
            email,
            role: role || 'customer',
            department: department || '-', 
        });

        // Berikan respon JSON murni
        return res.status(201).json({ 
            success: true, 
            message: "User berhasil didaftarkan",
            user: { id: newUser._id, name: newUser.name } 
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error.message);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Verifikasi ID Token Firebase & Buat Cookie Sesi Lokal (API Utama)
 * @route   POST /api/auth/verify-token
 */
const verifyToken = async (req, res) => {
    const { idToken } = req.body;
    res.clearCookie('token');

    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken); 
        const firebaseUid = decodedToken.uid; 
        const user = await User.findOne({ uid: firebaseUid }); 
        
        if (!user) {
            return res.status(404).json({ success: false, message: 'User tidak terdaftar.' });
        }

        const jwtPayload = { id: user._id, role: user.role };
        const sessionToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
            expiresIn: '1d',
        });
        
        user.currentSessionToken = sessionToken;
        await user.save({ validateBeforeSave: false });

        // Simpan cookie
        res.cookie('token', sessionToken, {
            httpOnly: true,
            secure: false, // Set false untuk localhost (HTTP) agar cookie terkirim
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 
        });

        // PENTING: Kirim JSON Sukses
        return res.status(200).json({ 
            success: true, 
            user: { id: user._id, role: user.role } 
        });

    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token tidak valid.' });
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
        // Redirect hanya untuk navigasi browser
        return res.redirect('/login');
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

/**
 * @desc    Ambil Semua User (Admin Only)
 */
const getAllUsers = async (req, res) => {
    try {
        const users = await User.find({}).select('-currentSessionToken');
        return res.status(200).json({ success: true, count: users.length, data: users });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get Profil User Login
 */
const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select('-currentSessionToken'); 
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        
        return res.status(200).json({ success: true, data: user });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
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
            return res.status(404).json({ success: false, message: 'User tidak ditemukan.' });
        }

        user.name = name || user.name;
        user.email = email || user.email;

        const updatedUser = await user.save();
        return res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    login,
    loginAPI, // Tambahkan ini
    registerView,
    register,
    verifyToken,
    getAllUsers,
    getProfile,
    updateProfile,
    logout
};