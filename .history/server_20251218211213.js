require('dotenv').config(); 
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const connectDB = require('./src/config/db'); 

// Import Middleware Otorisasi
const { protect, restrictTo } = require('./src/middleware/authMiddleware');

// Import Routes API
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const userRoutes = require('./src/routes/userRoutes');
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const jobRoutes = require('./src/routes/jobRoutes'); 
const authRoutes = require('./src/routes/authRoutes');

// Import Routes View (Tampilan)
const viewRoutes = require('./src/routes/viewRoutes');
const authViewRoutes = require('./src/routes/authViewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

// Hubungkan ke Database
connectDB(); 

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// MIDDLEWARE KEAMANAN & PARSER
// ===================================
app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          "default-src": ["'self'"],
          "script-src": [
            "'self'", 
            "'unsafe-inline'", 
            "https://cdn.jsdelivr.net", 
            "https://www.gstatic.com", 
            "https://www.firebasejs.com"
          ],
          "script-src-attr": ["'unsafe-inline'"],
          "connect-src": [
            "'self'", 
            "http://localhost:5000", 
            "https://cdn.jsdelivr.net", 
            "https://identitytoolkit.googleapis.com",
            "https://securetoken.googleapis.com",
            "https://*.googleapis.com"
          ],
          "img-src": ["'self'", "data:", "https://www.gstatic.com"],
          "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://fonts.googleapis.com"],
          "font-src": ["'self'", "https://fonts.gstatic.com"],
        },
      },
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


// ===================================
// KONFIGURASI VIEW ENGINE (EJS)
// ===================================
app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 
app.set('views', path.join(__dirname, 'views'));

// Middleware Global untuk EJS (Mengirim data user ke semua view)
// Middleware Global agar user tersedia di semua file EJS
app.use((req, res, next) => {
  res.locals.user = req.user || undefined; 
  res.locals.activePage = ''; 
  next();
});

// ===================================
// PENDAFTARAN ROUTES
// ===================================

// 1. API Routes
app.use('/api/auth', authRoutes);
app.use('/api/parts', partRoutes); // Gunakan prefix /api/parts
app.use('/api/services', serviceRoutes); 
app.use('/api/transactions', transactionRoutes); 
app.use('/api/users', userRoutes);
app.use('/api/jobs', jobRoutes);

// 2. View Routes (Halaman Web)
app.use('/mekanik', protect, restrictTo('mekanik', 'admin'), mekanikViewRoutes);
app.use('/', authViewRoutes);
app.use('/', viewRoutes); // Rute Dashboard Kasir/Admin berada di sini

// 3. Rute Tampilan Terproteksi (Dashboard Kasir/Admin)
app.use('/', viewRoutes);

app.use('/parts', partRoutes);

// 4. Rute Tampilan Mekanik
app.use('/mekanik', protect, restrictTo('mekanik', 'admin'), mekanikViewRoutes);

// 5. Logika Redirect Halaman Utama berdasarkan Role
app.get('/', protect, (req, res) => {
    const role = req.user.role; 
    if (role === 'admin') {
        res.redirect('/admin/dashboard');
    } else if (role === 'kasir') {
        res.redirect('/kasir/dashboard');
    } else if (role === 'mekanik') {
        res.redirect('/mekanik/jobs');
    } else {
        res.render('index', { 
            title: 'Beranda',
            activePage: 'home'
        });
    }
});

// 3. 404 Handler (Harus paling bawah)
app.use((req, res) => {
  res.status(404).render('404', { title: '404', activePage: 'error' });
});

// Jalankan Server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});

const seedData = async () => {
  try {
      const Service = require('./src/models/Service');
      
      // Hapus data lama (Opsional, hati-hati!)
      // await Service.deleteMany({});

      const dummyData = [
          // 10 Suku Cadang
          { name: "Oli Shell Helix 1L", code: "PART-001", price: 120000, stock: 50, isPart: true },
          { name: "Filter Oli Honda", code: "PART-002", price: 45000, stock: 20, isPart: true },
          { name: "Kampas Rem Depan", code: "PART-003", price: 250000, stock: 15, isPart: true },
          { name: "Aki GS Astra", code: "PART-004", price: 850000, stock: 10, isPart: true },
          { name: "Busi NGK Iridium", code: "PART-005", price: 95000, stock: 40, isPart: true },
          { name: "Filter Udara Denso", code: "PART-006", price: 110000, stock: 25, isPart: true },
          { name: "V-Belt CVT", code: "PART-007", price: 185000, stock: 12, isPart: true },
          { name: "Lampu LED Philips", code: "PART-008", price: 320000, stock: 8, isPart: true },
          { name: "Sokbreker KYB", code: "PART-009", price: 450000, stock: 6, isPart: true },
          { name: "Ban Dunlop 90/90-14", code: "PART-010", price: 280000, stock: 10, isPart: true },

          // 10 Jasa
          { name: "Servis Rutin / Tune Up", code: "SRV-001", price: 150000, stock: 0, isPart: false },
          { name: "Ganti Oli (Jasa)", code: "SRV-002", price: 25000, stock: 0, isPart: false },
          { name: "Servis Rem", code: "SRV-003", price: 65000, stock: 0, isPart: false },
          { name: "Servis CVT", code: "SRV-004", price: 120000, stock: 0, isPart: false },
          { name: "Ganti Ban", code: "SRV-005", price: 35000, stock: 0, isPart: false },
          { name: "Overhaul Mesin", code: "SRV-006", price: 1500000, stock: 0, isPart: false },
          { name: "Servis Injeksi", code: "SRV-007", price: 85000, stock: 0, isPart: false },
          { name: "Cek Kelistrikan", code: "SRV-008", price: 45000, stock: 0, isPart: false },
          { name: "Kuras Radiator", code: "SRV-009", price: 55000, stock: 0, isPart: false },
          { name: "Cuci Motor", code: "SRV-010", price: 30000, stock: 0, isPart: false }
      ];

      await Service.insertMany(dummyData);
      console.log("Berhasil memasukkan 20 data master!");
  } catch (err) {
      console.error("Gagal seeding data:", err);
  }
};