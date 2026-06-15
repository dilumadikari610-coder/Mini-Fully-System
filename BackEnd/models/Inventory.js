const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  itemName: { type: String, required: true },
  grnId: { type: String, required: true },        // Reference to the GRN Number
  grnObjectId: { type: mongoose.Schema.Types.ObjectId, ref: 'ToolGRN' },
  cost: { type: Number, required: true },
  quantity: { type: Number, default: 1 },
  status: { 
    type: String, 
    enum: ['In Stock', 'Assigned', 'Consumed', 'Damaged'], 
    default: 'In Stock' 
  },
  assignedTo: { type: String, default: null },   // Staff Username
  assignedDate: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', InventorySchema);