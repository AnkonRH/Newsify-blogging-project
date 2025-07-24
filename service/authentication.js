const JWT = require('jsonwebtoken');
const User = require('../models/user');

const secret = "Ankon@5619";

function createtokenforuser(user) {
    const payload = {
        _id: user._id, // ✅ Corrected from `id`
        email: user.email,
        role: user.role,
        profileImageUrl: user.profileImageUrl
    };
    return JWT.sign(payload, secret, { expiresIn: '1h' });
}

function validatetoken(token) {
    try {
        return JWT.verify(token, secret);
    } catch (error) {
        return null;
    }
}

module.exports = {
    createtokenforuser,
    validatetoken
};
