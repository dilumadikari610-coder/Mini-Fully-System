const mongoose = require('mongoose');

const workflowTemplateSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true }, // e.g., "PURCHASE_ELISHA"
  description: { type: String, required: true },       // e.g., "Approval By Dushmantha & Imasha"
  permission: { type: String, enum: ['NEED_ALL', 'ANY_ONE'], default: 'NEED_ALL' },
  approvers: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      employeeName: { type: String, required: true },
      designation: { type: String },
      email: { type: String },
      orderLevel: { type: Number, required: true } // Level 1, Level 2...
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('WorkflowTemplate', workflowTemplateSchema);