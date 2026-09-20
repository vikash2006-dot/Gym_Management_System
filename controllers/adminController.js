const User = require('../models/User');
const MembershipPlan = require('../models/MembershipPlan');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const WorkoutPlan = require('../models/WorkoutPlan');
const WeightLog = require('../models/WeightLog');

// Helper to get normalized date (start of day)
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

// GET /admin/dashboard
exports.getDashboard = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    // 1. Total Members
    const totalMembers = await User.countDocuments({ role: 'member' });

    // 2. Active Memberships count (distinct members with an active membership)
    const activeMemberships = await Membership.find({
      status: 'Active',
      endDate: { $gte: now }
    }).distinct('member');
    const activeMembersCount = activeMemberships.length;

    // 3. Expired Members count
    // Members who either have no active membership or have an expired one
    const expiredMembersCount = Math.max(0, totalMembers - activeMembersCount);

    // 4. Today's Attendance
    const todayStart = getStartOfDay(now);
    const todayEnd = getEndOfDay(now);
    const todayAttendanceCount = await Attendance.countDocuments({
      date: { $gte: todayStart, $lte: todayEnd },
      status: 'Present'
    });

    // 5. Expiring soon memberships (next 7 days)
    const expiringMemberships = await Membership.find({
      endDate: { $gte: now, $lte: sevenDaysLater }
    })
      .populate('member', 'name email phone')
      .populate('plan', 'name duration price')
      .sort({ endDate: 1 });

    // Calculate remaining days for each
    const formattedExpiring = expiringMemberships.map(m => {
      const diffDays = Math.ceil((m.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: m._id,
        member: m.member,
        plan: m.plan,
        endDate: m.endDate,
        daysRemaining: diffDays >= 0 ? diffDays : 0,
        status: m.status
      };
    });

    // 6. Plan-wise distribution
    const plans = await MembershipPlan.find().lean();
    const planStats = await Promise.all(
      plans.map(async (plan) => {
        const count = await Membership.countDocuments({
          plan: plan._id,
          endDate: { $gte: now }
        });
        return {
          name: plan.name,
          count
        };
      })
    );

    res.render('admin/dashboard', {
      title: 'Admin Dashboard - Gym Management System',
      totalMembers,
      activeMembersCount,
      expiredMembersCount,
      todayAttendanceCount,
      expiringMemberships: formattedExpiring,
      planStats,
      activePage: 'dashboard'
    });
  } catch (error) {
    console.error('Admin Dashboard Error:', error);
    req.flash('error', 'Error loading dashboard statistics.');
    res.render('admin/dashboard', {
      title: 'Admin Dashboard',
      totalMembers: 0,
      activeMembersCount: 0,
      expiredMembersCount: 0,
      todayAttendanceCount: 0,
      expiringMemberships: [],
      planStats: [],
      activePage: 'dashboard'
    });
  }
};

