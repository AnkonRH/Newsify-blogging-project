const { validatetoken } = require('../service/authentication');
const User = require('../models/user'); // ✅ Needed to fetch full user

function checkforauthenticationcookie(cookieName) {
  return async (req, res, next) => {
    const token = req.cookies[cookieName];

    if (!token) {
      return next(); // No token, proceed without user
    }

    try {
      const decoded = validatetoken(token); // contains _id from payload

      if (decoded?._id) {
        const user = await User.findById(decoded._id);
        if (user) {
          req.user = user; // ✅ attach full user
        }
      }
    } catch (err) {
      console.error("Invalid token:", err.message);
    }

    next(); // Always call next
  };
}

module.exports = checkforauthenticationcookie;
