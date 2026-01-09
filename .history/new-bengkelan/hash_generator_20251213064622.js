const bcrypt = require('bcryptjs');
const passwordToHash = 'admin123'; // Ganti dengan password yang Anda inginkan
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