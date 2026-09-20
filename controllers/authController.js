const User = require('../models/User');

// GET /login
exports.getLogin = (req, res) => {
  res.render('auth/login', {
    title: 'Login - Gym Management System'
  });
};

// POST /login
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      req.flash('error', 'Please provide both email and password.');
      return res.redirect('/login');
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      req.flash('error', 'Invalid email or password.');
      return res.redirect('/login');
    }

    // Set user in session
    req.session.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone
    };

    req.flash('success', `Welcome back, ${user.name}!`);

    // Role-based redirection
    if (user.role === 'admin') {
      return res.redirect('/admin/dashboard');
    } else if (user.role === 'trainer') {
      return res.redirect('/trainer/dashboard');
    } else {
      return res.redirect('/member/dashboard');
    }
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'An error occurred during login. Please try again.');
    res.redirect('/login');
  }
};

// GET /register
exports.getRegister = (req, res) => {
  res.render('auth/register', {
    title: 'Member Registration - Gym Management System'
  });
};

// POST /register
exports.postRegister = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, phone } = req.body;

    // Validation
    if (!name || !email || !password) {
      req.flash('error', 'Please fill in all required fields.');
      return res.redirect('/register');
    }

    if (password.length < 6) {
      req.flash('error', 'Password must be at least 6 characters long.');
      return res.redirect('/register');
    }

    if (password !== confirmPassword) {
      req.flash('error', 'Passwords do not match.');
      return res.redirect('/register');
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      req.flash('error', 'An account with this email address already exists.');
      return res.redirect('/register');
    }

    // Always enforce role 'member' for public registration
    const newMember = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password,
      role: 'member',
      phone: phone ? phone.trim() : ''
    });

    await newMember.save();

    // Automatically log in newly registered member
    req.session.user = {
      id: newMember._id.toString(),
      name: newMember.name,
      email: newMember.email,
      role: newMember.role,
      phone: newMember.phone
    };

    req.flash('success', 'Registration successful! Welcome to the gym family.');
    res.redirect('/member/dashboard');
  } catch (error) {
    console.error('Registration error:', error);
    req.flash('error', 'Registration failed. ' + error.message);
    res.redirect('/register');
  }
};

// GET /logout
exports.logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destroy error:', err);
    }
    res.redirect('/login');
  });
};
