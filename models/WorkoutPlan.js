const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  exercise: {
    type: String,
    required: [true, 'Exercise name is required'],
    trim: true
  },
  sets: {
    type: Number,
    required: [true, 'Number of sets is required'],
    min: [1, 'Sets must be at least 1']
  },
  reps: {
    type: Number,
    required: [true, 'Number of reps is required'],
    min: [1, 'Reps must be at least 1']
  },
  dayOfWeek: {
    type: String,
    required: [true, 'Day of week is required'],
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
  }
});

const workoutPlanSchema = new mongoose.Schema({
  member: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Member reference is required']
  },
  trainer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Trainer reference is required']
  },
  planName: {
    type: String,
    required: [true, 'Plan name is required'],
    trim: true
  },
  exercises: [exerciseSchema],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
