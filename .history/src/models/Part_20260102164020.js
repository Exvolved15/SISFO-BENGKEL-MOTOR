const PartSchema = new mongoose.Schema({
    name: { type: String, required: true },
    code: { type: String, required: true },
    stock: { type: Number, required: true },
    purchasePrice: { type: Number, required: true },
    sellingPrice: { type: Number, required: true },
    supplier: { type: String },
    imageUrl: { type: String, default: '' } // <-- HARUS SAMA DENGAN DI SEEDER & EJS
}, { timestamps: true });