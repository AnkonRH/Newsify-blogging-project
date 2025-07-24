const { Router } = require('express');
const crypto = require('crypto');
const User = require('../models/user');
const sendEmail = require('../utils/sendEmail');

const router = Router();

// Utility to get email provider URL
const getEmailProviderUrl = (email) => {
  if (!email) return null;
  const domain = email.split('@')[1].toLowerCase();
  if (domain.includes('gmail.com')) return 'https://mail.google.com/';
  if (domain.includes('yahoo.com')) return 'https://mail.yahoo.com/';
  if (domain.includes('outlook.com') || domain.includes('hotmail.com') || domain.includes('live.com'))
    return 'https://outlook.live.com/';
  if (domain.includes('icloud.com')) return 'https://www.icloud.com/mail';
  return null;
};

// Views
router.get('/signup', (req, res) => res.render('signup', { error: null }));
router.get('/signin', (req, res) => res.render('signin', { error: null }));
router.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/');
});

// ✅ SIGNUP
router.post('/signup', async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).render('signup', { error: 'Email already exists. Please use a different one.' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyTokenExpiry = Date.now() + 3600000;

    const user = await User.create({
      fullName,
      email,
      password,
      verifyToken,
      verifyTokenExpiry,
    });

    const link = `${process.env.BASE_URL}/user/verify-email?token=${verifyToken}`;
    await sendEmail(email, 'Verify your email', `<p>Click <a href="${link}">here</a> to verify your email.</p>`);

    res.render('message', {
      title: 'Check Your Email',
      message: 'Check your email to verify your account.'
    });
  } catch (err) {
    console.error('Signup error:', err.message);
    res.status(500).render('signup', { error: 'Something went wrong. Please try again.' });
  }
});

// ✅ VERIFY EMAIL
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  const user = await User.findOne({
    verifyToken: token,
    verifyTokenExpiry: { $gt: Date.now() }
  });

  if (!user) {
    return res.render('message', {
      title: 'Verification Failed',
      message: 'Invalid or expired verification link.'
    });
  }

  user.isVerified = true;
  user.verifyToken = undefined;
  user.verifyTokenExpiry = undefined;
  await user.save();

  res.render('message', {
    title: 'Email Verified',
    message: 'Email verified! You can now <a href="/user/signin">sign in</a>.'
  });
});

// ✅ SIGNIN
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    const token = await User.matchPassword(email, password);

    return res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 86400000,
    }).redirect('/');
  } catch (err) {
    console.error("Signin error:", err.message);
    return res.status(401).render('signin', { error: err.message });
  }
});

// ✅ FORGOT PASSWORD
router.get('/forgot-password', (req, res) => {
  res.render('forgot-password');
});

router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email });

  const emailProviderUrl = getEmailProviderUrl(email);

  if (!user) {
    // Still show message even if user not found (for security)
    return res.render('email-sent', { emailProviderUrl });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = token;
  user.resetPasswordExpiry = Date.now() + 3600000;
  await user.save();

  const link = `${process.env.BASE_URL}/user/reset-password?token=${token}`;
  await sendEmail(email, 'Reset Password', `<p><a href="${link}">Reset your password</a></p>`);

  res.render('email-sent', { emailProviderUrl });
});

// ✅ RESET PASSWORD
router.get('/reset-password', (req, res) => {
  const { token } = req.query;
  if (!token) {
    return res.render('message', {
      title: 'Invalid Link',
      message: 'Reset link is missing or invalid.'
    });
  }

  res.render('reset-password', { token });
});

router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpiry: { $gt: Date.now() },
  });

  if (!user) {
    return res.render('message', {
      title: 'Link Expired',
      message: 'Invalid or expired token.'
    });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpiry = undefined;
  await user.save();

  res.render('reset-success');
});

module.exports = router;
