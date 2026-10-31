const jwt = require('jsonwebtoken');
const { User } = require('../model/userModel');

async function adminAuth(req, res, next) {
    try {
        console.log('Routes: admin auth');

        let token = req.cookies?.token;
        if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'Unauthorized: No token provided' });
        }

        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret';
        const decodedToken = jwt.verify(token, secretKey);

        if (!decodedToken) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Invalid token' });
        }

        const adminId = decodedToken.id || decodedToken._id;
        const adminExist = await User.findById(adminId).select('-password');

        if (!adminExist) {
            return res.status(401).json({ success: false, message: 'Unauthorized: Admin user not found' });
        }

        if (adminExist.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Forbidden: Admin access required' });
        }

        if (!adminExist.isActive) {
            return res.status(403).json({ success: false, message: 'Forbidden: Account deactivated' });
        }

        req.user = adminExist;
        req.userId = adminExist._id;

        next();
    } catch (err) {
        console.error('adminAuth error:', err.message);
        return res.status(401).json({ success: false, message: 'Unauthorized: Invalid or expired admin token' });
    }
}

module.exports = { adminAuth };
