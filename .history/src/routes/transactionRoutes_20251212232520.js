// sisfo-bengkel-baru/src/routes/transactionRoutes.js

const express = require('express');
const router = express.Router();
const { 
    createTransaction, 
    getAllTransactions 
} = require('../controllers/TransactionController'); 

// API routes untuk Transaksi
router.route('/')
    .get(getAllTransactions)
    .post(createTransaction);

module.exports = router;