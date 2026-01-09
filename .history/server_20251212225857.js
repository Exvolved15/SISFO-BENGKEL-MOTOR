// sisfo-bengkel-baru/server.js

require('dotenv').config(); 

const express = require('express');
const connectDB = require('./src/config/db'); 
const partRoutes = require('./src/routes/partRoutes'); 
const viewRoutes = require('./src/routes/viewRoutes'); // <-- Panggil View Routes

connectDB(); 

const app = express();
const PORT = process.env.env || 3000;

app.set('view engine', 'ejs'); 
app.set('views', 'views');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/parts', partRoutes); 

// VIEW Routes (untuk halaman yang diakses browser)
app.use('/', viewRoutes); // <-- Daftarkan View Routes

app.get('/', (req, res) => {
    res.render('index', { title: 'Beranda Sisfo Bengkel' });
});

app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});