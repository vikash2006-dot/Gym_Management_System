# TitanFit — Gym Membership & Workout Plan Management System

A production-style, full-stack MVC web application for modern fitness centers and gym management, designed with Role-Based Access Control (RBAC), real-time database-driven metrics, attendance tracking, personalized workout planner, body weight logging, and interactive Chart.js visualizations.

---

## 1. Project Overview

**TitanFit Gym Management System** streamlines day-to-day gym operations across three distinct user roles:
- **Admin**: Oversees the entire facility, manages member directories, configures membership plans, recruits trainers, assigns coaches, monitors memberships expiring within 7 days, and inspects dynamic operational analytics.
- **Trainer**: Manages assigned gym members, inspects attendance, and designs customized weekly workout routines with dynamic exercise sets and repetitions.
- **Member**: Accesses an interactive dashboard featuring active subscription details, assigned trainer contact information, one-click daily attendance check-in, weekly day-by-day workout splits, body weight tracker, and interactive visual progress charts.

---

## 2. Technology Stack

- **Backend**: Node.js & Express.js (MVC Pattern)
- **Database**: MongoDB Atlas via Mongoose ODM
- **Frontend Template Engine**: EJS (Embedded JavaScript)
- **Styling**: Modern Vanilla CSS3 (Curated dark slate theme, glassmorphism, responsive grid & flexbox layouts, micro-animations)
- **Client Logic**: Vanilla JavaScript
- **Authentication**: `bcryptjs` password hashing with `express-session` and `connect-flash`
- **Charts & Visualizations**: Chart.js (CDN) for member weight tracking and admin membership plan distribution
- **Iconography**: Font Awesome 6 (CDN)

---

## 3. Project Architecture

```
Gym_Management/
├── app.js                   # Application entrypoint and middleware orchestration
├── package.json             # NPM dependencies and script definitions
├── .env                     # Environment variables (DB URI, Port, Session Secret)
├── .gitignore               # Ignored version control files
├── seed.js                  # Automated database population script
├── README.md                # Comprehensive documentation
│
├── config/
│   └── db.js                # MongoDB Atlas connection handler
│
├── models/
│   ├── User.js              # User schema (Admin, Trainer, Member) with bcrypt hooks
│   ├── MembershipPlan.js    # Tiered membership packages (Monthly, Quarterly, Yearly)
│   ├── Membership.js        # Member-Plan subscription bridge with dynamic expiry logic
│   ├── WorkoutPlan.js       # Day-by-day exercise schedules created by trainers
│   ├── Attendance.js        # Daily attendance tracking with duplicate check-in guards
│   └── WeightLog.js         # Historical body weight progression logs
│
├── controllers/
│   ├── authController.js    # Authentication: Login, Member Registration, and Logout
│   ├── adminController.js   # Administrative analytics, CRUD for members, plans, & trainers
│   ├── trainerController.js # Trainer portal, assigned trainees, and workout designer
│   └── memberController.js  # Member dashboard, routine schedule, attendance, & weight chart API
│
├── routes/
│   ├── authRoutes.js        # Public auth routes
│   ├── adminRoutes.js       # Protected routes for Admin role
│   ├── trainerRoutes.js     # Protected routes for Trainer role
│   └── memberRoutes.js      # Protected routes for Member role
│
├── middleware/
│   ├── auth.js              # Session verification and route protection
│   └── role.js              # Strict Role-Based Access Control (RBAC) middleware
│
├── views/
│   ├── partials/
│   │   ├── header.ejs       # Head tags, Google fonts, FontAwesome, Chart.js CDN
│   │   ├── navbar.ejs       # Responsive brand navbar with role indicators
│   │   ├── sidebar.ejs      # Role-specific navigation drawer
│   │   ├── flash.ejs        # Dismissible feedback alerts
│   │   ├── footer.ejs       # Footer and script imports
│   │   └── error.ejs        # Styled 404 & 500 error display
│   │
│   ├── auth/
│   │   ├── login.ejs        # Sign-in portal with quick demo credentials
│   │   └── register.ejs     # Public member onboarding registration
│   │
│   ├── admin/
│   │   ├── dashboard.ejs    # Real-time metrics & plan distribution donut chart
│   │   ├── members.ejs      # Filterable & searchable member directory
│   │   ├── add-member.ejs   # Member creation form with optional plan/trainer
│   │   ├── edit-member.ejs  # Member update form
│   │   ├── assign-membership.ejs # Subscription renewal and assignment
│   │   ├── membership-plans.ejs  # Plan catalog with active subscriber counts
│   │   ├── add-plan.ejs     # Plan creation form
│   │   ├── edit-plan.ejs    # Plan modification form
│   │   ├── trainers.ejs     # Trainer roster with assigned trainee counts
│   │   ├── add-trainer.ejs  # Trainer recruitment form
│   │   ├── assign-trainer.ejs # Dedicated trainer-member assignment interface
│   │   └── expiring-memberships.ejs # 7-day expiration watchlist
│   │
│   ├── trainer/
│   │   ├── dashboard.ejs    # Trainee metrics and pending routine alerts
│   │   ├── members.ejs      # Scoped list of assigned members
│   │   ├── create-workout.ejs # Dynamic exercise row workout creator
│   │   ├── edit-workout.ejs # Workout routine editor
│   │   └── workout-plans.ejs# Catalog of created workout routines
│   │
│   └── member/
│       ├── dashboard.ejs    # Summary dashboard with quick attendance & today's workout
│       ├── workout-plan.ejs # Weekly routine grouped by day
│       ├── attendance.ejs   # Daily check-in and historical attendance table
│       ├── weight-log.ejs   # Body weight entry form and delta tracker
│       └── progress.ejs     # Interactive Chart.js transformation line chart
│
└── public/
    ├── css/
    │   └── style.css        # Responsive dark theme styling & typography
    └── js/
        └── script.js        # Mobile drawer toggle, dynamic rows, and auto-dismiss alerts
```

