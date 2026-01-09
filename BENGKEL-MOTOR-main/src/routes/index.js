// src/routes/index.js

// ... (Import protect)
const { protect } = require('../middleware/authMiddleware');

const redirectDashboard = (req, res) => {
    // Pastikan req.user tersedia dari middleware protect
    const role = req.user.role; 

    if (role === 'admin') {
        return res.render('dashboard/adminDashboard', { title: 'Dashboard Admin' });
    } else if (role === 'kasir') {
        return res.render('dashboard/kasirDashboard', { title: 'Dashboard Kasir' });
    } else if (role === 'mekanik') {
        // Rute untuk Mekanik
        return res.redirect('/mekanik/jobs'); 
    } else {
        return res.status(403).redirect('/login');
    }
};

router.get('/', protect, redirectDashboard); 
// ...