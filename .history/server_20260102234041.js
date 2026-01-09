// [LOKASI]: server.js
require('dotenv').config(); 
const mongoose = require('mongoose');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const methodOverride = require('method-override');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const jwt = require('jsonwebtoken');
const connectDB = require('./src/config/db'); 

// 1. IMPORT UTILITY & MODELS
const { syncToFirebase } = require('./src/utils/firebaseSync');
connectDB(); 
const User = require('./src/models/User');

// ==================================================================
// 2. PASANG MONGOOSE PLUGIN (SINKRONISASI FIREBASE)
// ==================================================================
mongoose.plugin((schema) => {
    schema.post('save', function(doc) {
        const collection = this.constructor.modelName.toLowerCase();
        syncToFirebase(collection, doc);
    });

    schema.post('findOneAndUpdate', function(doc) {
        if (doc) {
            const collection = doc.constructor.modelName.toLowerCase();
            syncToFirebase(collection, doc);
        }
    });

    schema.post('findOneAndDelete', async function(doc) {
        if (doc) {
            const collection = doc.constructor.modelName.toLowerCase();
            try {
                const admin = require('firebase-admin');
                await admin.database().ref(`backups/${collection}/${doc._id}`).remove();
            } catch (err) {
                console.error("[SYNC DELETE ERROR]", err.message);
            }
        }
    });
});

const app = express();
const PORT = process.env.PORT || 5000;

// ===================================
// 3. MIDDLEWARE KEAMANAN (HELMET CSP)
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
                    "https://cdnjs.cloudflare.com",
                    "https://www.gstatic.com", 
                    "https://www.firebasejs.com",
                    "https://unpkg.com"
                ],
                "connect-src": [
                    "'self'", 
                    "http://localhost:5000",
                    "https://*.googleapis.com",
                    "https://firebase.googleapis.com",
                    "https://*.firebasedatabase.app"
                ],
                "img-src": [
                    "'self'", 
                    "data:", 
                    "https://placehold.co", 
                    "https://ui-avatars.com", 
                    "https://images.unsplash.com",
                    "https://source.unsplash.com",
                    "https://*.googleusercontent.com",
                    "https://lh3.googleusercontent.com"
                ],
                "style-src": ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
                "font-src": ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            },
        },
        crossOriginEmbedderPolicy: false,
    })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(methodOverride('_method'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(expressLayouts); 
app.set('layout', './layouts/main'); 
app.set('view engine', 'ejs'); 

// ===================================
// 4. MIDDLEWARE SESSION & AUDIT
// ===================================
app.use(async (req, res, next) => {
    res.locals.user = null;
    res.locals.activePage = ''; 
    try {
        const token = req.cookies.token || req.cookies.jwt;
        if (token) {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const currentUser = await User.findById(decoded.id);
            if (currentUser) {
                req.user = currentUser;
                res.locals.user = currentUser;
            }
        }
    } catch (err) { res.locals.user = null; }
    next();
});

// ===================================
// 5. PENDAFTARAN ROUTES
// ===================================
const { protect } = require('./src/middleware/authMiddleware');
const authRoutes = require('./src/routes/authRoutes'); 
const authViewRoutes = require('./src/routes/authViewRoutes');
const partRoutes = require('./src/routes/partRoutes'); 
const transactionRoutes = require('./src/routes/transactionRoutes'); 
const serviceRoutes = require('./src/routes/serviceRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes');
const mekanikViewRoutes = require('./src/routes/mekanikViewRoutes');

app.use('/', authViewRoutes); 
app.use('/api/auth', authRoutes);
app.use('/api/parts', protect, partRoutes); 
app.use('/api/services', protect, serviceRoutes); 
app.use('/api/transactions', protect, transactionRoutes);
app.use('/', protect, viewRoutes);
app.use('/', protect, mekanikViewRoutes);

app.use((req, res) => {
    res.status(404).render('404', { title: 'Not Found', activePage: 'error', user: res.locals.user });
});

app.listen(PORT, () => console.log(`Server: http://localhost:${PORT}`));