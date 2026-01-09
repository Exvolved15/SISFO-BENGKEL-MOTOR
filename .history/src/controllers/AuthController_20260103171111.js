// [LOKASI]: src/controllers/AuthController.js
const User = require('../models/User');
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

// RENDER HALAMAN LOGIN & REGISTER
const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

const registerView = (req, res) => {
    res.render('auth/register', { title: 'Daftar Akun Baru' });
};

// API LOGIN: Validasi Kredensial
// src/controllers/AuthController.js
const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Paksa email menjadi lowercase agar sinkron dengan database
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: "Kredensial Tidak Valid" });
        }

        // Bandingkan password input dengan hash di MongoDB
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ success: false, message: "Email atau Password Salah" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });

        return res.status(200).json({ success: true, user: { role: user.role } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

// API REGISTER: Sinkronisasi MongoDB & Firebase
const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        const lowerEmail = email.toLowerCase(); 

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 1. Firebase Auth
        const fbUser = await admin.auth().createUser({
            email: lowerEmail,
            password: password,
            displayName: name
        });

        // 2. MongoDB Lokal
        const newUser = await User.create({
            uid: fbUser.uid,
            name,
            email: lowerEmail,
            password: hashedPassword, 
            role: role || 'user',
            department: department || '-'
        });

        return res.status(201).json({ success: true, message: "Registrasi Berhasil" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// API VERIFY TOKEN
const verifyToken = async (req, res) => {
    try {
        const { idToken } = req.body;
        const decodedToken = await admin.auth().verifyIdToken(idToken); 
        const user = await User.findOne({ uid: decodedToken.uid }); 
        if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
        return res.status(200).json({ success: true, user: { role: user.role } });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token tidak valid' });
    }
};

const logout = (req, res) => {
    res.clearCookie('token'); 
    return res.redirect('/login');
};

module.exports = { login, loginAPI, registerView, register, verifyToken, logout };