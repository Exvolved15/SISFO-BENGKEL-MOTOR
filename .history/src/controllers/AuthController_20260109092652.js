const User = require('../models/User');
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');

// RENDER VIEWS
const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

const registerView = (req, res) => {
    res.render('auth/register', { title: 'Daftar Akun Baru' });
};

// API REGISTER: Sinkron Tanpa Bcrypt
const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        const lowerEmail = email.toLowerCase(); 

        // 1. Buat User di Firebase Auth
        const fbUser = await admin.auth().createUser({
            email: lowerEmail,
            password: password,
            displayName: name
        });

        // 2. Simpan ke MongoDB (Tanpa Hash Password)
        const newUser = await User.create({
            uid: fbUser.uid, // UID harus sama agar sinkron
            name,
            email: lowerEmail,
            password: password, // Simpan plain text sesuai permintaan
            role: role || 'user',
            department: department || '-'
        });

        return res.status(201).json({ success: true, message: "Pendaftaran Sinkron Berhasil" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// API LOGIN: Validasi Plain Text
const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

        // Validasi Langsung Tanpa Bcrypt
        if (!user || user.password !== password) {
            return res.status(401).json({ success: false, message: "Email atau Password Salah" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });

        return res.status(200).json({ success: true, user: { role: user.role } });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Server Error" });
    }
};

const verifyToken = async (req, res) => {
    const { idToken } = req.body;
    try {
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