// GET /admin/members
exports.getMembers = async (req, res) => {
  try {
    const { search, filter } = req.query;
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    let query = { role: 'member' };

    if (search) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [{ name: searchRegex }, { email: searchRegex }];
    }

    const members = await User.find(query)
      .populate('trainer', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    // Fetch latest membership for each member
    const memberIds = members.map(m => m._id);
    const memberships = await Membership.find({ member: { $in: memberIds } })
      .populate('plan', 'name duration price')
      .sort({ endDate: -1 })
      .lean();

    // Map memberships by member id
    const membershipMap = {};
    memberships.forEach(ms => {
      if (!membershipMap[ms.member.toString()]) {
        membershipMap[ms.member.toString()] = ms;
      }
    });

    // Attach latest membership and computed status
    let memberList = members.map(m => {
      const ms = membershipMap[m._id.toString()];
      let status = 'No Plan';
      let daysRemaining = 0;
      let isExpiringSoon = false;

      if (ms) {
        if (new Date(ms.endDate) < now) {
          status = 'Expired';
        } else {
          status = 'Active';
          const diffDays = Math.ceil((new Date(ms.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          daysRemaining = diffDays >= 0 ? diffDays : 0;
          if (new Date(ms.endDate) <= sevenDaysLater) {
            isExpiringSoon = true;
          }
        }
      }

      return {
        ...m,
        membership: ms || null,
        status,
        daysRemaining,
        isExpiringSoon
      };
    });

    // Apply status filter if requested
    if (filter === 'active') {
      memberList = memberList.filter(m => m.status === 'Active');
    } else if (filter === 'expired') {
      memberList = memberList.filter(m => m.status === 'Expired' || m.status === 'No Plan');
    } else if (filter === 'expiring') {
      memberList = memberList.filter(m => m.isExpiringSoon);
    }

    res.render('admin/members', {
      title: 'Member Management - Gym Management',
      members: memberList,
      search: search || '',
      filter: filter || 'all',
      activePage: 'members'
    });
  } catch (error) {
    console.error('Admin Members Error:', error);
    req.flash('error', 'Failed to retrieve members.');
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/members/add
exports.getAddMember = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' }).sort({ name: 1 });
    const plans = await MembershipPlan.find().sort({ duration: 1 });
    res.render('admin/add-member', {
      title: 'Add New Member',
      trainers,
      plans,
      activePage: 'members'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading add member form.');
    res.redirect('/admin/members');
  }
};

// POST /admin/members
exports.postAddMember = async (req, res) => {
  try {
    const { name, email, password, phone, trainerId, planId } = req.body;

    if (!name || !email || !password) {
      req.flash('error', 'Name, email, and password are required.');
      return res.redirect('/admin/members/add');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'A user with this email already exists.');
      return res.redirect('/admin/members/add');
    }

    const newMember = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'member',
      phone: phone ? phone.trim() : '',
      trainer: trainerId ? trainerId : null
    });

    await newMember.save();

    // If a plan was selected, create membership immediately
    if (planId) {
      const plan = await MembershipPlan.findById(planId);
      if (plan) {
        const startDate = new Date();
        const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);
        const membership = new Membership({
          member: newMember._id,
          plan: plan._id,
          startDate,
          endDate,
          status: 'Active'
        });
        await membership.save();
      }
    }

    req.flash('success', 'Member added successfully.');
    res.redirect('/admin/members');
  } catch (error) {
    console.error('Error adding member:', error);
    req.flash('error', 'Failed to add member: ' + error.message);
    res.redirect('/admin/members/add');
  }
};

// GET /admin/members/edit/:id
exports.getEditMember = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member || member.role !== 'member') {
      req.flash('error', 'Member not found.');
      return res.redirect('/admin/members');
    }

    const trainers = await User.find({ role: 'trainer' }).sort({ name: 1 });
    const plans = await MembershipPlan.find().sort({ duration: 1 });
    const currentMembership = await Membership.findOne({ member: member._id })
      .populate('plan')
      .sort({ endDate: -1 });

    res.render('admin/edit-member', {
      title: 'Edit Member',
      member,
      trainers,
      plans,
      currentMembership,
      activePage: 'members'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading member.');
    res.redirect('/admin/members');
  }
};

// PUT /admin/members/:id
exports.putEditMember = async (req, res) => {
  try {
    const { name, email, phone, trainerId, password } = req.body;
    const member = await User.findById(req.params.id);

    if (!member || member.role !== 'member') {
      req.flash('error', 'Member not found.');
      return res.redirect('/admin/members');
    }

    member.name = name.trim();
    member.email = email.toLowerCase().trim();
    member.phone = phone ? phone.trim() : '';
    member.trainer = trainerId ? trainerId : null;

    if (password && password.trim().length >= 6) {
      member.password = password.trim();
    }

    await member.save();
    req.flash('success', 'Member details updated successfully.');
    res.redirect('/admin/members');
  } catch (error) {
    console.error('Error updating member:', error);
    req.flash('error', 'Failed to update member: ' + error.message);
    res.redirect('/admin/members');
  }
};

// DELETE /admin/members/:id
exports.deleteMember = async (req, res) => {
  try {
    const memberId = req.params.id;
    await User.findByIdAndDelete(memberId);
    await Membership.deleteMany({ member: memberId });
    await Attendance.deleteMany({ member: memberId });
    await WorkoutPlan.deleteMany({ member: memberId });
    await WeightLog.deleteMany({ member: memberId });

    req.flash('success', 'Member and associated records deleted successfully.');
    res.redirect('/admin/members');
  } catch (error) {
    console.error('Error deleting member:', error);
    req.flash('error', 'Failed to delete member.');
    res.redirect('/admin/members');
  }
};

