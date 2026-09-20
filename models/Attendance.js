const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required']
  },
  date: {
    type: Date,
    required: [true, 'Attendance date is required']
  },
  status: {
    type: String,
    enum: ['Present', 'Absent'],
    default: 'Present'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure a member can only mark attendance once per day
attendanceSchema.index({ member: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
