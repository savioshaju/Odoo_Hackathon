const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../model/userModel');

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000
};

// 1. Staff Login
async function staffLogin(req, res, next) {
    try {
        const { identifier, email, phone, password } = req.body;
        const loginValue = (identifier || email || phone || '').toString().trim();

        if (!loginValue || !password) {
            return res.status(400).json({ success: false, message: 'Email/Phone and password are required' });
        }

        const staff = await User.findOne({
            $or: [
                { email: loginValue.toLowerCase() },
                { phone: loginValue }
            ],
            role: { $in: ['staff', 'admin'] }
        });

        if (!staff) {
            return res.status(401).json({ success: false, message: 'Invalid credentials or not authorized as staff' });
        }

        if (!staff.isActive) {
            return res.status(403).json({ success: false, message: 'Staff account is deactivated' });
        }

        const isMatch = await bcrypt.compare(password, staff.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const secretKey = process.env.JWT_SECRET_KEY || process.env.JWT_SECRET || 'default_jwt_secret';
        const token = jwt.sign(
            { id: staff._id, email: staff.email, role: staff.role },
            secretKey,
            { expiresIn: '7d' }
        );

        res.cookie('token', token, cookieOptions);

        return res.status(200).json({
            success: true,
            message: 'Staff login successful',
            token,
            user: {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role
            }
        });
    } catch (err) {
        next(err);
    }
}

// 2. Staff Registration (Admin only or onboarded by admin)
async function registerStaff(req, res, next) {
    try {
        const { name, email, phone, password } = req.body;

        if (!name || !email || !password || !phone) {
            return res.status(400).json({ success: false, message: 'Name, email, phone, and password are required' });
        }

        const existing = await User.findOne({
            $or: [{ email: email.toLowerCase().trim() }, { phone: phone.trim() }]
        });

        if (existing) {
            return res.status(409).json({ success: false, message: 'An account with this email or phone already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const newStaff = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            password: hashedPassword,
            role: 'staff',
            isActive: true
        });

        return res.status(201).json({
            success: true,
            message: 'Staff member onboarded successfully',
            staff: {
                id: newStaff._id,
                name: newStaff.name,
                email: newStaff.email,
                phone: newStaff.phone,
                role: newStaff.role
            }
        });
    } catch (err) {
        next(err);
    }
}

// 3. Staff Logout
async function staffLogout(req, res, next) {
    try {
        res.clearCookie('token', cookieOptions);
        return res.status(200).json({ success: true, message: 'Staff logged out successfully' });
    } catch (err) {
        next(err);
    }
}

// 4. Get Staff Profile
async function getStaffProfile(req, res, next) {
    try {
        const staff = await User.findById(req.userId || req.user?.id).select('-password');
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }
        return res.status(200).json({ success: true, staff });
    } catch (err) {
        next(err);
    }
}

// 5. Update Staff Profile
async function updateStaffProfile(req, res, next) {
    try {
        const { name, phone } = req.body;
        const staff = await User.findById(req.userId || req.user?.id);
        if (!staff) {
            return res.status(404).json({ success: false, message: 'Staff profile not found' });
        }

        if (name) staff.name = name.trim();
        if (phone) staff.phone = phone.trim();

        await staff.save();
        return res.status(200).json({
            success: true,
            message: 'Staff profile updated',
            staff: {
                id: staff._id,
                name: staff.name,
                email: staff.email,
                phone: staff.phone,
                role: staff.role
            }
        });
    } catch (err) {
        next(err);
    }
}

// 6. List all staff (Admin only)
async function getAllStaff(req, res, next) {
    try {
        const staffMembers = await User.find({ role: 'staff' }).select('-password');
        return res.status(200).json({ success: true, staff: staffMembers });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    staffLogin,
    registerStaff,
    staffLogout,
    getStaffProfile,
    updateStaffProfile,
    getAllStaff
};
