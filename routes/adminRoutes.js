const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const { requireRole } = require('../middleware/role');

// All routes in this router require authentication and 'admin' role
router.use(requireAuth, requireRole('admin'));

// Dashboard
router.get('/dashboard', adminController.getDashboard);

// Member Management
router.get('/members', adminController.getMembers);
router.get('/members/add', adminController.getAddMember);
router.post('/members', adminController.postAddMember);
router.get('/members/edit/:id', adminController.getEditMember);
router.put('/members/:id', adminController.putEditMember);
router.delete('/members/:id', adminController.deleteMember);

// Member Membership Plan Assignment
router.get('/members/assign-membership/:id', adminController.getAssignMembership);
router.post('/members/assign-membership/:id', adminController.postAssignMembership);

// Membership Plan Management
router.get('/plans', adminController.getPlans);
router.get('/plans/add', adminController.getAddPlan);
router.post('/plans', adminController.postAddPlan);
router.get('/plans/edit/:id', adminController.getEditPlan);
router.put('/plans/:id', adminController.putEditPlan);
router.delete('/plans/:id', adminController.deletePlan);

// Trainer Management
router.get('/trainers', adminController.getTrainers);
router.get('/trainers/add', adminController.getAddTrainer);
router.post('/trainers', adminController.postAddTrainer);
router.delete('/trainers/:id', adminController.deleteTrainer);

// Assign Trainer
router.get('/assign-trainer', adminController.getAssignTrainer);
router.post('/assign-trainer', adminController.postAssignTrainer);

// Expiring Memberships
router.get('/expiring-memberships', adminController.getExpiringMemberships);

module.exports = router;
