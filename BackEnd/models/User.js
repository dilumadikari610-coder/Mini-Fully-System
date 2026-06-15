const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true }, 
  userType: { 
    type: String, 
    // Ensure these match exactly what you select in the frontend dropdown
    enum: ['Admin', 'Normal User', 'Maintenance Staff'], 
    default: 'Normal User' 
  },
  department: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

// ✅ NO MIDDLEWARE HERE - If the error persists, it is definitely coming from Request.js

module.exports = mongoose.model('User', UserSchema);