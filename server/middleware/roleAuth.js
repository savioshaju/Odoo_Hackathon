const jwt = require('jsonwebtoken');

/**
 * Universal Role-Based Authorization Middleware
 * Enforces role restrictions (system strictly supports 'user' and 'admin').
 * Usage:
 *   requireRole('admin') - only admin
 *   requireRole(['user', 'admin']) - user or admin
 */
function requireRole(allowedRoles = []) {
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    return (req, res, next) => {
        try {
            // Support token from cookie or Authorization header Bearer token
            let token = req.cookies?.token;
            if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
                token = req.headers.authorization.split(' ')[1];
            }

            if (!token) {
                return res.status(401).json({ success: false, message: 'Authentication required. Please log in.' });
            }

            const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret';
            const decoded = jwt.verify(token, secretKey);

            if (!decoded || !decoded.role) {
                return res.status(401).json({ success: false, message: 'Invalid authentication session.' });
            }

            req.user = decoded;
            req.userId = decoded.id || decoded._id;

            // Enforce role check if roles are specified
            if (roles.length > 0 && !roles.includes(decoded.role)) {
                return res.status(403).json({ 
                    success: false, 
                    message: `Forbidden: Access restricted. Role required: [${roles.join(', ')}]. Current role: '${decoded.role}'.` 
                });
            }

            next();
        } catch (err) {
            console.error('requireRole error:', err.message);
            return res.status(401).json({ success: false, message: 'Session expired or invalid. Please log in.' });
        }
    };
}

module.exports = { requireRole };
