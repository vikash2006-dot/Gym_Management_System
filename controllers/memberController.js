const User = require('../models/User');
const Membership = require('../models/Membership');
const WorkoutPlan = require('../models/WorkoutPlan');
const Attendance = require('../models/Attendance');
const WeightLog = require('../models/WeightLog');

const getDayName = (date = new Date()) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
};

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

// GET /member/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const now = new Date();

    // 1. Fetch member details with populated trainer
    const member = await User.findById(memberId).populate('trainer', 'name email phone');

    // 2. Latest membership
    const membership = await Membership.findOne({ member: memberId })
      .populate('plan')
      .sort({ endDate: -1 });

    let membershipStatus = 'No Plan';
    let formattedExpiry = 'N/A';
    let daysRemaining = 0;

    if (membership) {
      if (new Date(membership.endDate) < now) {
        membershipStatus = 'Expired';
      } else {
        membershipStatus = 'Active';
        const diffDays = Math.ceil((new Date(membership.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        daysRemaining = diffDays >= 0 ? diffDays : 0;
      }
      formattedExpiry = new Date(membership.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }

    // 3. Today's attendance status
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const todayAttendance = await Attendance.findOne({
      member: memberId,
      date: { $gte: todayStart, $lte: todayEnd }
    });
    const hasMarkedToday = !!todayAttendance;

    // 4. Latest weight log
    const latestWeightLog = await WeightLog.findOne({ member: memberId }).sort({ date: -1 });

    // 5. Today's workout plan
    const currentDay = getDayName(now);
    const workoutPlan = await WorkoutPlan.findOne({ member: memberId }).populate('trainer', 'name');
    let todayExercises = [];
    if (workoutPlan && workoutPlan.exercises) {
      todayExercises = workoutPlan.exercises.filter(ex => ex.dayOfWeek === currentDay);
    }

    res.render('member/dashboard', {
      title: 'Member Dashboard - Gym Management',
      member,
      membership,
      membershipStatus,
      formattedExpiry,
      daysRemaining,
      hasMarkedToday,
      latestWeight: latestWeightLog ? latestWeightLog.weight : null,
      workoutPlan,
      todayExercises,
      currentDay,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Member Dashboard Error:', error);
    req.flash('error', 'Failed to load member dashboard.');
    res.redirect('/login');
  }
};

// GET /member/workout
exports.getWorkoutPlan = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const workoutPlan = await WorkoutPlan.findOne({ member: memberId })
      .populate('trainer', 'name email phone');

    // Group exercises by day
    const daysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const exercisesByDay = {};
    daysOrder.forEach(day => {
      exercisesByDay[day] = [];
    });

    if (workoutPlan && workoutPlan.exercises) {
      workoutPlan.exercises.forEach(ex => {
        if (exercisesByDay[ex.dayOfWeek]) {
          exercisesByDay[ex.dayOfWeek].push(ex);
        }
      });
    }

    res.render('member/workout-plan', {
      title: 'My Workout Plan',
      workoutPlan,
      exercisesByDay,
      daysOrder,
      activePage: 'workout'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load workout plan.');
    res.redirect('/member/dashboard');
  }
};

// GET /member/attendance
exports.getAttendance = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const now = new Date();

    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    const todayAttendance = await Attendance.findOne({
      member: memberId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    const attendanceRecords = await Attendance.find({ member: memberId })
      .sort({ date: -1 })
      .limit(60);

    res.render('member/attendance', {
      title: 'Attendance Record',
      hasMarkedToday: !!todayAttendance,
      todayDateStr: now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      attendanceRecords,
      activePage: 'attendance'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load attendance records.');
    res.redirect('/member/dashboard');
  }
};

// POST /member/attendance
exports.postAttendance = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const now = new Date();
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);

    // Prevent duplicate attendance for the same day
    const existing = await Attendance.findOne({
      member: memberId,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    if (existing) {
      req.flash('error', 'Attendance has already been marked for today.');
      return res.redirect('/member/attendance');
    }

    const attendance = new Attendance({
      member: memberId,
      date: todayStart,
      status: 'Present'
    });

    await attendance.save();
    req.flash('success', "Today's attendance successfully marked: Present!");
    res.redirect('/member/attendance');
  } catch (error) {
    console.error('Attendance mark error:', error);
    if (error.code === 11000) {
      req.flash('error', 'Attendance already marked for today.');
    } else {
      req.flash('error', 'Failed to mark attendance.');
    }
    res.redirect('/member/attendance');
  }
};

// GET /member/weight-log
exports.getWeightLog = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const weightLogs = await WeightLog.find({ member: memberId })
      .sort({ date: -1 })
      .lean();

    res.render('member/weight-log', {
      title: 'Weight Log & Tracking',
      weightLogs,
      activePage: 'weight'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load weight logs.');
    res.redirect('/member/dashboard');
  }
};

// POST /member/weight-log
exports.postWeightLog = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const { weight, date } = req.body;

    const parsedWeight = parseFloat(weight);
    if (!parsedWeight || parsedWeight <= 0 || parsedWeight > 350) {
      req.flash('error', 'Please enter a valid weight in kg (e.g. 72.5).');
      return res.redirect('/member/weight-log');
    }

    const log = new WeightLog({
      member: memberId,
      weight: parsedWeight,
      date: date ? new Date(date) : new Date()
    });

    await log.save();
    req.flash('success', `Logged weight of ${parsedWeight} kg successfully.`);
    res.redirect('/member/weight-log');
  } catch (error) {
    console.error('Error logging weight:', error);
    req.flash('error', 'Failed to log weight: ' + error.message);
    res.redirect('/member/weight-log');
  }
};

// GET /member/progress (Weight Progress Chart page)
exports.getProgress = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    const weightLogs = await WeightLog.find({ member: memberId })
      .sort({ date: 1 })
      .lean();

    res.render('member/progress', {
      title: 'Weight Progress Analysis',
      weightLogs,
      activePage: 'progress'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load progress chart.');
    res.redirect('/member/dashboard');
  }
};

// GET /member/api/weight-data (Secure JSON API for Chart.js)
exports.getWeightDataApi = async (req, res) => {
  try {
    const memberId = req.session.user.id;
    // Strictly scoped to the logged-in user!
    const weightLogs = await WeightLog.find({ member: memberId })
      .sort({ date: 1 })
      .lean();

    const labels = weightLogs.map(log =>
      new Date(log.date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })
    );
    const data = weightLogs.map(log => log.weight);

    res.json({ labels, data });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch weight logs' });
  }
};
