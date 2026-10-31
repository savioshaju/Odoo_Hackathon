const jwt = require('jsonwebtoken')
const { User } = require('../model/userModel')

/**
 * userAuth Middleware
 * Authenticates requests for standard user access.
 * Accepts tokens from HTTP cookies or Authorization header (Bearer token).
 * Allows registered users (role: 'user' or 'admin').
 */
async function userAuth(req, res, next) {
    try {
        console.log('Routes: user auth')

        // Support token from cookie or Authorization header Bearer token
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Please log in to continue' })
        }

        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret'
        const decodedToken = jwt.verify(token, secretKey)

        if (!decodedToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token session' })
        }

        const role = decodedToken.role

        // System has only two roles: 'user' and 'admin'
        if (role !== 'user' && role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Access restricted to registered users' })
        }

        req.user = decodedToken
        req.userId = decodedToken.id || decodedToken._id

        next()
    } catch (err) {
        console.error('userAuth error:', err.message);
        return res.status(401).json({ success: false, message: 'Unauthorized: Session expired or invalid' })
    }
}

module.exports = { userAuth }
