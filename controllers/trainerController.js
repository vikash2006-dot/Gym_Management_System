const User = require('../models/User');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const WorkoutPlan = require('../models/WorkoutPlan');

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const getEndOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

// GET /trainer/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const now = new Date();

    // Assigned members
    const assignedMembers = await User.find({ role: 'member', trainer: trainerId }).lean();
    const assignedMemberIds = assignedMembers.map(m => m._id);

    // Active members count (have active membership)
    const activeMemberships = await Membership.find({
      member: { $in: assignedMemberIds },
      status: 'Active',
      endDate: { $gte: now }
    }).distinct('member');

    // Today's attendance of assigned members
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const todayAttendanceCount = await Attendance.countDocuments({
      member: { $in: assignedMemberIds },
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'Present'
    });

    // Workout plans created by this trainer
    const plansCreatedCount = await WorkoutPlan.countDocuments({ trainer: trainerId });

    // Members without workout plans
    const membersWithPlans = await WorkoutPlan.find({ trainer: trainerId }).distinct('member');
    const membersWithPlansSet = new Set(membersWithPlans.map(id => id.toString()));
    const membersWithoutPlans = assignedMembers.filter(m => !membersWithPlansSet.has(m._id.toString()));

    res.render('trainer/dashboard', {
      title: 'Trainer Dashboard - Gym Management',
      trainerName: req.session.user.name,
      totalAssigned: assignedMembers.length,
      activeMembersCount: activeMemberships.length,
      todayAttendanceCount,
      plansCreatedCount,
      membersWithoutPlans,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Trainer Dashboard Error:', error);
    req.flash('error', 'Error loading trainer dashboard.');
    res.redirect('/login');
  }
};

// GET /trainer/members
exports.getMembers = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const now = new Date();

    const members = await User.find({ role: 'member', trainer: trainerId })
      .sort({ name: 1 })
      .lean();

    const memberIds = members.map(m => m._id);

    // Latest membership for each
    const memberships = await Membership.find({ member: { $in: memberIds } })
      .populate('plan', 'name duration')
      .sort({ endDate: -1 })
      .lean();

    const membershipMap = {};
    memberships.forEach(ms => {
      if (!membershipMap[ms.member.toString()]) {
        membershipMap[ms.member.toString()] = ms;
      }
    });

    // Workout plans for each
    const workoutPlans = await WorkoutPlan.find({ member: { $in: memberIds }, trainer: trainerId }).lean();
    const workoutMap = {};
    workoutPlans.forEach(wp => {
      workoutMap[wp.member.toString()] = wp;
    });

    const memberList = members.map(m => {
      const ms = membershipMap[m._id.toString()];
      let status = 'No Plan';
      let expiryDate = 'N/A';

      if (ms) {
        status = new Date(ms.endDate) < now ? 'Expired' : 'Active';
        expiryDate = new Date(ms.endDate).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }

      const wp = workoutMap[m._id.toString()];

      return {
        ...m,
        membershipStatus: status,
        membershipExpiry: expiryDate,
        workoutPlan: wp || null
      };
    });

    res.render('trainer/members', {
      title: 'My Assigned Members',
      members: memberList,
      activePage: 'members'
    });
  } catch (error) {
    console.error('Trainer members error:', error);
    req.flash('error', 'Failed to load assigned members.');
    res.redirect('/trainer/dashboard');
  }
};

// GET /trainer/workouts
exports.getWorkoutPlans = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const workoutPlans = await WorkoutPlan.find({ trainer: trainerId })
      .populate('member', 'name email phone')
      .sort({ createdAt: -1 });

    res.render('trainer/workout-plans', {
      title: 'Assigned Workout Plans',
      workoutPlans,
      activePage: 'workouts'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load workout plans.');
    res.redirect('/trainer/dashboard');
  }
};

// GET /trainer/workouts/create/:memberId
exports.getCreateWorkout = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const member = await User.findOne({
      _id: req.params.memberId,
      role: 'member',
      trainer: trainerId
    });

    if (!member) {
      req.flash('error', 'Member not found or not assigned to you.');
      return res.redirect('/trainer/members');
    }

    // Check if member already has a workout plan
    const existingPlan = await WorkoutPlan.findOne({ member: member._id, trainer: trainerId });

    res.render('trainer/create-workout', {
      title: `Create Workout Plan for ${member.name}`,
      member,
      existingPlan,
      activePage: 'members'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load workout creation form.');
    res.redirect('/trainer/members');
  }
};

