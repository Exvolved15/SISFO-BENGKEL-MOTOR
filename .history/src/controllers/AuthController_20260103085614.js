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
// [LOKASI]: C:\sisfo-bengkel\bengkelan\src\controllers\AuthController.js

const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 1. Cari user dan pastikan field password ikut terambil
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Email atau Password salah" });
        }

        // 2. Validasi argumen bcrypt (Cegah Error "Illegal arguments")
        if (!password || !user.password) {
            return res.status(401).json({ 
                success: false, 
                message: "Akun ini menggunakan login Google/Firebase. Silakan gunakan metode tersebut." 
            });
        }

        // 3. Bandingkan Password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Email atau Password salah" });
        }

        // 4. Generate Token & Cookie
        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
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
        console.error("LOGIN ERROR:", error); // Muncul di terminal untuk debug
        res.status(500).json({ success: false, message: "Terjadi kesalahan internal pada server" });
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