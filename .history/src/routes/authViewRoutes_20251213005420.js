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
        const result = await registerUser(req, res); // Panggil Controller
        
        // Asumsi: Jika registerUser berhasil, ia mengirim res.status(201)
        // Kita perlu mengubah registerUser agar hanya return data/throw error jika dipanggil dari view.
        
        // Karena ini kompleks, kita akan simpan logic Register di sini:
        await User.create(req.body);
        return res.redirect('/login');

    } catch (error) {
        // Tangkap error jika terjadi (misal, password kurang dari 6 karakter)
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
            oldData: req.body // Kirim kembali data yang diinput user
        });
    }
});

// Route 5: POST /register - Memproses register
router.post('/register', registerUser, (req, res) => {
    // Jika register sukses, kita redirect ke halaman login
    res.redirect('/login');
});


module.exports = router;