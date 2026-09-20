const mongoose = require('mongoose');

const weightLogSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required']
  },
  weight: {
    type: Number,
    required: [true, 'Weight is required'],
    min: [10, 'Weight must be a realistic positive number']
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index to quickly query logs for a member ordered by date
weightLogSchema.index({ member: 1, date: -1 });

module.exports = mongoose.model('WeightLog', weightLogSchema);
