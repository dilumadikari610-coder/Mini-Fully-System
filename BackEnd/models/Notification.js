const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isRead: {
    type: Boolean,
    default: false
  },
  type: {
    type: String, // 'ASSIGNED', 'COMPLETED', 'APPROVED', 'REJECTED'
    required: true
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request'
  }
}, { timestamps: true });

module.exports = mongoose.model('Notification', NotificationSchema);