// [LOKASI]: src/controllers/AuthController.js
const User = require('../models/User');
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

const registerView = (req, res) => {
    res.render('auth/register', { title: 'Daftar Akun Baru' });
};

// [LOKASI]: src/controllers/AuthController.js

const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;
        // WAJIB: Kecilkan semua huruf email agar sinkron
        const normalizedEmail = email.toLowerCase();

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Buat di Firebase Auth
        const userRecord = await admin.auth().createUser({
            email: normalizedEmail,
            password,
            displayName: name,
        });

        // Simpan ke MongoDB dengan UID yang sama dari Firebase
        const newUser = await User.create({
            uid: userRecord.uid, 
            name,
            email: normalizedEmail,
            password: hashedPassword,
            role: role || 'user',
            department: department || '-', 
        });

        return res.status(201).json({ success: true, message: "Data Sinkron!" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

// API LOGIN - Mendukung Role Admin, Mekanik, Kasir, Customer
const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email }).select('+password');
        
        if (!user || !user.password) {
            return res.status(401).json({ success: false, message: "Akun tidak ditemukan atau gunakan metode Firebase" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Email atau Password salah" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        
        // Simpan sesi ke DB (Realtime Sync)
        user.currentSessionToken = token;
        await user.save({ validateBeforeSave: false });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // development
            sameSite: 'lax',
            path: '/',
            maxAge: 86400000 
        });

        return res.status(200).json({ 
            success: true, 
            token: token,
            user: { id: user._id, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server Error" });
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

module.exports = { login, loginAPI, registerView, register, verifyToken, logout };