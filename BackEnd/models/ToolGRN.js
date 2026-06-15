const mongoose = require('mongoose');

const ToolGRNSchema = new mongoose.Schema({
  grnId: { type: String, required: true, unique: true }, // Format: GRN000001
  supplier: { type: String, required: true },
  receivedDate: { type: Date, default: Date.now },
  items: [{
    itemName: { type: String, required: true },
    quantity: { type: Number, required: true },
    unit: { type: String, default: 'PCS' },
    status: { type: String, enum: ['In Stock', 'Assigned'], default: 'In Stock' },
    assignedStaff: { type: String, default: null }
  }],
  receivedBy: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ToolGRN', ToolGRNSchema);