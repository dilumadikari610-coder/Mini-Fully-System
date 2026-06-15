const mongoose = require('mongoose');

/**
 * Department Schema
 * Defines the structure for organizational departments.
 */
const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    uppercase: true, // "it" හෝ "It" ඇතුළත් කළහොත් ස්වයංක්‍රීයව "IT" බවට පත් කරයි
  },
  createdAt: {
    type: Date,
    default: Date.now,
  }
});

module.exports = mongoose.model('Department', departmentSchema);