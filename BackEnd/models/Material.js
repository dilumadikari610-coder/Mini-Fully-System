const mongoose = require('mongoose');


const MaterialSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,      
    trim: true,
    uppercase: true    
  },
  itemName: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true,
    default: ''
  },
  cost: {
    type: Number,
    required: true,
    default: 0.00
  },
  status: {
    type: String,
    default: 'In Stock'
  }
}, {
  timestamps: true 
});

// Model එක Export කිරීම
module.exports = mongoose.model('Material', MaterialSchema);