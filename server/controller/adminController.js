const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const { User } = require('../model/userModel')

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
            { new: true, runValidators: true }
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

        // Soft delete
        const admin = await User.findByIdAndUpdate(
            adminId,
            { $set: { isActive: false } },
            { new: true }
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
            // Avoid revealing whether account exists
            return res.status(200).json({
                success: true,
                message: 'If an admin account with that email exists, password reset instructions have been sent'
            })
        }

        // Generate short-lived reset token (15 mins)
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

module.exports = {
    adminSignup,
    adminLogin,
    adminLogout,
    getAdminProfile,
    updateAdminProfile,
    deleteAdminAccount,
    changeAdminPassword,
    forgotAdminPassword,
    resetAdminPassword
}