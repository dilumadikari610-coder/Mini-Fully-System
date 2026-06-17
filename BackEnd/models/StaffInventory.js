const mongoose = require('mongoose');

const StaffInventorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  staffName: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  },
  itemName: {
    type: String,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  allocatedDate: {
    type: Date,
    default: Date.now
  },
  grnId: String
}, { timestamps: true });

module.exports = mongoose.model('StaffInventory', StaffInventorySchema);