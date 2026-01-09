// sisfo-bengkel-baru/src/models/User.js

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // <-- HARUS ADA



// Middleware Mongoose: Enkripsi password sebelum disimpan (pada save/create)
UserSchema.pre('save', async function (next) { // <--- PASTIKAN (next) ADA
    if (!this.isModified('password')) {
        return next();
    }
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next(); // KASUS SUKSES: Lanjutkan proses Mongoose
    } catch (error) {
        // KASUS GAGAL: Beritahu Mongoose bahwa ada error dan batalkan penyimpanan
        return next(error); // <--- INI ADALAH BARIS KRITIS YANG PERLU DICEK!
    }
});
// Metode untuk membandingkan password
UserSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