// POST /trainer/workouts/create/:memberId
exports.postCreateWorkout = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const memberId = req.params.memberId;

    // Verify member belongs to this trainer
    const member = await User.findOne({
      _id: memberId,
      role: 'member',
      trainer: trainerId
    });

    if (!member) {
      req.flash('error', 'Member not found or not assigned to you.');
      return res.redirect('/trainer/members');
    }

    const { planName, exercises } = req.body;

    if (!planName || !planName.trim()) {
      req.flash('error', 'Workout plan name is required.');
      return res.redirect(`/trainer/workouts/create/${memberId}`);
    }

    // Parse dynamic exercise rows
    // When multiple exercises are submitted, fields may be arrays or single values
    const exerciseList = [];
    if (exercises && Array.isArray(exercises)) {
      for (const ex of exercises) {
        if (ex.exercise && ex.sets && ex.reps && ex.dayOfWeek) {
          exerciseList.push({
            exercise: ex.exercise.trim(),
            sets: Number(ex.sets),
            reps: Number(ex.reps),
            dayOfWeek: ex.dayOfWeek
          });
        }
      }
    } else if (req.body.exercise) {
      // Form submitted with parallel arrays: exercise[], sets[], reps[], dayOfWeek[]
      const exNames = Array.isArray(req.body.exercise) ? req.body.exercise : [req.body.exercise];
      const sets = Array.isArray(req.body.sets) ? req.body.sets : [req.body.sets];
      const reps = Array.isArray(req.body.reps) ? req.body.reps : [req.body.reps];
      const days = Array.isArray(req.body.dayOfWeek) ? req.body.dayOfWeek : [req.body.dayOfWeek];

      for (let i = 0; i < exNames.length; i++) {
        if (exNames[i] && exNames[i].trim()) {
          exerciseList.push({
            exercise: exNames[i].trim(),
            sets: Number(sets[i]) || 3,
            reps: Number(reps[i]) || 10,
            dayOfWeek: days[i] || 'Monday'
          });
        }
      }
    }

    if (exerciseList.length === 0) {
      req.flash('error', 'Please add at least one exercise to the plan.');
      return res.redirect(`/trainer/workouts/create/${memberId}`);
    }

    // Check if plan already exists for member, update or create new
    let workoutPlan = await WorkoutPlan.findOne({ member: memberId });
    if (workoutPlan) {
      workoutPlan.trainer = trainerId;
      workoutPlan.planName = planName.trim();
      workoutPlan.exercises = exerciseList;
      await workoutPlan.save();
      req.flash('success', `Workout plan "${planName}" updated for ${member.name}.`);
    } else {
      workoutPlan = new WorkoutPlan({
        member: memberId,
        trainer: trainerId,
        planName: planName.trim(),
        exercises: exerciseList
      });
      await workoutPlan.save();
      req.flash('success', `Workout plan "${planName}" created for ${member.name}.`);
    }

    res.redirect('/trainer/workouts');
  } catch (error) {
    console.error('Error creating workout plan:', error);
    req.flash('error', 'Failed to save workout plan: ' + error.message);
    res.redirect(`/trainer/workouts/create/${req.params.memberId}`);
  }
};

// GET /trainer/workouts/edit/:id
exports.getEditWorkout = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const plan = await WorkoutPlan.findOne({ _id: req.params.id, trainer: trainerId })
      .populate('member', 'name email phone');

    if (!plan) {
      req.flash('error', 'Workout plan not found or not assigned to you.');
      return res.redirect('/trainer/workouts');
    }

    res.render('trainer/edit-workout', {
      title: `Edit Workout: ${plan.planName}`,
      plan,
      activePage: 'workouts'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading workout plan.');
    res.redirect('/trainer/workouts');
  }
};

// PUT /trainer/workouts/:id
exports.putEditWorkout = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    const plan = await WorkoutPlan.findOne({ _id: req.params.id, trainer: trainerId });

    if (!plan) {
      req.flash('error', 'Workout plan not found or permission denied.');
      return res.redirect('/trainer/workouts');
    }

    const { planName } = req.body;
    const exNames = Array.isArray(req.body.exercise) ? req.body.exercise : (req.body.exercise ? [req.body.exercise] : []);
    const sets = Array.isArray(req.body.sets) ? req.body.sets : (req.body.sets ? [req.body.sets] : []);
    const reps = Array.isArray(req.body.reps) ? req.body.reps : (req.body.reps ? [req.body.reps] : []);
    const days = Array.isArray(req.body.dayOfWeek) ? req.body.dayOfWeek : (req.body.dayOfWeek ? [req.body.dayOfWeek] : []);

    const exerciseList = [];
    for (let i = 0; i < exNames.length; i++) {
      if (exNames[i] && exNames[i].trim()) {
        exerciseList.push({
          exercise: exNames[i].trim(),
          sets: Number(sets[i]) || 3,
          reps: Number(reps[i]) || 10,
          dayOfWeek: days[i] || 'Monday'
        });
      }
    }

    plan.planName = planName ? planName.trim() : plan.planName;
    plan.exercises = exerciseList;
    await plan.save();

    req.flash('success', 'Workout plan updated successfully.');
    res.redirect('/trainer/workouts');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to update workout plan.');
    res.redirect('/trainer/workouts');
  }
};

// DELETE /trainer/workouts/:id
exports.deleteWorkout = async (req, res) => {
  try {
    const trainerId = req.session.user.id;
    await WorkoutPlan.findOneAndDelete({ _id: req.params.id, trainer: trainerId });
    req.flash('success', 'Workout plan deleted successfully.');
    res.redirect('/trainer/workouts');
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to delete workout plan.');
    res.redirect('/trainer/workouts');
  }
};
