const express = require('express');
const router = express.Router();
const trainerController = require('../controllers/trainerController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All routes require authentication and 'trainer' role
router.use(requireAuth, requireRole('trainer'));

// Dashboard
router.get('/dashboard', trainerController.getDashboard);

// Assigned Members
router.get('/members', trainerController.getMembers);

// Workout Plans
router.get('/workouts', trainerController.getWorkoutPlans);
router.get('/workouts/create/:memberId', trainerController.getCreateWorkout);
router.post('/workouts/create/:memberId', trainerController.postCreateWorkout);
router.get('/workouts/edit/:id', trainerController.getEditWorkout);
router.put('/workouts/:id', trainerController.putEditWorkout);
router.delete('/workouts/:id', trainerController.deleteWorkout);

module.exports = router;