---

## 4. Installation & Setup

### Prerequisites
- [Node.js](https://nodejs.org/) (version 16 or higher)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or a local MongoDB instance)

### 1. Clone or Open the Project
```bash
cd /Users/vikas/Documents/Gym_Management
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Create a `.env` file in the root directory (already configured with Atlas credentials):
```env
PORT=3000
MONGODB_URI=mongodb+srv://vk2542883_db_user:Vikash7065@cluster0.2mzsngi.mongodb.net/gym_management?retryWrites=true&w=majority&appName=Cluster0
SESSION_SECRET=gym_super_secret_session_key_2026_production
```

> **Note on MongoDB URI**: In connection strings with special characters in credentials, passwords must be URI-safe. The database name is explicitly specified as `/gym_management`.

---

## 5. Seeding the Database

Populate the database with pre-configured accounts, membership tiers, sample members with varied active/expiring/expired subscriptions, workout splits, attendance records, and progressive weight entries:

```bash
npm run seed
```

When completed, the console displays:
```
========================================
DATABASE SEEDED SUCCESSFULLY!
Demo Logins:
Admin:   admin@gym.com   / admin123
Trainer: rahul@gym.com   / trainer123
Member:  vikas@gym.com   / member123
========================================
```

---

## 6. Running the Application

### Production Mode
```bash
npm start
```

### Development Mode (with Nodemon)
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 7. Default Demonstration Credentials

| Role | Email | Password | Access / Features |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@gym.com` | `admin123` | Complete administrative control, metrics, member CRUD, plan catalog, trainer allocation, expiry monitoring. |
| **Trainer** | `rahul@gym.com` | `trainer123` | Scoped trainee access, workout split builder with dynamic rows, trainee attendance check. |
| **Trainer** | `aman@gym.com` | `trainer123` | Additional trainer account. |
| **Member** | `vikas@gym.com` | `member123` | Active Quarterly plan, assigned to Rahul Sharma, 7 weight logs (75.8 kg &rarr; 71.8 kg), daily attendance check-in. |
| **Member** | `sneha@gym.com` | `member123` | Expiring Soon plan (ends in 3 days) to demonstrate expiry alerts. |
| **Member** | `pooja@gym.com` | `member123` | Expired plan to demonstrate overdue subscription status. |

*(All passwords in the database are hashed with `bcryptjs` using 10 salt rounds)*

---

## 8. Role Permissions & Access Control

| Feature | Admin | Trainer | Member | Public / Guest |
| :--- | :---: | :---: | :---: | :---: |
| Public Member Registration | ❌ | ❌ | ❌ | ✅ |
| Login / Logout | ✅ | ✅ | ✅ | ✅ |
| Admin Dashboard & Analytics | ✅ | ❌ | ❌ | ❌ |
| Create / Edit / Delete Members | ✅ | ❌ | ❌ | ❌ |
| Search & Filter Member Directory | ✅ | ❌ | ❌ | ❌ |
| Manage Membership Plans (CRUD) | ✅ | ❌ | ❌ | ❌ |
| Manage Trainers & Allocations | ✅ | ❌ | ❌ | ❌ |
| View 7-Day Expiring Memberships | ✅ | ❌ | ❌ | ❌ |
| Trainer Dashboard & Trainee Roster | ❌ | ✅ (Assigned Only) | ❌ | ❌ |
| Create / Edit Workout Plans | ❌ | ✅ (Assigned Only) | ❌ | ❌ |
| Member Dashboard & Profile | ❌ | ❌ | ✅ (Own Only) | ❌ |
| Check-in Daily Attendance | ❌ | ❌ | ✅ (Once / Day) | ❌ |
| Log Body Weight | ❌ | ❌ | ✅ (Own Only) | ❌ |
| View Weight Progress Graph | ❌ | ❌ | ✅ (Own Only) | ❌ |

- **Strict Route Protection**: Middleware `requireAuth` verifies active session; `requireRole('admin' | 'trainer' | 'member')` rejects unauthorized access with flash warnings and safe redirects.
- **Data Isolation**: Trainees belonging to Coach Aman cannot be viewed or modified by Coach Rahul; members can never inspect or manipulate another member's logs.

---

## 9. Core Business Logic Details

### Dynamic Membership Expiry
- Every `Membership` document stores `startDate` and `endDate`.
- Expiry is calculated dynamically against `new Date()`:
  - If `now > endDate`, status is **Expired**.
  - If `now <= endDate` and `endDate <= now + 7 days`, status is highlighted as **Expiring Soon** with countdown badge.
  - Otherwise, status is **Active**.

### Daily Attendance Protection
- `Attendance` model enforces unique compound index `{ member: 1, date: 1 }`.
- Date is normalized to midnight (`00:00:00.000`), ensuring that multiple check-in clicks on the same calendar date are safely rejected.

### Dynamic Dashboard Statistics
- Admin metrics are calculated live from MongoDB without hardcoded values:
  - `Total Members`: Count of all users with role `member`.
  - `Active Members`: Distinct members holding a non-expired subscription.
  - `Expired Members`: Total members minus active subscribers.
  - `Today's Attendance`: Count of check-ins registered between `00:00:00` and `23:59:59` of the current date.
  - `Plan-wise Distribution`: Real-time aggregation per plan rendered via Chart.js.

### Interactive Weight Progress Chart
- Chart.js line graph retrieves data asynchronously from `/member/api/weight-data`.
- Uses smooth cubic interpolation (`tension: 0.35`) and crimson gradient fill to illustrate body weight trajectory over time.

---

## 10. Future Improvements
- **Payment Gateway Integration**: Razorpay / Stripe for automated online plan renewal.
- **Automated Expiry Notifications**: Email/SMS reminders triggered 3 days prior to expiration via Brevo/Twilio.
- **QR Code Attendance**: Contactless kiosk scanning using member QR codes.
- **Exercise Video Tutorials**: Video library linked to specific workout exercises.
- **Diet & Nutrition Plans**: Macro-nutrient calculators and dietary meal plans created by trainers.
- **Mobile Application**: Flutter / React Native cross-platform client using REST APIs.
- **Trainer Performance Analytics**: Client retention and goal completion metrics.

---

## 11. License
This project is developed for educational and demonstration purposes. Distributed under the ISC License.
