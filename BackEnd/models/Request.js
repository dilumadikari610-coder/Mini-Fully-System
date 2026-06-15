const mongoose = require('mongoose');

/**
 * Request Schema
 * Defines the structure for Maintenance Job Tickets.
 * Status Flow: Assign Pending -> Assigned -> On Approval -> Completed
 */
const RequestSchema = new mongoose.Schema({
  // Unique Ticket ID (e.g., TID000001) generated in server.js
  tid: { 
    type: String, 
    required: true, 
    unique: true 
  }, 
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  type: { 
    type: String, 
    enum: [
      'Repair', 
      'Preventive', 
      'Installation', 
      'Emergency', 
      'Plumbing', 
      'Electrical', 
      'Furniture',
      'Network'
    ], 
    default: 'Repair' 
  },
  priority: { 
    type: String, 
    enum: ['Low', 'Medium', 'High', 'Critical'], 
    default: 'Medium' 
  },
  // The core workflow status
  status: { 
    type: String, 
    enum: ['Assign Pending', 'Assigned', 'On Approval', 'Completed'], 
    default: 'Assign Pending' 
  },
  
  // Requester Details
  requestedBy: { type: String, required: true },
  userId: { type: String, required: true }, 

  // Assignment Details
  assignedTo: { type: String, default: null },   // Staff Name
  assignedToId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    default: null 
  }, 

  // Timestamps
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// ✅ WE HAVE REMOVED THE MIDDLEWARE (pre-save hook) TO PREVENT THE "next" ERROR.
// Dates are now managed directly in the server.js routes.

module.exports = mongoose.model('Request', RequestSchema);