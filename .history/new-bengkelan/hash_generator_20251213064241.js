// sisfo-bengkel-baru/hash_generator.js

const bcrypt = require('bcryptjs');

// Ganti dengan password yang ingin Anda gunakan untuk login (misalnya 'password123')
const passwordToHash = 'admin123'; 

const saltRounds = 10;

bcrypt.hash(passwordToHash, saltRounds, function(err, hash) {
    if (err) {
        console.error("Error saat hashing:", err);
        return;
    }
    console.log("-------------------------------------------");
    console.log(`Password asli: ${passwordToHash}`);
    console.log("SALIN HASH BERIKUT INI:");
    console.log(hash); 
    console.log("-------------------------------------------");
});