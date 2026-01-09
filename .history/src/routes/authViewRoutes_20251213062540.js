// sisfo-bengkel-baru/src/routes/authViewRoutes.js

const express = require('express');
const router = express.Router();
const { loginUser } = require('../controllers/AuthController');

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
        layout: false // <-- TAMBAHKAN INI: Nonaktifkan layout utama
    });
});
// Route 5: POST /register - Memproses register
router.post('/register', async (req, res) => { // <-- Pastikan ini adalah fungsi callback
    
    try {
        // Logika Register Langsung di sini
        await User.create(req.body); 
        // ...
        return res.redirect('/login?success=true'); 

    } catch (error) {
        // Tangkap error jika terjadi (Validasi Mongoose)
        let errors = null;
        if (error.name === 'ValidationError') {
            errors = error.errors;
        } else if (error.code === 11000) { // Duplikasi unik (email)
            errors = { email: { message: 'Email sudah terdaftar.' } };
        }
        
        // Render ulang form dengan error dan data lama
        res.render('auth/register', {
            title: 'Register User',
            activePage: 'register',
            errors: errors,
            oldData: req.body 
        });
    }
});




module.exports = router;