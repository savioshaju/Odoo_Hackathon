const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../model/userModel')
const { Subscription } = require('../model/subscriptionModel')
const { Service } = require('../model/serviceModel')

const JWT_SECRET = process.env.JWT_SECRET_KEY || 'your-secret-key'

// POST /admin/register or /admin/signup
async function adminSignup(req, res, next) {
    try {
        const { name, email, password, phone } = req.body

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'Name, email, and password are required' })
        }

        const existingUser = await User.findOne({ email: email.toLowerCase() })
        if (existingUser) {
            return res.status(409).json({ success: false, message: 'An account with this email already exists' })
        }

        const hashedPassword = await bcrypt.hash(password, 10)

        const newAdmin = await User.create({
            name: name.trim(),
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            phone: phone || '',
            role: 'admin',
            isActive: true
        })

        const adminData = {
            _id: newAdmin._id,
            name: newAdmin.name,
            email: newAdmin.email,
            phone: newAdmin.phone,
            role: newAdmin.role,
            isActive: newAdmin.isActive,
            createdAt: newAdmin.createdAt
        }

        return res.status(201).json({
            success: true,
            message: 'Admin account created successfully',
            admin: adminData
        })
    } catch (err) {
        next(err)
    }
}

// POST /admin/login
async function adminLogin(req, res, next) {
    try {
        const { email, password } = req.body

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' })
        }

        const admin = await User.findOne({ email: email.toLowerCase() })
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' })
        }

        if (admin.role !== 'admin') {
            return res.status(403).json({ success: false, message: 'Access denied: not an admin' })
        }

        if (!admin.isActive) {
            return res.status(403).json({ success: false, message: 'Your account has been deactivated' })
        }

        const isMatch = await bcrypt.compare(password, admin.password)
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' })
        }

        const token = jwt.sign(
            { id: admin._id, email: admin.email, role: admin.role },
            JWT_SECRET,
            { expiresIn: '7d' }
        )

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        })

        return res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            admin: {
                _id: admin._id,
                name: admin.name,
                email: admin.email,
                phone: admin.phone,
                role: admin.role
            }
        })
    } catch (err) {
        next(err)
    }
}

// POST /admin/logout
async function adminLogout(req, res, next) {
    try {
        res.clearCookie('token', {
            httpOnly: true,
            sameSite: 'lax'
        })
        return res.status(200).json({ success: true, message: 'Logged out successfully' })
    } catch (err) {
        next(err)
    }
}

// GET /admin/profile
async function getAdminProfile(req, res, next) {
    try {
        const adminId = req.user?.id || req.user?._id
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }

        const admin = await User.findById(adminId).select('-password')
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin profile not found' })
        }

        return res.status(200).json({ success: true, admin })
    } catch (err) {
        next(err)
    }
}

// PUT /admin/profile
async function updateAdminProfile(req, res, next) {
    try {
        const adminId = req.user?.id || req.user?._id
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }

        const { name, phone } = req.body
        const updates = {}
        if (name !== undefined) updates.name = name.trim()
        if (phone !== undefined) updates.phone = phone.trim()

        const updatedAdmin = await User.findByIdAndUpdate(
            adminId,
            { $set: updates },
            { returnDocument: 'after', runValidators: true }
        ).select('-password')

        if (!updatedAdmin) {
            return res.status(404).json({ success: false, message: 'Admin not found' })
        }

        return res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            admin: updatedAdmin
        })
    } catch (err) {
        next(err)
    }
}

// DELETE /admin/account
async function deleteAdminAccount(req, res, next) {
    try {
        const adminId = req.user?.id || req.user?._id
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }

        const admin = await User.findByIdAndUpdate(
            adminId,
            { $set: { isActive: false } },
            { returnDocument: 'after' }
        )

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' })
        }

        res.clearCookie('token')
        return res.status(200).json({
            success: true,
            message: 'Admin account deactivated successfully'
        })
    } catch (err) {
        next(err)
    }
}

