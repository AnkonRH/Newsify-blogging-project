const { createHmac, randomBytes } = require('crypto');
const mongoose = require('mongoose');
const { createtokenforuser } = require('../service/authentication');
const { Schema } = mongoose;

const userSchema = new Schema({
  fullName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  salt: { type: String },
  password: { type: String, required: true },
  profileImageUrl: { type: String, default: "./images/default.JPG" },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  isVerified: { type: Boolean, default: false },
  verifyToken: String,
  verifyTokenExpiry: Date,
  resetPasswordToken: String,
  resetPasswordExpiry: Date,
}, { timestamps: true });

// Hash password before save
userSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    const salt = randomBytes(16).toString('hex');
    const hashedPassword = createHmac('sha256', salt)
      .update(this.password)
      .digest('hex');

    this.salt = salt;
    this.password = hashedPassword;
  }
  next();
});

// Login password check
userSchema.static("matchPassword", async function (email, password) {
  const user = await this.findOne({ email });
  if (!user) throw new Error("User not found");
  if (!user.isVerified) throw new Error("Please verify your email first");

  const salt = user.salt;
  const hashed = createHmac('sha256', salt).update(password).digest('hex');
  if (hashed !== user.password) throw new Error("Invalid password");

  const token = createtokenforuser(user);
  return token;
});

const User = mongoose.model('User', userSchema);
module.exports = User;
