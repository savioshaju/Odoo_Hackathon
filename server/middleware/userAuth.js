const jwt = require('jsonwebtoken')
const { User } = require('../model/userModel')

async function userAuth(req, res, next) {
    try {
        console.log('Routes: user auth')

        // Support token from cookie or Authorization header Bearer token
        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' })
        }

        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret'
        const decodedToken = jwt.verify(token, secretKey)

        if (!decodedToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized user' })
        }

        const role = decodedToken.role

        if (role !== 'user') {
            return res.status(403).json({ success: false, message: 'Forbidden: Unauthorized user' })
        }

        req.user = decodedToken
        req.userId = decodedToken.id || decodedToken._id

        next()
    } catch (err) {
        console.error('userAuth error:', err.message);
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired token' })
    }
}

module.exports = { userAuth }
