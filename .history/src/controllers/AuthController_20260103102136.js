// [LOKASI]: src/controllers/AuthController.js
const User = require('../models/User');
const admin = require('../config/firebase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const login = (req, res) => {
    res.render('auth/login', { title: 'Login', query: req.query }); 
};

// API REGISTER (SINKRONISASI MONGODB & FIREBASE)
const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        // 1. Hash password untuk keamanan login manual MongoDB
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 2. Daftarkan di Firebase Auth (Opsional/Sinkronisasi)
        let firebaseUid = null;
        try {
            const userRecord = await admin.auth().createUser({
                email,
                password,
                displayName: name,
            });
            firebaseUid = userRecord.uid;
        } catch (fError) {
            console.warn("Firebase Register Skip/Error: " + fError.message);
        }

        // 3. Simpan ke MongoDB (Sertakan hashedPassword)
        const newUser = await User.create({
            uid: firebaseUid, 
            name,
            email,
            password: hashedPassword, // PENTING: Jangan biarkan kosong
            role: role || 'user',
            department: department || '-', 
        });

        return res.status(201).json({ 
            success: true, 
            message: "Registrasi Berhasil" 
        });
    } catch (error) {
        console.error("REGISTER ERROR:", error);
        return res.status(500).json({ 
            success: false, 
            message: error.code === 11000 ? "Email sudah terdaftar" : error.message 
        });
    }
};

// API LOGIN (Manual/Traditional)
const loginAPI = async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // Ambil user dan sertakan field password yang biasanya di-hide
        const user = await User.findOne({ email }).select('+password');
        
        if (!user) {
            return res.status(401).json({ success: false, message: "Email atau Password salah" });
        }

        // Cek apakah user punya password manual (bukan login murni Firebase)
        if (!user.password) {
            return res.status(401).json({ 
                success: false, 
                message: "Akun ini terdaftar via Firebase. Silakan login menggunakan metode tersebut." 
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Email atau Password salah" });
        }

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
        user.currentSessionToken = token;
        await user.save({ validateBeforeSave: false });

        res.cookie('token', token, {
            httpOnly: true,
            secure: false, // Set true jika di production (HTTPS)
            sameSite: 'lax',
            maxAge: 86400000 
        });

        return res.status(200).json({ 
            success: true, 
            token: token,
            user: { id: user._id, role: user.role } 
        });
    } catch (error) {
        res.status(500).json({ success: false, message: "Terjadi kesalahan server" });
    }
};

// API REGISTER
const register = async (req, res) => {
    try {
        const { name, email, password, role, department } = req.body;

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let firebaseUid = null;
        try {
            const userRecord = await admin.auth().createUser({ email, password, displayName: name });
            firebaseUid = userRecord.uid;
        } catch (fError) { console.warn("Firebase skip: " + fError.message); }

        const newUser = await User.create({
            uid: firebaseUid, 
            name, email,
            password: hashedPassword,
            role: role || 'user',
            department: department || '-', 
        });

        return res.status(201).json({ success: true, message: "Registrasi Berhasil" });
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

module.exports = { login, loginAPI, registerView, register, verifyToken, logout };