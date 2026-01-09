// sisfo-bengkel-baru/src/routes/authViewRoutes.js

const express = require('express');
const router = express.Router();
const { loginUser, registerUser } = require('../controllers/AuthController');

// Route 1: GET /login - Menampilkan Form Login
router.get('/login', (req, res) => {
    // Jika user sudah login (opsional), bisa redirect ke dashboard
    if (req.cookies.token) {
        return res.redirect('/');
    }
    res.render('auth/login', {
        title: 'Login',
        activePage: 'login'
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

// Route 4: GET /register - Menampilkan Form Register (hanya untuk setup awal)
router.get('/register', (req, res) => {
    res.render('auth/register', {
        title: 'Register User',
        activePage: 'register'
    });
});

// Route 5: POST /register - Memproses register
router.post('/register', registerUser, (req, res) => {
    // Jika register sukses, kita redirect ke halaman login
    res.redirect('/login');
});


module.exports = router;