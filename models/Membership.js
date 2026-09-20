const mongoose = require('mongoose');

const membershipSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required']
  },
  plan: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MembershipPlan',
    required: [true, 'Membership plan reference is required']
  },
  startDate: {
    type: Date,
    required: [true, 'Start date is required'],
    default: Date.now
  },
  endDate: {
    type: Date,
    required: [true, 'End date is required']
  },
  status: {
    type: String,
    enum: ['Active', 'Expired'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Update status dynamically before save
membershipSchema.pre('save', function (next) {
  const now = new Date();
  if (now > this.endDate) {
    this.status = 'Expired';
  } else {
    this.status = 'Active';
  }
  next();
});

// Helper instance method to compute current status dynamically
membershipSchema.methods.getCurrentStatus = function () {
  const now = new Date();
  return now > this.endDate ? 'Expired' : 'Active';
};

// Days remaining calculation
membershipSchema.methods.getDaysRemaining = function () {
  const now = new Date();
  const diffTime = this.endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays > 0 ? diffDays : 0;
};

// Check if expiring within given days (default 7)
membershipSchema.methods.isExpiringSoon = function (days = 7) {
  const now = new Date();
  if (now > this.endDate) return false;
  const remaining = this.getDaysRemaining();
  return remaining >= 0 && remaining <= days;
};

module.exports = mongoose.model('Membership', membershipSchema);
