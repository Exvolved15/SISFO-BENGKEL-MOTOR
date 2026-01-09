// sisfo-bengkel-baru/src/routes/authViewRoutes.js

const express = require('express');
const router = express.Router();
const { loginUser, registerUser }  = require('../controllers/AuthController'); // <-- Sumber masalah

// Panggil Model yang dibutuhkan
const User = require('../models/User'); // <-- Panggil User Model

// Route 1: GET /login - Menampilkan Form Login
router.get('/login', (req, res) => {
    // ...
    res.render('auth/login', {
        title: 'Login',
        activePage: 'login',
        query: req.query // <-- Memastikan query parameter (termasuk session_conflict) dikirim
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
    // ... (logic redirect jika sudah login) ...
    res.render('auth/register', {
        title: 'Register User',
        activePage: 'register',
        // Kirim variabel error (kosong saat pertama kali diakses)
        errors: null, 
        oldData: null
    });
});

// Route 5: POST /register - Memproses register
router.post('/register', async (req, res) => {
    
    try {
        // Logika Register Langsung di sini
        await User.create(req.body); // Mongoose akan menjalankan middleware hash password
        
        // JIKA BERHASIL: Redirect ke halaman Login
        // Kita bisa menggunakan session/flash message di sini, tapi untuk saat ini, langsung redirect.
        // TAMPILKAN PESAN SUKSES DENGAN ALERT DI VIEW:
        
        // Kita akan menggunakan query parameter sederhana untuk menandai sukses
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

// Route 5: POST /register - Memproses register
router.post('/register', registerUser, (req, res) => {
    // Jika register sukses, kita redirect ke halaman login
    res.redirect('/login');
});


module.exports = router;