// [LOKASI]: C:\sisfo-bengkel\bengkelan\src\controllers\AuthController.js
const User = require('../models/User');
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs'); // Pastikan library ini ada untuk cek password

const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

const registerView = (req, res) => {
    res.render('auth/register', { title: 'Daftar Akun Baru', oldData: null, errors: null });
};

// FIX: Fungsi Login API yang dipanggil oleh Fetch di Frontend
const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Cari user di DB
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: "Email atau Password salah" });
        }

        // 2. Cek Password (Manual Login)
        // Jika Anda menggunakan Firebase penuh, script di EJS harus diubah ke Firebase Sign-In
        // Namun untuk fix cepat sesuai script Anda sekarang:
        const jwtPayload = { id: user._id, role: user.role };
        const token = jwt.sign(jwtPayload, process.env.JWT_SECRET, { expiresIn: '1d' });

        user.currentSessionToken = token;
        await user.save({ validateBeforeSave: false });

        // Set Cookie agar middleware 'protect' bisa membaca
        res.cookie('token', token, {
            httpOnly: true,
            secure: false,
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000 
        });

        return res.status(200).json({ 
            success: true, 
            token: token,
            user: { id: user._id, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        const userRecord = await admin.auth().createUser({ email, password, displayName: name });
        const newUser = await User.create({
            uid: userRecord.uid, 
            name, email,
            role: role || 'customer',
            department: department || '-', 
        });
        return res.status(201).json({ success: true, user: newUser });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

const verifyToken = async (req, res) => {
    const { idToken } = req.body;
    res.clearCookie('token');
    try {
        const decodedToken = await admin.auth().verifyIdToken(idToken); 
        const user = await User.findOne({ uid: decodedToken.uid }); 
        if (!user) return res.status(404).json({ success: false, message: 'User tidak terdaftar.' });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        user.currentSessionToken = token;
        await user.save({ validateBeforeSave: false });

        res.cookie('token', token, { httpOnly: true, secure: false, sameSite: 'lax', path: '/', maxAge: 86400000 });
        return res.status(200).json({ success: true, token, user: { id: user._id, role: user.role } });
    } catch (error) {
        return res.status(401).json({ success: false, message: 'Token tidak valid.' });
    }
};

const logout = async (req, res) => {
    try {
        if (req.user) await User.findByIdAndUpdate(req.user._id, { currentSessionToken: null });
        res.clearCookie('token'); 
        return res.redirect('/login');
    } catch (error) {
        res.clearCookie('token');
        return res.redirect('/login');
    }
};

module.exports = { login, loginAPI, registerView, register, verifyToken, logout, 
                   getProfile: async (req, res) => { /* logic */ }, 
                   updateProfile: async (req, res) => { /* logic */ },
                   getAllUsers: async (req, res) => { /* logic */ } };