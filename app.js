require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const flash = require('connect-flash');
const methodOverride = require('method-override');

const connectDB = require('./config/db');

// Import routes
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const trainerRoutes = require('./routes/trainerRoutes');
const memberRoutes = require('./routes/memberRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB Atlas
connectDB();

// View engine setup (EJS)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser & HTTP Method Override
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(methodOverride('_method'));

// Static files (CSS, JS, images)
app.use(express.static(path.join(__dirname, 'public')));

// Session configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'gym_management_super_secret_session_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 // 24 hours
    }
  })
);

// Flash messages
app.use(flash());

// Global variables for templates
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error = req.flash('error');
  res.locals.activePage = '';
  next();
});

// Mount Routes
app.use('/', authRoutes);
app.use('/admin', adminRoutes);
app.use('/trainer', trainerRoutes);
app.use('/member', memberRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('partials/error', {
    title: '404 - Page Not Found',
    errorCode: 404,
    message: 'The page you are looking for does not exist or has been moved.'
  });
});

// General Error handler
app.use((err, req, res, next) => {
  console.error('Unhandled Application Error:', err);
  res.status(500).render('partials/error', {
    title: '500 - Server Error',
    errorCode: 500,
    message: 'An unexpected error occurred. Please try again later.'
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

module.exports = app;
