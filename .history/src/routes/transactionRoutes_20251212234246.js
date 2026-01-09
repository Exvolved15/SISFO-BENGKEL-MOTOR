// sisfo-bengkel-baru/src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const { 
    createTransactionApi, // <-- Pastikan ini yang digunakan
    getAllTransactions 
} = require('../controllers/TransactionController'); 

// API routes untuk Transaksi
router.route('/')
    .get(getAllTransactions)
    .post(createTransactionApi); // <-- Ubah POST ke API

module.exports = router;