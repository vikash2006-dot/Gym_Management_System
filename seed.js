require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const MembershipPlan = require('./models/MembershipPlan');
const Membership = require('./models/Membership');
const WorkoutPlan = require('./models/WorkoutPlan');
const Attendance = require('./models/Attendance');
const WeightLog = require('./models/WeightLog');

const seedDatabase = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    console.log('Clearing existing collections...');
    await User.deleteMany({});
    await MembershipPlan.deleteMany({});
    await Membership.deleteMany({});
    await WorkoutPlan.deleteMany({});
    await Attendance.deleteMany({});
    await WeightLog.deleteMany({});

    console.log('Creating Admin account...');
    const admin = new User({
      name: 'Gym Admin',
      email: 'admin@gym.com',
      password: 'admin123', // Will be hashed by pre-save hook
      role: 'admin',
      phone: '+91 98765 00001'
    });
    await admin.save();
    console.log('Admin created: admin@gym.com / admin123');

    console.log('Creating Trainers...');
    const trainer1 = new User({
      name: 'Rahul Sharma',
      email: 'rahul@gym.com',
      password: 'trainer123',
      role: 'trainer',
      phone: '+91 98765 00002'
    });
    const trainer2 = new User({
      name: 'Aman Verma',
      email: 'aman@gym.com',
      password: 'trainer123',
      role: 'trainer',
      phone: '+91 98765 00003'
    });
    const trainer3 = new User({
      name: 'Priya Singh',
      email: 'priya@gym.com',
      password: 'trainer123',
      role: 'trainer',
      phone: '+91 98765 00004'
    });

    await Promise.all([trainer1.save(), trainer2.save(), trainer3.save()]);
    console.log('3 Trainers created (password: trainer123)');

    console.log('Creating Membership Plans...');
    const planMonthly = await MembershipPlan.create({
      name: 'Monthly Plan',
      duration: 30,
      price: 1499,
      description: 'Standard access to gym equipment and locker facilities for 30 days.'
    });

    const planQuarterly = await MembershipPlan.create({
      name: 'Quarterly Plan',
      duration: 90,
      price: 3499,
      description: '3 months full fitness access including cardio and strength zones.'
    });

    const planHalfYearly = await MembershipPlan.create({
      name: 'Half Yearly Plan',
      duration: 180,
      price: 5999,
      description: '6 months access with complimentary fitness assessment.'
    });

    const planYearly = await MembershipPlan.create({
      name: 'Yearly Plan',
      duration: 365,
      price: 9999,
      description: 'Full year VIP gym access, free shower/locker, and guest passes.'
    });
    console.log('4 Membership plans created');

    console.log('Creating Members...');
    const membersData = [
      { name: 'Vikas Kumar', email: 'vikas@gym.com', phone: '+91 98111 11101', trainer: trainer1._id },
      { name: 'Sneha Patel', email: 'sneha@gym.com', phone: '+91 98111 11102', trainer: trainer1._id },
      { name: 'Rohan Gupta', email: 'rohan@gym.com', phone: '+91 98111 11103', trainer: trainer2._id },
      { name: 'Ananya Roy', email: 'ananya@gym.com', phone: '+91 98111 11104', trainer: trainer2._id },
      { name: 'Amit Mishra', email: 'amit@gym.com', phone: '+91 98111 11105', trainer: trainer3._id },
      { name: 'Pooja Sharma', email: 'pooja@gym.com', phone: '+91 98111 11106', trainer: trainer3._id },
      { name: 'Deepak Verma', email: 'deepak@gym.com', phone: '+91 98111 11107', trainer: null },
      { name: 'Kavita Joshi', email: 'kavita@gym.com', phone: '+91 98111 11108', trainer: null }
    ];

    const savedMembers = [];
    for (const data of membersData) {
      const member = new User({
        ...data,
        password: 'member123',
        role: 'member'
      });
      await member.save();
      savedMembers.push(member);
    }
    console.log(`${savedMembers.length} Members created (password: member123)`);

    console.log('Creating Memberships with varied expiry states...');
    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    // 1. Vikas Kumar - Active Quarterly (ends in 60 days)
    await Membership.create({
      member: savedMembers[0]._id,
      plan: planQuarterly._id,
      startDate: new Date(now.getTime() - 30 * dayMs),
      endDate: new Date(now.getTime() + 60 * dayMs),
      status: 'Active'
    });

    // 2. Sneha Patel - Expiring Soon! (ends in 3 days)
    await Membership.create({
      member: savedMembers[1]._id,
      plan: planMonthly._id,
      startDate: new Date(now.getTime() - 27 * dayMs),
      endDate: new Date(now.getTime() + 3 * dayMs),
      status: 'Active'
    });

    // 3. Rohan Gupta - Active Yearly (ends in 250 days)
    await Membership.create({
      member: savedMembers[2]._id,
      plan: planYearly._id,
      startDate: new Date(now.getTime() - 115 * dayMs),
      endDate: new Date(now.getTime() + 250 * dayMs),
      status: 'Active'
    });

    // 4. Ananya Roy - Expiring Soon! (ends in 5 days)
    await Membership.create({
      member: savedMembers[3]._id,
      plan: planQuarterly._id,
      startDate: new Date(now.getTime() - 85 * dayMs),
      endDate: new Date(now.getTime() + 5 * dayMs),
      status: 'Active'
    });

    // 5. Amit Mishra - Active Half Yearly (ends in 100 days)
    await Membership.create({
      member: savedMembers[4]._id,
      plan: planHalfYearly._id,
      startDate: new Date(now.getTime() - 80 * dayMs),
      endDate: new Date(now.getTime() + 100 * dayMs),
      status: 'Active'
    });

    // 6. Pooja Sharma - Expired! (ended 10 days ago)
    await Membership.create({
      member: savedMembers[5]._id,
      plan: planMonthly._id,
      startDate: new Date(now.getTime() - 40 * dayMs),
      endDate: new Date(now.getTime() - 10 * dayMs),
      status: 'Expired'
    });

    // 7. Deepak Verma - Expired! (ended 25 days ago)
    await Membership.create({
      member: savedMembers[6]._id,
      plan: planQuarterly._id,
      startDate: new Date(now.getTime() - 115 * dayMs),
      endDate: new Date(now.getTime() - 25 * dayMs),
      status: 'Expired'
    });

    // (Member 8 Kavita Joshi has no plan yet)
    console.log('Memberships seeded (Active, Expiring Soon, and Expired)');

    console.log('Creating Workout Plans...');
    // Workout for Vikas Kumar by Rahul Sharma
    await WorkoutPlan.create({
      member: savedMembers[0]._id,
      trainer: trainer1._id,
      planName: 'Strength & Hypertrophy Split',
      exercises: [
        { exercise: 'Bench Press', sets: 4, reps: 10, dayOfWeek: 'Monday' },
        { exercise: 'Incline Dumbbell Press', sets: 3, reps: 12, dayOfWeek: 'Monday' },
        { exercise: 'Push Ups', sets: 3, reps: 15, dayOfWeek: 'Monday' },
        { exercise: 'Barbell Squats', sets: 4, reps: 10, dayOfWeek: 'Tuesday' },
        { exercise: 'Leg Press', sets: 3, reps: 12, dayOfWeek: 'Tuesday' },
        { exercise: 'Calf Raises', sets: 4, reps: 15, dayOfWeek: 'Tuesday' },
        { exercise: 'Deadlift', sets: 4, reps: 8, dayOfWeek: 'Wednesday' },
        { exercise: 'Lat Pulldown', sets: 3, reps: 12, dayOfWeek: 'Wednesday' },
        { exercise: 'Seated Cable Row', sets: 3, reps: 12, dayOfWeek: 'Wednesday' },
        { exercise: 'Overhead Shoulder Press', sets: 4, reps: 10, dayOfWeek: 'Thursday' },
        { exercise: 'Lateral Raises', sets: 4, reps: 15, dayOfWeek: 'Thursday' },
        { exercise: 'Barbell Bicep Curls', sets: 3, reps: 12, dayOfWeek: 'Friday' },
        { exercise: 'Tricep Rope Pushdown', sets: 3, reps: 12, dayOfWeek: 'Friday' }
      ]
    });

    // Workout for Sneha Patel by Rahul Sharma
    await WorkoutPlan.create({
      member: savedMembers[1]._id,
      trainer: trainer1._id,
      planName: 'Cardio & Full Body Tone',
      exercises: [
        { exercise: 'Treadmill Interval Run', sets: 1, reps: 20, dayOfWeek: 'Monday' },
        { exercise: 'Goblet Squats', sets: 3, reps: 15, dayOfWeek: 'Monday' },
        { exercise: 'Kettlebell Swings', sets: 3, reps: 15, dayOfWeek: 'Wednesday' },
        { exercise: 'Plank Holds', sets: 3, reps: 60, dayOfWeek: 'Wednesday' },
        { exercise: 'Dumbbell Lunges', sets: 3, reps: 12, dayOfWeek: 'Friday' }
      ]
    });

    // Workout for Rohan Gupta by Aman Verma
    await WorkoutPlan.create({
      member: savedMembers[2]._id,
      trainer: trainer2._id,
      planName: 'Powerlifting Core Focus',
      exercises: [
        { exercise: 'Heavy Deadlift', sets: 5, reps: 5, dayOfWeek: 'Monday' },
        { exercise: 'Heavy Back Squat', sets: 5, reps: 5, dayOfWeek: 'Wednesday' },
        { exercise: 'Heavy Bench Press', sets: 5, reps: 5, dayOfWeek: 'Friday' }
      ]
    });
    console.log('Workout plans seeded');

    console.log('Creating Attendance records...');
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's attendance for Vikas, Sneha, Rohan, Amit
    const attendeesToday = [savedMembers[0], savedMembers[1], savedMembers[2], savedMembers[4]];
    for (const m of attendeesToday) {
      await Attendance.create({
        member: m._id,
        date: today,
        status: 'Present'
      });
    }

    // Past attendance for Vikas (to demonstrate history)
    for (let i = 1; i <= 10; i++) {
      const pastDate = new Date(today.getTime() - i * dayMs);
      await Attendance.create({
        member: savedMembers[0]._id,
        date: pastDate,
        status: 'Present'
      });
    }
    console.log('Attendance records seeded');

    console.log('Creating Weight Logs for Vikas Kumar (for Chart.js)...');
    const sampleWeights = [
      { daysAgo: 45, weight: 75.8 },
      { daysAgo: 38, weight: 75.2 },
      { daysAgo: 30, weight: 74.5 },
      { daysAgo: 22, weight: 73.9 },
      { daysAgo: 15, weight: 73.1 },
      { daysAgo: 8, weight: 72.4 },
      { daysAgo: 2, weight: 71.8 }
    ];

    for (const entry of sampleWeights) {
      const date = new Date(now.getTime() - entry.daysAgo * dayMs);
      await WeightLog.create({
        member: savedMembers[0]._id,
        weight: entry.weight,
        date
      });
    }
    console.log('Weight logs seeded for Vikas Kumar');

    console.log('\n========================================');
    console.log('DATABASE SEEDED SUCCESSFULLY!');
    console.log('Demo Logins:');
    console.log('Admin:   admin@gym.com   / admin123');
    console.log('Trainer: rahul@gym.com   / trainer123');
    console.log('Member:  vikas@gym.com   / member123');
    console.log('========================================\n');

    process.exit(0);
  } catch (err) {
    console.error('Seeding error:', err);
    process.exit(1);
  }
};

seedDatabase();
