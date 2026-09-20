const express = require('express');
const router = express.Router();
const memberController = require('../controllers/memberController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All routes require authentication and 'member' role
router.use(requireAuth, requireRole('member'));

// Dashboard
router.get('/dashboard', memberController.getDashboard);

// Workout Plan
router.get('/workout', memberController.getWorkoutPlan);

// Attendance
router.get('/attendance', memberController.getAttendance);
router.post('/attendance', memberController.postAttendance);

// Weight Log
router.get('/weight-log', memberController.getWeightLog);
router.post('/weight-log', memberController.postWeightLog);

// Weight Progress Analysis
router.get('/progress', memberController.getProgress);
router.get('/api/weight-data', memberController.getWeightDataApi);

module.exports = router;
