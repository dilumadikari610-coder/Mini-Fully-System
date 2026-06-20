const mongoose = require('mongoose');

const SupplierSchema = new mongoose.Schema({
  supplierId: { type: String, required: true, unique: true }, // e.g., SPL000001
  name: { type: String, required: true, uppercase: true, trim: true },
  contactPerson: { type: String, uppercase: true, trim: true },
  phone: { type: String, trim: true },
  email: { type: String, lowercase: true, trim: true },
  address: { type: String, uppercase: true }
}, { timestamps: true });

module.exports = mongoose.model('Supplier', SupplierSchema);