// GET /admin/members/assign-membership/:id
exports.getAssignMembership = async (req, res) => {
  try {
    const member = await User.findById(req.params.id);
    if (!member) {
      req.flash('error', 'Member not found.');
      return res.redirect('/admin/members');
    }
    const plans = await MembershipPlan.find().sort({ duration: 1 });
    const currentMembership = await Membership.findOne({ member: member._id })
      .populate('plan')
      .sort({ endDate: -1 });

    res.render('admin/assign-membership', {
      title: 'Assign Membership Plan',
      member,
      plans,
      currentMembership,
      activePage: 'members'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading assignment page.');
    res.redirect('/admin/members');
  }
};

// POST /admin/members/assign-membership/:id
exports.postAssignMembership = async (req, res) => {
  try {
    const { planId, customStartDate } = req.body;
    const member = await User.findById(req.params.id);
    const plan = await MembershipPlan.findById(planId);

    if (!member || !plan) {
      req.flash('error', 'Invalid member or membership plan.');
      return res.redirect('/admin/members');
    }

    const startDate = customStartDate ? new Date(customStartDate) : new Date();
    const endDate = new Date(startDate.getTime() + plan.duration * 24 * 60 * 60 * 1000);

    const membership = new Membership({
      member: member._id,
      plan: plan._id,
      startDate,
      endDate,
      status: endDate > new Date() ? 'Active' : 'Expired'
    });

    await membership.save();
    req.flash('success', `Assigned "${plan.name}" plan to ${member.name} successfully.`);
    res.redirect('/admin/members');
  } catch (error) {
    console.error('Error assigning plan:', error);
    req.flash('error', 'Failed to assign plan: ' + error.message);
    res.redirect('/admin/members');
  }
};

// GET /admin/plans
exports.getPlans = async (req, res) => {
  try {
    const plans = await MembershipPlan.find().sort({ duration: 1 }).lean();
    const now = new Date();

    const plansWithCount = await Promise.all(
      plans.map(async (p) => {
        const count = await Membership.countDocuments({
          plan: p._id,
          endDate: { $gte: now }
        });
        return {
          ...p,
          activeMembers: count
        };
      })
    );

    res.render('admin/membership-plans', {
      title: 'Membership Plans - Gym Management',
      plans: plansWithCount,
      activePage: 'plans'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load membership plans.');
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/plans/add
exports.getAddPlan = (req, res) => {
  res.render('admin/add-plan', {
    title: 'Create Membership Plan',
    activePage: 'plans'
  });
};

// POST /admin/plans
exports.postAddPlan = async (req, res) => {
  try {
    const { name, duration, price, description } = req.body;

    if (!name || !duration || !price) {
      req.flash('error', 'Plan name, duration, and price are required.');
      return res.redirect('/admin/plans/add');
    }

    const newPlan = new MembershipPlan({
      name: name.trim(),
      duration: Number(duration),
      price: Number(price),
      description: description ? description.trim() : ''
    });

    await newPlan.save();
    req.flash('success', 'Membership plan created successfully.');
    res.redirect('/admin/plans');
  } catch (error) {
    console.error('Error creating plan:', error);
    req.flash('error', 'Failed to create plan: ' + error.message);
    res.redirect('/admin/plans/add');
  }
};

// GET /admin/plans/edit/:id
exports.getEditPlan = async (req, res) => {
  try {
    const plan = await MembershipPlan.findById(req.params.id);
    if (!plan) {
      req.flash('error', 'Plan not found.');
      return res.redirect('/admin/plans');
    }

    res.render('admin/edit-plan', {
      title: 'Edit Membership Plan',
      plan,
      activePage: 'plans'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading plan.');
    res.redirect('/admin/plans');
  }
};

// PUT /admin/plans/:id
exports.putEditPlan = async (req, res) => {
  try {
    const { name, duration, price, description } = req.body;
    await MembershipPlan.findByIdAndUpdate(req.params.id, {
      name: name.trim(),
      duration: Number(duration),
      price: Number(price),
      description: description ? description.trim() : ''
    });

    req.flash('success', 'Membership plan updated successfully.');
    res.redirect('/admin/plans');
  } catch (error) {
    console.error('Error updating plan:', error);
    req.flash('error', 'Failed to update plan: ' + error.message);
    res.redirect('/admin/plans');
  }
};

// DELETE /admin/plans/:id
exports.deletePlan = async (req, res) => {
  try {
    const planId = req.params.id;
    // Check if there are active memberships referencing this plan
    const activeCount = await Membership.countDocuments({
      plan: planId,
      endDate: { $gte: new Date() }
    });

    if (activeCount > 0) {
      req.flash('error', `Cannot delete plan: There are ${activeCount} active member subscriptions attached to it.`);
      return res.redirect('/admin/plans');
    }

    await MembershipPlan.findByIdAndDelete(planId);
    req.flash('success', 'Plan deleted successfully.');
    res.redirect('/admin/plans');
  } catch (error) {
    console.error('Error deleting plan:', error);
    req.flash('error', 'Failed to delete plan.');
    res.redirect('/admin/plans');
  }
};

// GET /admin/trainers
exports.getTrainers = async (req, res) => {
  try {
    const trainers = await User.find({ role: 'trainer' }).sort({ name: 1 }).lean();

    // Fetch assigned member count for each trainer
    const trainersWithStats = await Promise.all(
      trainers.map(async (trainer) => {
        const assignedCount = await User.countDocuments({
          role: 'member',
          trainer: trainer._id
        });
        return {
          ...trainer,
          assignedCount
        };
      })
    );

    res.render('admin/trainers', {
      title: 'Trainer Management - Gym Management',
      trainers: trainersWithStats,
      activePage: 'trainers'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load trainers.');
    res.redirect('/admin/dashboard');
  }
};

// GET /admin/trainers/add
exports.getAddTrainer = (req, res) => {
  res.render('admin/add-trainer', {
    title: 'Add New Trainer',
    activePage: 'trainers'
  });
};

// POST /admin/trainers
exports.postAddTrainer = async (req, res) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!name || !email || !password) {
      req.flash('error', 'Name, email, and password are required.');
      return res.redirect('/admin/trainers/add');
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      req.flash('error', 'A user with this email already exists.');
      return res.redirect('/admin/trainers/add');
    }

    const trainer = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      phone: phone ? phone.trim() : '',
      role: 'trainer'
    });

    await trainer.save();
    req.flash('success', `Trainer "${trainer.name}" created successfully.`);
    res.redirect('/admin/trainers');
  } catch (error) {
    console.error('Error adding trainer:', error);
    req.flash('error', 'Failed to create trainer: ' + error.message);
    res.redirect('/admin/trainers/add');
  }
};

// DELETE /admin/trainers/:id
exports.deleteTrainer = async (req, res) => {
  try {
    const trainerId = req.params.id;
    // Unassign this trainer from all members
    await User.updateMany({ trainer: trainerId }, { $set: { trainer: null } });
    await User.findByIdAndDelete(trainerId);

    req.flash('success', 'Trainer removed and unassigned from members.');
    res.redirect('/admin/trainers');
  } catch (error) {
    console.error('Error removing trainer:', error);
    req.flash('error', 'Failed to delete trainer.');
    res.redirect('/admin/trainers');
  }
};

// GET /admin/assign-trainer
exports.getAssignTrainer = async (req, res) => {
  try {
    const members = await User.find({ role: 'member' })
      .populate('trainer', 'name')
      .sort({ name: 1 });
    const trainers = await User.find({ role: 'trainer' }).sort({ name: 1 });

    res.render('admin/assign-trainer', {
      title: 'Assign Trainer to Member',
      members,
      trainers,
      selectedMemberId: req.query.memberId || '',
      activePage: 'assign-trainer'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load assign trainer page.');
    res.redirect('/admin/dashboard');
  }
};

// POST /admin/assign-trainer
exports.postAssignTrainer = async (req, res) => {
  try {
    const { memberId, trainerId } = req.body;

    if (!memberId) {
      req.flash('error', 'Please select a member.');
      return res.redirect('/admin/assign-trainer');
    }

    const member = await User.findById(memberId);
    if (!member) {
      req.flash('error', 'Member not found.');
      return res.redirect('/admin/assign-trainer');
    }

    if (trainerId === '' || trainerId === 'none') {
      member.trainer = null;
      await member.save();
      req.flash('success', `Trainer removed from member ${member.name}.`);
    } else {
      const trainer = await User.findById(trainerId);
      if (!trainer || trainer.role !== 'trainer') {
        req.flash('error', 'Invalid trainer selected.');
        return res.redirect('/admin/assign-trainer');
      }
      member.trainer = trainer._id;
      await member.save();
      req.flash('success', `Trainer ${trainer.name} successfully assigned to ${member.name}.`);
    }

    res.redirect('/admin/members');
  } catch (error) {
    console.error('Error assigning trainer:', error);
    req.flash('error', 'Failed to assign trainer.');
    res.redirect('/admin/assign-trainer');
  }
};

// GET /admin/expiring-memberships
exports.getExpiringMemberships = async (req, res) => {
  try {
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const expiringList = await Membership.find({
      endDate: { $gte: now, $lte: sevenDaysLater }
    })
      .populate('member', 'name email phone')
      .populate('plan', 'name duration price')
      .sort({ endDate: 1 });

    const formatted = expiringList.map(m => {
      const diffDays = Math.ceil((m.endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        _id: m._id,
        member: m.member,
        plan: m.plan,
        endDate: m.endDate,
        daysRemaining: diffDays >= 0 ? diffDays : 0,
        status: m.status
      };
    });

    res.render('admin/expiring-memberships', {
      title: 'Expiring Memberships (Next 7 Days)',
      expiringMemberships: formatted,
      activePage: 'expiring'
    });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error loading expiring memberships.');
    res.redirect('/admin/dashboard');
  }
};