// PUT /admin/change-password
async function changeAdminPassword(req, res, next) {
    try {
        const adminId = req.user?.id || req.user?._id
        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' })
        }

        const { currentPassword, newPassword } = req.body
        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Both current password and new password are required'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            })
        }

        const admin = await User.findById(adminId)
        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' })
        }

        const isMatch = await bcrypt.compare(currentPassword, admin.password)
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect' })
        }

        const hashedNewPassword = await bcrypt.hash(newPassword, 10)
        admin.password = hashedNewPassword
        await admin.save()

        return res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        })
    } catch (err) {
        next(err)
    }
}

// POST /admin/forgot-password
async function forgotAdminPassword(req, res, next) {
    try {
        const { email } = req.body
        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' })
        }

        const admin = await User.findOne({ email: email.toLowerCase(), role: 'admin' })
        if (!admin) {
            return res.status(200).json({
                success: true,
                message: 'If an admin account with that email exists, password reset instructions have been sent'
            })
        }

        const resetToken = jwt.sign(
            { id: admin._id, purpose: 'password_reset' },
            JWT_SECRET,
            { expiresIn: '15m' }
        )

        return res.status(200).json({
            success: true,
            message: 'Password reset token generated',
            resetToken
        })
    } catch (err) {
        next(err)
    }
}

// POST /admin/reset-password
async function resetAdminPassword(req, res, next) {
    try {
        const { token, newPassword } = req.body
        if (!token || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Reset token and new password are required'
            })
        }

        if (newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'New password must be at least 6 characters long'
            })
        }

        let decoded
        try {
            decoded = jwt.verify(token, JWT_SECRET)
        } catch {
            return res.status(400).json({ success: false, message: 'Invalid or expired reset token' })
        }

        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ success: false, message: 'Invalid token type' })
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10)
        const admin = await User.findByIdAndUpdate(decoded.id, {
            $set: { password: hashedPassword }
        })

        if (!admin) {
            return res.status(404).json({ success: false, message: 'Admin not found' })
        }

        return res.status(200).json({
            success: true,
            message: 'Password has been reset successfully. You can now log in.'
        })
    } catch (err) {
        next(err)
    }
}

// GET /admin/overview - Real database aggregation of users, services, subscriptions, and revenue
async function getAdminOverview(req, res, next) {
    try {
        const [totalUsers, totalServices, totalSubscriptions, activeSubscriptions, allSubs] = await Promise.all([
            User.countDocuments(),
            Service.countDocuments({ isActive: true }),
            Subscription.countDocuments(),
            Subscription.countDocuments({ status: 'active' }),
            Subscription.find({}, 'amountPaid status')
        ]);

        let totalRevenue = 0;
        let monthlyRecurringRevenue = 0;

        allSubs.forEach(sub => {
            const amount = Number(sub.amountPaid) || 0;
            totalRevenue += amount;
            if (sub.status === 'active') {
                monthlyRecurringRevenue += amount;
            }
        });

        return res.status(200).json({
            success: true,
            stats: {
                totalUsers,
                totalServices,
                totalSubscriptions,
                activeSubscriptions,
                totalRevenue,
                monthlyRecurringRevenue
            }
        });
    } catch (err) {
        next(err);
    }
}

// GET /admin/users - List all users in MongoDB
async function getAllUsers(req, res, next) {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (err) {
        next(err);
    }
}

// PUT /admin/users/:id/role - Update user role
async function updateUserRole(req, res, next) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!['user', 'admin'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Role must be user or admin' });
        }

        const user = await User.findByIdAndUpdate(
            id,
            { $set: { role } },
            { returnDocument: 'after' }
        ).select('-password');

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            message: `User role updated to ${role}`,
            user
        });
    } catch (err) {
        next(err);
    }
}

// PUT /admin/users/:id/status - Toggle active/inactive
async function toggleUserStatus(req, res, next) {
    try {
        const { id } = req.params;
        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.isActive = !user.isActive;
        await user.save();

        return res.status(200).json({
            success: true,
            message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (err) {
        next(err);
    }
}

module.exports = {
    adminSignup,
    adminLogin,
    adminLogout,
    getAdminProfile,
    updateAdminProfile,
    deleteAdminAccount,
    changeAdminPassword,
    forgotAdminPassword,
    resetAdminPassword,
    getAdminOverview,
    getAllUsers,
    updateUserRole,
    toggleUserStatus
}
