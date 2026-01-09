// sisfo-bengkel-baru/src/routes/authViewRoutes.js

const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/AuthController');
const { registerUserLogic } = require('../controllers/AuthController');
const authController = require('../controllers/AuthController');
// Panggil Model yang dibutuhkan
const User = require('../models/User'); // <-- Panggil User Model

// Route 1: GET /login - Menampilkan Form Login
router.get('/login', (req, res) => {
    // Jika user sudah login (opsional), bisa redirect ke dashboard
    if (req.cookies.token) {
        return res.redirect('/');
    }
    res.render('auth/login', {
        title: 'Login',
        activePage: 'login',
        query: req.query, // <-- PASTIKAN ADA KOMA DI SINI
        layout: false 
    });
});

// Route 2: POST /login - Memproses data login
router.post('/login', loginUser, (req, res) => {
    // Controller loginUser akan mengatur cookie jika sukses.
    // Jika loginUser sukses, kita redirect ke dashboard
    res.redirect('/');
});

// Route 3: GET /logout - Menghapus token
router.get('/logout', (req, res) => {
    res.clearCookie('token'); // Hapus cookie token
    res.redirect('/login');
});

// Route 4: GET /register - Menampilkan Form Register
router.get('/register', (req, res) => {
    // ...
    res.render('auth/register', {
        title: 'Register User',
        activePage: 'register',
        errors: null, 
        oldData: null,
        layout: false // <-- PASTIKAN PROPERTI SEBELUMNYA ADA KOMA JIKA ADA
    });
});
// ... (Route 5: POST /register) ...

router.post('/register', async (req, res) => {
    
    try {
        console.log("Mencoba menyimpan user via Firebase:", req.body.email);
        
        // Panggil logic baru
        await registerUserLogic(req.body); 
        
        console.log("SUCCESS: User berhasil disimpan di database.");
        
        return res.redirect('/login?success=true'); 

    } catch (error) {
        console.error("KRITIS: GAGAL MENYIMPAN USER KE DATABASE! (Firebase/MongoDB)", error);
        
        // Deklarasi dan Inisialisasi Objek errors
        let errors = {};
        let errorMessage = 'Terjadi error tak terduga saat registrasi.';

        // 2. Cek error dari Firebase
        if (error.code && error.code.startsWith('auth/')) {
            // Contoh: auth/email-already-in-use
            errors.general = 'Registrasi gagal: ' + (error.message || 'Error Firebase Auth.');
        } 
        // 3. Cek error dari MongoDB (misal, duplikasi email)
        else if (error.code === 11000) { 
            errors.general = "Email sudah terdaftar. Silakan gunakan email lain.";
        } 
        // 4. Error lainnya
        else {
             errors.general = 'Registrasi gagal! Mohon periksa kembali input Anda.';
        }
        
        // Render ulang form dengan error
        res.render('auth/register', {
            title: 'Register User',
            activePage: 'register',
            errors: errors, // <-- Pastikan variabel 'errors' dideklarasikan di dalam catch
            oldData: req.body,
            layout: false 
        });
    }
});




module.exports = router;